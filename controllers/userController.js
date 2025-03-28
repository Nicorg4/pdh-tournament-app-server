// userController.js
const { connection } = require('../dbConnection');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const getAllUsers = (req, res) => {
  const query = `SELECT users.id, users.username, users.picture, 
                      teams.id AS team_id, teams.name AS team_name, teams.logo AS team_logo
                FROM users 
                LEFT JOIN teams ON teams.owner_id = users.id
                WHERE users.role = 'user';
                `

  connection.query(query, (error, results) => {
    if (error) {
      console.error('Error while obtaining users:', error);
      res.status(500).json({ error: 'Error while obtaining users' });
    } else {
      res.json(results);
    }
  });
};

const getAllUsersWithoutTeam = (req, res) => {
  const query = `SELECT users.id, users.username, users.picture
                  FROM users
                  LEFT JOIN teams ON users.id = teams.owner_id
                  WHERE teams.owner_id IS NULL AND users.role != 'admin';
                  `;
  connection.query(query, (error, results) => {
    if (error) {
      console.error('Error while obtaining users without team:', error);
      res.status(500).json({ error: 'Error while obtaining users without team' });
    } else {
      res.json(results);
    }
  });
};

const loginUser = (req, res) => {
  const { username, password } = req.body;
  const query = 'SELECT * FROM users WHERE username = ?';
  connection.query(query, [username], (error, results) => {
    if (error) {
      console.error('Error while obtaining user:', error);
      res.status(500).json({ error: 'Error while obtaining user' });
    } else { 
      if (results.length === 0) {
        res.status(401).json({ error: 'Wrong username or password' });
      } else {
        const user = results[0];

        if (password.trim() === user.password) {
          const teamQuery = 'SELECT * FROM teams WHERE owner_id = ?';
          connection.query(teamQuery, [user.id], (teamError, teamResults) => {
            if (teamError) {
              console.error('Error while obtaining user team:', teamError);
              res.status(500).json({ error: 'Error while obtaining user team' });
            } else {
              const team = teamResults[0];
              const tokenPayload = {
                username: user.username,
                money: user.money,
                role: user.role,
                team: team,
                picture: user.picture,
              };

              const token = jwt.sign(tokenPayload, 'token_secret', { expiresIn: '6h' });

              res.json({ token });
            }
          });
        } else {
          res.status(401).json({ error: 'Wrong username or password' });
        }
      }
    }
  });
};

const createUser = (req, res) => {
  const { username, password, role } = req.body;
  const picture = req.file ? `images/${req.file.filename}` : null;

  const query = 'INSERT INTO users (username, password, picture, role, money) VALUES (?, ?, ?, ?, ?)';
  
  connection.query(query, [username, password, picture, role, 100000000], (error, results) => {
    if (error) {
      console.error('Error al crear usuario:', error);
      return res.status(500).json({ error: 'Error al crear usuario' });
    }
    res.status(201).json({ message: 'Usuario creado con éxito', picture });
  });
};

const deleteUser = (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM users WHERE id = ?';

  connection.query(query, [id], (error, results) => {
    if (error) {
      console.error('Error al eliminar usuario:', error);
      return res.status(500).json({ error: 'Error al eliminar usuario' });
    }
    res.json({ message: 'Usuario eliminado con éxito' });
  });

}

const getAllPairs = (req, res) => {
  const query = `
      SELECT 
          u.id AS user_id,
          u.username AS user_name,
          u.picture AS user_picture,
          t.id AS team_id,
          t.name AS team_name,
          t.logo AS team_logo,
          t.owner_id AS team_owner_id
      FROM teams t
      JOIN users u ON t.owner_id = u.id
      WHERE t.owner_id IS NOT NULL
  `;

  connection.query(query, (error, results) => {
      if (error) {
          console.error("Error fetching pairs", error);
          return res.status(500).json({ error: "Error fetching pairs" });
      }

      const pairs = results.map(row => ({
          user: {
              id: row.user_id,
              username: row.user_name,
              picture: row.user_picture
          },
          team: {
              id: row.team_id,
              name: row.team_name,
              logo: row.team_logo,
              owner_id: row.team_owner_id
          }
      }));

      res.status(200).json(pairs);
  });
};



module.exports = {
  getAllUsers,
  loginUser,
  createUser,
  getAllUsersWithoutTeam,
  getAllPairs,
  deleteUser
};
