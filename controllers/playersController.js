const { connection } = require('../dbConnection');


const getPlayersByTeamId = (req, res) => {
    const { teamId } = req.params
    const query = "SELECT * FROM players WHERE team_id = ?"

    connection.query(query, [teamId], (error, results) => {
        if(error) {
            console.error("Error while obtaining players", error)
            res.status(500).json({ error: 'Error while obtaining players' });
        }else{
            res.status(200).json(results);
        }

    })

};

const getPlayersOnSaleByTeamId = (req, res) => {
    const { teamId } = req.params
    const query = "SELECT players.*, auctions.price FROM players JOIN auctions ON players.id = auctions.player_id WHERE players.team_id = ? AND players.on_sale = true;"

    connection.query(query, [teamId], (error, results) => {
        if(error) {
            console.error("Error while obtaining players", error)
            res.status(500).json({ error: 'Error while obtaining players' });
        }else{
            res.status(200).json(results);
        }

    })
};

const getPlayersNotOnSaleByTeamId = (req, res) => {
    const { teamId } = req.params
    const query = "SELECT * FROM players WHERE team_id = ? AND on_sale = false"

    connection.query(query, [teamId], (error, results) => {
        if(error) {
            console.error("Error while obtaining players", error)
            res.status(500).json({ error: 'Error while obtaining players' });
        }else{
            res.status(200).json(results);
        }

    })
};

const createPlayer = (req, res) => {
    const { playername, position, team_id, number } = req.body
    const checkQuery = "SELECT * FROM players WHERE name = ?"
    
    connection.query(checkQuery, [playername], (error, results) => {
        if (error) {
            console.error("Error while checking player name", error)
            res.status(500).json({ error: 'Error while checking player name' });
            return;
        }
        
        if (results.length > 0) {
            res.status(400).json({ error: 'Player name already exists' });
            return;
        }

        const query = "INSERT INTO players (name, position, team_id, number) VALUES (?, ?, ?, ?)"
        const values = [playername, position, team_id, number]
        connection.query(query, values, (error, results) => {
            if(error) {
                console.error("Error while creating player", error)
                res.status(500).json({ error: 'Error while creating player' });
            }else{
                res.status(200).json({ message: 'Player created successfully' });
            }
        })
    })
}
module.exports = {
    getPlayersByTeamId,
    getPlayersOnSaleByTeamId,
    getPlayersNotOnSaleByTeamId,
    createPlayer
}