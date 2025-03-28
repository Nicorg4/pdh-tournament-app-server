
const { connection } = require('../dbConnection');

const createGroups = (req, res) => {
    const { groups } = req.body;

    if (!groups || !Array.isArray(groups) || groups.length === 0) {
        return res.status(400).json({ error: "Invalid groups data" });
    }

    const dropGroupPlayerTableQuery = 'TRUNCATE TABLE group_player';

    connection.query(dropGroupPlayerTableQuery, (err) => {
        if (err) {
            console.error("Error dropping group_player table", err);
        }
    });
    
    const insertGroupQuery = `
      INSERT INTO group_player (player_id, team_id, points, wins, draws, losses, group_id, goal_diff) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?);
    `;

    connection.beginTransaction((err) => {
        if (err) {
            console.error("Error starting transaction", err);
            return res.status(500).json({ error: "Error starting transaction" });
        }

        let queriesCompleted = 0;
        let hasError = false;

        groups.forEach((group, groupIndex) => {
            group.forEach(({ user, team }) => {
                if (!user || !team) {
                    hasError = true;
                    return connection.rollback(() => {
                        res.status(400).json({ error: "Invalid user or team data" });
                    });
                }

                const values = [user.id, team.id, 0, 0, 0, 0, groupIndex + 1, 0];
                connection.query(insertGroupQuery, values, (error, result) => {
                    if (error) {
                        hasError = true;
                        return connection.rollback(() => {
                            console.error("Error inserting group", error);
                            res.status(500).json({ error: "Error inserting group" });
                        });
                    }

                    queriesCompleted++;
                    if (queriesCompleted === groups.flat().length && !hasError) {
                        connection.commit((err) => {
                            if (err) {
                                return connection.rollback(() => {
                                    console.error("Error committing transaction", err);
                                    res.status(500).json({ error: "Error committing transaction" });
                                });
                            }
                            res.status(200).json({ message: "Groups inserted successfully" });
                        });
                    }
                });
            });
        });
    });
};

const getAllGroups = (req, res) => {
    const query = `
        SELECT 
            g.id AS group_id,
            g.player_id,
            g.team_id,
            g.points,
            g.wins,
            g.draws,
            g.losses,
            g.goal_diff,
            t.name AS team_name,
            t.logo AS logo,
            u.id AS user_id,
            u.username AS user_name,
            u.picture AS picture
        FROM group_player gp
        JOIN group_player g ON g.id = gp.group_id
        JOIN teams t ON gp.team_id = t.id
        JOIN users u ON t.owner_id = u.id
        ORDER BY g.id, g.points DESC, g.goal_diff DESC;
    `;

    connection.query(query, (error, results) => {
        if (error) {
            console.error("Error fetching groups", error);
            return res.status(500).json({ error: "Error fetching groups" });
        }

        const groups = {};

        results.forEach(row => {
            if (!groups[row.group_id]) {
                groups[row.group_id] = {
                    group_id: row.group_id, 
                    teams: []
                };
            }

            groups[row.group_id].teams.push({
                team: {
                    id: row.team_id,
                    name: row.team_name,
                    logo: row.logo,
                    user: {
                        id: row.user_id,
                        username: row.user_name,
                        picture: row.picture
                    }
                },
                stats: {
                    points: row.points,
                    wins: row.wins,
                    draws: row.draws,
                    losses: row.losses,
                    goal_diff: row.goal_diff
                }
            });
        });

        res.status(200).json({ groups: Object.values(groups) });
    });
};



module.exports = {
    createGroups,
    getAllGroups
};