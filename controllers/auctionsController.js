  const { connection } = require('../dbConnection');

const getAuctions = (req, res) => {
  const query = "SELECT auctions.id AS id, players.id AS player_id, players.name AS player_name, auctions.price, teams.id AS team_id, teams.name AS team_name, teams.logo AS team_logo, teams.owner_id FROM auctions JOIN players ON auctions.player_id = players.id JOIN teams ON players.team_id = teams.id WHERE auctions.state = 'pending';";

  connection.query(query, (error, results) => {
          if (error) {
              console.error("Error while obtaining auctions", error);
              res.status(500).json({ error: "Error while obtaining auctions" });
          } else {
              const auctions = results.map(row => ({
                  id: row.id,
                  player: {
                      id: row.player_id,
                      name: row.player_name,
                      team: {
                          id: row.team_id,
                          name: row.team_name,
                          logo: row.team_logo
                      },
                      price: row.price
                  },
                  team: {
                      id: row.team_id,
                      name: row.team_name,
                      logo: row.team_logo
                  }
              }));
              res.status(200).json(auctions);
          }
  });
};
  const getFinishedAuctions = (req, res) => {
    const query = `
        SELECT 
            auctions.id AS id,
            players.id AS player_id,
            players.name AS player_name,
            players.position AS player_position,
            from_team.id AS from_team_id,
            from_team.name AS from_team_name,
            from_team.logo AS from_team_logo,
            to_team.id AS to_team_id,
            to_team.name AS to_team_name,
            to_team.logo AS to_team_logo,
            auctions.price
        FROM auctions
        JOIN players ON auctions.player_id = players.id
        LEFT JOIN teams AS from_team ON auctions.from_team = from_team.id
        LEFT JOIN teams AS to_team ON auctions.to_team = to_team.id
        WHERE auctions.state = 'finished'
        ORDER BY auctions.id DESC;
    `;
    
    connection.query(query, (error, results) => {
        if (error) {
            console.error("Error while obtaining auctions", error);
            res.status(500).json({ error: "Error while obtaining auctions" });
        } else {
            const transfers = results.map(row => ({
                id: row.id,
                player: {
                    id: row.player_id,
                    name: row.player_name,
                    position: row.player_position,
                },
                from: row.from_team_id ? {
                    id: row.from_team_id,
                    name: row.from_team_name,
                    logo: row.from_team_logo,
                } : null,
                to: row.to_team_id ? {
                    id: row.to_team_id,
                    name: row.to_team_name,
                    logo: row.to_team_logo,
                } : null,
                price: row.price,
            }));
            
            res.status(200).json(transfers);
        }
    });
};

  const publishPlayer = (req, res) => {
      const { playerId, price, teamId } = req.body;
      const checkQuery = "SELECT * FROM auctions WHERE player_id = ? AND state = 'pending'";
      connection.query(checkQuery, [playerId], (error, results) => {
          if (error) {
              console.error("Error while checking player auction", error);
              res.status(500).json({ error: "Error while checking player auction" });
              return;
          }

          if (results.length > 0) {
              res.status(400).json({ error: "Player is already in auction" });
              return;
          }

          const query = "UPDATE players SET on_sale = true WHERE id = ?";
          const values = [playerId];
          connection.query(query, values, (error, results) => {
              if (error) {
                  console.error("Error while publishing player", error);
                  res.status(500).json({ error: "Error while publishing player" });
                  return;
              }
            
              const query2 = "INSERT INTO auctions (player_id, price, state, from_team) VALUES (?, ?, ?, ?)";
              const values2 = [playerId, price, "pending", teamId];
              connection.query(query2, values2, (error, results) => {
                  if (error) {
                      console.error("Error while inserting auction", error);
                      res.status(500).json({ error: "Error while inserting auction" });
                  } else {
                      res.status(200).json({ message: "Player published and auction created successfully" });
                  }
              });
          });
      });
  }

  const unpublishPlayer = (req, res) => {
      const { playerId } = req.body;

      const query = "UPDATE players SET on_sale = false WHERE id = ?";
      const values = [playerId];
      connection.query(query, values, (error, results) => {
          if (error) {
              console.error("Error while unpublishing player", error);
              res.status(500).json({ error: "Error while unpublishing player" });
              return;
          }

          const query2 = "DELETE FROM auctions WHERE player_id = ?";
          const values2 = [playerId];
          connection.query(query2, values2, (error, results) => {
              if (error) {
                  console.error("Error while deleting auction", error);
                  res.status(500).json({ error: "Error while deleting auction" });
              } else {
                  res.status(200).json({ message: "Player unpublished and auction deleted successfully" });
              }
          });
      });
  }

  const purchasePlayer = (req, res) => {
    const { auctionId, toTeamId, fromTeamId } = req.body;
    const updateAuctionQuery = "UPDATE auctions SET state = 'finished', to_team = ? WHERE id = ?";
    const updatePlayerQuery = "UPDATE players SET team_id = ?, on_sale = ? WHERE id = (SELECT player_id FROM auctions WHERE id = ?)";
    const updateUserMoneyQuery = `
      UPDATE users 
      SET money = money - ? 
      WHERE id = (SELECT owner_id FROM teams WHERE id = ?);
    `;
    const updateOtherUserMoneyQuery = `
      UPDATE users 
      SET money = money + ? 
      WHERE id = (SELECT owner_id FROM teams WHERE id = ?);
    `;
    const getAuctionQuery = "SELECT * FROM auctions WHERE id = ?";
    
    connection.beginTransaction((err) => {
      if (err) {
        console.error("Error starting transaction", err);
        res.status(500).json({ error: "Error starting transaction" });
        return;
      }
  
      connection.query(getAuctionQuery, [auctionId], (error, results) => {
        if (error) {
          return connection.rollback(() => {
            console.error("Error while getting auction", error);
            res.status(500).json({ error: "Error while getting auction" });
          });
        }
  
        const auction = results[0];
        if (!auction) {
          return connection.rollback(() => {
            res.status(404).json({ error: "Auction not found" });
          });
        }
        
        if (auction.state !== "pending") {
          return connection.rollback(() => {
            res.status(400).json({ error: "Auction is not pending" });
          });
        }
  
        const auctionPrice = auction.price;
  
        const updateAuctionValues = [toTeamId, auctionId];
        connection.query(updateAuctionQuery, updateAuctionValues, (error, results) => {
          if (error) {
            return connection.rollback(() => {
              console.error("Error while updating auction", error);
              res.status(500).json({ error: "Error while updating auction" });
            });
          }
  
          const updatePlayerValues = [toTeamId, 0, auctionId];
          connection.query(updatePlayerQuery, updatePlayerValues, (error, results) => {
            if (error) {
              return connection.rollback(() => {
                console.error("Error while updating player", error);
                res.status(500).json({ error: "Error while updating player" });
              });
            }
  
            const updateUserMoneyValues = [auctionPrice, toTeamId];
            connection.query(updateUserMoneyQuery, updateUserMoneyValues, (error, results) => {
              if (error) {
                return connection.rollback(() => {
                  console.error("Error while updating user money", error);
                  res.status(500).json({ error: "Error while updating user money" });
                });
              }
  
              const updateOtherUserMoneyValues = [auctionPrice, fromTeamId];
              connection.query(updateOtherUserMoneyQuery, updateOtherUserMoneyValues, (error, results) => {
                if (error) {
                  return connection.rollback(() => {
                    console.error("Error while updating other user's money", error);
                    res.status(500).json({ error: "Error while updating other user's money" });
                  });
                }
  
                connection.commit((err) => {
                  if (err) {
                    return connection.rollback(() => {
                      console.error("Error committing transaction", err);
                      res.status(500).json({ error: "Error committing transaction" });
                    });
                  }
  
                  res.status(200).json({ message: "Player purchased successfully" });
                });
              });
            });
          });
        });
      });
    });
  };
  
  

  module.exports = {
      publishPlayer,
      unpublishPlayer,
      getAuctions,
      getFinishedAuctions,
      purchasePlayer
  }