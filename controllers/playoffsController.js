const { connection } = require('../dbConnection');

const createPlayoffs = async (req, res) => {
  try {
    await connection.promise().query('TRUNCATE TABLE playoffs');
    const groupsQuery = await connection.promise().query(`
      SELECT DISTINCT group_id FROM group_player
    `);
    
    const allTeams = [];

    for (const group of groupsQuery[0]) {
      const result = await connection.promise().query(`
        SELECT team_id, group_id FROM group_player 
        WHERE group_id = ? 
        ORDER BY points DESC, goal_diff DESC 
        LIMIT 2
      `, [group.group_id]);
      allTeams.push(...result[0]);
    }

    const totalGroups = groupsQuery[0].length;
    const totalTeams = totalGroups * 2;
    const phase = Math.log2(totalTeams);

    const playoffMatches = [];

    for (let i = 0; i < totalGroups; i += 2) {
      if (i + 1 < totalGroups) {
        const firstTeamA = allTeams.find(team => team.group_id === groupsQuery[0][i].group_id && team === allTeams.find(t => t.group_id === team.group_id));
        const secondTeamA = allTeams.find(team => team.group_id === groupsQuery[0][i].group_id && team !== firstTeamA);
        const firstTeamB = allTeams.find(team => team.group_id === groupsQuery[0][i + 1].group_id && team === allTeams.find(t => t.group_id === team.group_id));
        const secondTeamB = allTeams.find(team => team.group_id === groupsQuery[0][i + 1].group_id && team !== firstTeamB);

        playoffMatches.push({
          team_A_id: firstTeamA.team_id,
          team_B_id: secondTeamB.team_id,
          team_A_score: null,
          team_B_score: null,
          team_A_penalty_score: null,
          team_B_penalty_score: null,
          winner_team_id: null,
          phase: phase,
        });

        playoffMatches.push({
          team_A_id: firstTeamB.team_id,
          team_B_id: secondTeamA.team_id,
          team_A_score: null,
          team_B_score: null,
          team_A_penalty_score: null,
          team_B_penalty_score: null,
          winner_team_id: null,
          phase: phase,
        });
      }
    }

    for (const match of playoffMatches) {
      await connection.promise().query(`
        INSERT INTO playoffs (team_A_id, team_B_id, team_A_score, team_B_score, 
                             team_A_penalty_score, team_B_penalty_score, winner_team_id, phase) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        match.team_A_id,
        match.team_B_id,
        match.team_A_score,
        match.team_B_score,
        match.team_A_penalty_score,
        match.team_B_penalty_score,
        match.winner_team_id,
        match.phase
      ]);
    }

    console.log('Playoffs (cuartos de final, semifinal o fase final) created successfully.');
    res.status(200).json({ message: 'Playoffs created successfully.' });
  } catch (error) {
    console.error('Error creating playoffs:', error);
    res.status(500).json({ message: 'Error creating playoffs.' });
  }
};

const getPlayoffs = async (req, res) => {
    const query = `
    SELECT 
        p.id AS match_id, 
        p.team_A_id, 
        p.team_B_id, 
        p.winner_team_id, 
        p.team_A_score, 
        p.team_B_score,
        p.team_A_penalty_score,
        p.team_B_penalty_score,
        p.phase,
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
    FROM playoffs p
    JOIN teams ta ON p.team_A_id = ta.id
    JOIN teams tb ON p.team_B_id = tb.id
    JOIN users ua ON ta.owner_id = ua.id
    JOIN users ub ON tb.owner_id = ub.id
    ORDER BY p.phase DESC, p.id;
`;

try {
    const [results] = await connection.promise().query(query);
    res.status(200).json({ matches: results });
} catch (error) {
    console.error("Error fetching playoffs", error);
    res.status(500).json({ error: "Error fetching playoffs" }); 
}
};

module.exports = {
  createPlayoffs,
  getPlayoffs
};