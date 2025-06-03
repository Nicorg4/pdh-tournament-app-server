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
    const totalTeams = totalGroups * 4;
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

const updateMatches = (req, res) => {
  const matches = req.body.matches;

  if (!Array.isArray(matches)) {
    return res.status(400).json({ error: 'Invalid matches format' });
  }

  const updatePromises = matches.map(match => {
    const { match_id, team_A_score, team_B_score, team_A_penalty_score, team_B_penalty_score, winner_team_id } = match;
    return connection.promise().query(`
      UPDATE playoffs 
      SET team_A_score = ?, team_B_score = ?, 
          team_A_penalty_score = ?, team_B_penalty_score = ?, 
          winner_team_id = ? 
      WHERE id = ?
    `, [team_A_score, team_B_score, team_A_penalty_score, team_B_penalty_score, winner_team_id, match_id]);
  });

  Promise.all(updatePromises)
    .then(() => res.status(200).json({ message: 'Matches updated successfully.' }))
    .catch(error => {
      console.error('Error updating matches:', error);
      res.status(500).json({ message: 'Error updating matches.' });
  });
}

const checkIfAllQuartersPlayed = async (req, res) => {
    try {
      const resultPlayed = await connection.promise().query(
        'SELECT COUNT(*) AS playedCount FROM playoffs WHERE winner_team_id IS NOT NULL AND phase = 4'
      );
  
      const resultTotal = await connection.promise().query(
        'SELECT COUNT(*) AS totalCount FROM playoffs wHERE phase = 4'
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

const checkIfAllSemifinalsPlayed = async (req, res) => {
    try {
      const resultPlayed = await connection.promise().query(
        'SELECT COUNT(*) AS playedCount FROM playoffs WHERE winner_team_id IS NOT NULL AND phase = 2'
      );
  
      const resultTotal = await connection.promise().query(
        'SELECT COUNT(*) AS totalCount FROM playoffs WHERE phase = 2'
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

  const createSemifinals = async (req, res) => {
    try {

      await connection.promise().query(
        `DELETE FROM playoffs WHERE phase = 2`
      );

      const [winners] = await connection.promise().query(
        `SELECT winner_team_id FROM playoffs WHERE phase = 4 ORDER BY id ASC LIMIT 4`
      );

      if (winners.length !== 4) {
        return res.status(400).json({ message: 'No hay 4 ganadores para crear semifinales.' });
      }

      const semifinalMatches = [
        {
          team_A_id: winners[0].winner_team_id,
          team_B_id: winners[1].winner_team_id,
          phase: 2
        },
        {
          team_A_id: winners[2].winner_team_id,
          team_B_id: winners[3].winner_team_id,
          phase: 2
        }
      ];

      for (const match of semifinalMatches) {
        await connection.promise().query(
          `INSERT INTO playoffs (team_A_id, team_B_id, team_A_score, team_B_score, team_A_penalty_score, team_B_penalty_score, winner_team_id, phase)
           VALUES (?, ?, NULL, NULL, NULL, NULL, NULL, ?)`,
          [match.team_A_id, match.team_B_id, match.phase]
        );
      }

      res.status(200).json({ message: 'Semifinales creadas correctamente.' });
    } catch (error) {
      console.error('Error creando semifinales:', error);
      res.status(500).json({ message: 'Error creando semifinales.' });
    }
  };

  const createFinal = async (req, res) => {
    try {

      await connection.promise().query(
        `DELETE FROM playoffs WHERE phase = 1`
      );
      // Obtener los ganadores de las semifinales (fase 2)
      const [winners] = await connection.promise().query(
        `SELECT winner_team_id FROM playoffs WHERE phase = 2 ORDER BY id ASC LIMIT 2`
      );

      if (winners.length !== 2) {
        return res.status(400).json({ message: 'No hay 2 ganadores para crear la final.' });
      }

      // Crear el partido de la final (fase 1)
      await connection.promise().query(
        `INSERT INTO playoffs (team_A_id, team_B_id, team_A_score, team_B_score, team_A_penalty_score, team_B_penalty_score, winner_team_id, phase)
         VALUES (?, ?, NULL, NULL, NULL, NULL, NULL, 1)`,
        [winners[0].winner_team_id, winners[1].winner_team_id]
      );

      res.status(200).json({ message: 'Final creada correctamente.' });
    } catch (error) {
      console.error('Error creando la final:', error);
      res.status(500).json({ message: 'Error creando la final.' });
    }
  }

module.exports = {
  createPlayoffs,
  getPlayoffs,
  updateMatches,
  checkIfAllQuartersPlayed,
  checkIfAllSemifinalsPlayed,
  createSemifinals,
  createFinal
};