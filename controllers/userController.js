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
        const isPasswordValid = bcrypt.compareSync(password, user.password);

        if (isPasswordValid) {
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

              const SECRET_KEY = process.env.JWT_SECRET

              const token = jwt.sign(tokenPayload, SECRET_KEY, { expiresIn: '6h' });

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

  const checkQuery = 'SELECT * FROM users WHERE username = ?';
  connection.query(checkQuery, [username], (checkError, checkResults) => {
    if (checkError) {
      console.error('Error al verificar usuario:', checkError);
      return res.status(500).json({ error: 'Error al verificar usuario' });
    }

    if (checkResults.length > 0) {
      return res.status(400).json({ error: 'El nombre de usuario ya existe' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const query = 'INSERT INTO users (username, password, picture, role, money) VALUES (?, ?, ?, ?, ?)';
    connection.query(query, [username, hashedPassword, picture, role, 100000000], (error, results) => {
      if (error) {
        console.error('Error al crear usuario:', error);
        return res.status(500).json({ error: 'Error al crear usuario' });
      }
      res.status(201).json({ message: 'Usuario creado con éxito', picture });
    });
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
      AND u.role = 'user'
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
