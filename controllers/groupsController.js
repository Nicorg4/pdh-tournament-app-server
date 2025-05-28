
const { connection } = require('../dbConnection');

const createGroups = async (req, res) => {
    const { groups } = req.body;

    if (!groups || !Array.isArray(groups) || groups.length === 0) {
        return res.status(400).json({ error: "Invalid groups data" });
    }

    try {
        await connection.promise().query('TRUNCATE TABLE group_player');
        await connection.promise().beginTransaction();

        const insertGroupQuery = `
            INSERT INTO group_player (player_id, team_id, points, wins, draws, losses, group_id, goal_diff) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?);
        `;

        for (const [groupIndex, group] of groups.entries()) {
            for (const { user, team } of group) {
                if (!user || !team) {
                    throw new Error("Invalid user or team data");
                }

                const values = [user.id, team.id, 0, 0, 0, 0, groupIndex + 1, 0];
                await connection.promise().query(insertGroupQuery, values);
            }
        }

        await connection.promise().commit();
        await createGroupMatches();

        res.status(200).json({ message: "Groups and matches created successfully" });
    } catch (error) {
        console.error("Error in createGroups", error);
        await connection.promise().rollback();
        res.status(500).json({ error: "An error occurred while creating groups" });
    }
};


const getAllGroups = (req, res) => {
    const query = `
        SELECT 
            gp.group_id AS group_id,
            gp.player_id,
            gp.team_id,
            gp.points,
            gp.wins,
            gp.draws,
            gp.losses,
            gp.goal_diff,
            t.name AS team_name,
            t.logo AS logo,
            u.id AS user_id,
            u.username AS user_name,
            u.picture AS picture
        FROM group_player gp
        JOIN teams t ON gp.team_id = t.id
        JOIN users u ON t.owner_id = u.id
        ORDER BY gp.group_id, gp.points DESC, gp.goal_diff DESC;
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



const createGroupMatches = async () => {
    try {
        await connection.promise().query('TRUNCATE TABLE matches');

        const [groups] = await connection.promise().query(`
            SELECT group_id, team_id 
            FROM group_player 
            ORDER BY group_id, points DESC, goal_diff DESC
        `);

        const groupedTeams = groups.reduce((acc, row) => {
            if (!acc[row.group_id]) acc[row.group_id] = [];
            acc[row.group_id].push(row.team_id);
            return acc;
        }, {});

        const groupMatchDays = {};
        const matches = [];

        Object.entries(groupedTeams).forEach(([groupId, teams]) => {
            if (teams.length < 4) return;

            if (!groupMatchDays[groupId]) groupMatchDays[groupId] = 1;

            matches.push([teams[0], teams[1], groupMatchDays[groupId], groupId]);
            matches.push([teams[2], teams[3], groupMatchDays[groupId], groupId]);
            groupMatchDays[groupId]++;

            matches.push([teams[0], teams[2], groupMatchDays[groupId], groupId]);
            matches.push([teams[1], teams[3], groupMatchDays[groupId], groupId]);
            groupMatchDays[groupId]++;

            matches.push([teams[0], teams[3], groupMatchDays[groupId], groupId]);
            matches.push([teams[1], teams[2], groupMatchDays[groupId], groupId]);
            groupMatchDays[groupId]++;
        });

        const insertMatchQuery = `
            INSERT INTO matches (team_A_id, team_B_id, winner_team_id, team_A_score, team_B_score, isDraw, match_day, group_id) 
            VALUES (?, ?, NULL, NULL, NULL, 0, ?, ?)
        `;

        await connection.promise().beginTransaction();

        for (const [teamA, teamB, matchDay, groupId] of matches) {
            await connection.promise().query(insertMatchQuery, [teamA, teamB, matchDay, groupId]);
        }

        await connection.promise().commit();
    } catch (error) {
        console.error("Error creating matches", error);
        await connection.promise().rollback();
        throw error;
    }
};


const getAllMatches = async (req, res) => {
    const query = `
        SELECT 
            m.match_day,
            m.id AS match_id, 
            m.team_A_id, 
            m.team_B_id, 
            m.winner_team_id, 
            m.team_A_score, 
            m.team_B_score, 
            m.group_id,
            m.isDraw,
            ta.name AS team_A_name, 
            ta.logo AS team_A_logo,
            tb.name AS team_B_name, 
            tb.logo AS team_B_logo,
            ua.id AS user_A_id,
            ua.username AS user_A_name,
            ua.picture AS user_A_picture,
            ub.id AS user_B_id,
            ub.username AS user_B_name,
            ub.picture AS user_B_picture
        FROM matches m
        JOIN teams ta ON m.team_A_id = ta.id
        JOIN teams tb ON m.team_B_id = tb.id
        JOIN users ua ON ta.owner_id = ua.id
        JOIN users ub ON tb.owner_id = ub.id
        ORDER BY m.match_day, m.id;
    `;

    try {
        const [results] = await connection.promise().query(query);
        res.status(200).json({ matches: results });
    } catch (error) {
        console.error("Error fetching matches", error);
        res.status(500).json({ error: "Error fetching matches" }); 
    }
};

const updateMatches = async (req, res) => {
    try {
        await connection.promise().beginTransaction();

        const updatedMatches = req.body.matches;

        for (const match of updatedMatches) {
            await connection.promise().query(
                `UPDATE matches SET team_A_score = ?, team_B_score = ? WHERE id = ?`,
                [match.team_A_score, match.team_B_score, match.match_id]
            );
        }

        const [matches] = await connection.promise().query(`SELECT * FROM matches`);

        const teamStats = {};

        for (const match of matches) {
            const { id, team_A_id, team_B_id, team_A_score, team_B_score } = match;
            let winner_team_id = null;
            let isDraw = false;

            if (team_A_score !== null && team_B_score !== null) {
                if (team_A_score > team_B_score) {
                    winner_team_id = team_A_id;
                } else if (team_B_score > team_A_score) {
                    winner_team_id = team_B_id;
                } else {
                    isDraw = true;
                }

                await connection.promise().query(
                    `UPDATE matches SET winner_team_id = ?, isDraw = ? WHERE id = ?`,
                    [winner_team_id, isDraw, id]
                );

                if (!teamStats[team_A_id]) teamStats[team_A_id] = { wins: 0, draws: 0, losses: 0, points: 0, goal_diff: 0 };
                if (!teamStats[team_B_id]) teamStats[team_B_id] = { wins: 0, draws: 0, losses: 0, points: 0, goal_diff: 0 };

                if (team_A_score > team_B_score) {
                    teamStats[team_A_id].wins++;
                    teamStats[team_A_id].points += 3;
                    teamStats[team_B_id].losses++;
                } else if (team_B_score > team_A_score) {
                    teamStats[team_B_id].wins++;
                    teamStats[team_B_id].points += 3;
                    teamStats[team_A_id].losses++;
                } else {
                    teamStats[team_A_id].draws++;
                    teamStats[team_A_id].points++;
                    teamStats[team_B_id].draws++;
                    teamStats[team_B_id].points++;
                }

                teamStats[team_A_id].goal_diff += (team_A_score - team_B_score);
                teamStats[team_B_id].goal_diff += (team_B_score - team_A_score);
            }
        }

        for (const [team_id, stats] of Object.entries(teamStats)) {
            await connection.promise().query(
                `UPDATE group_player 
                 SET wins = ?, draws = ?, losses = ?, points = ?, goal_diff = ?
                 WHERE team_id = ?`,
                [stats.wins, stats.draws, stats.losses, stats.points, stats.goal_diff, team_id]
            );
        }

        await connection.promise().commit();
        res.status(200).json({ message: "Matches updated successfully" });

    } catch (error) {
        await connection.promise().rollback();
        console.error("Error updating matches:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};


const checkIfAllMatchesPlayed = async (req, res) => {
    try {
      const resultPlayed = await connection.promise().query(
        'SELECT COUNT(*) AS playedCount FROM matches WHERE winner_team_id IS NOT NULL OR isDraw = 1'
      );
  
      const resultTotal = await connection.promise().query(
        'SELECT COUNT(*) AS totalCount FROM matches'
      );
  
      const resultado1 = resultPlayed[0][0]?.playedCount;
      const resultado2 = resultTotal[0][0]?.totalCount;
  
      const allMatchesPlayedStatus = resultado1 === resultado2;
  
      res.json({
        allMatchesPlayed: allMatchesPlayedStatus
      });
    } catch (error) {
      console.error("Error checking if all matches played:", error);
      res.status(500).json({ message: 'Error checking if all matches played.' });
    }
  };

  

module.exports = { createGroups, getAllGroups, createGroupMatches, getAllMatches, updateMatches, checkIfAllMatchesPlayed };