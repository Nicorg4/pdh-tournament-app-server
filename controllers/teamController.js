const { connection } = require('../dbConnection');

const createTeam = (req, res) => {
    const { name } = req.body;
    const picture = req.file ? `images/${req.file.filename}` : null;

    const query = 'INSERT INTO teams (name, logo) VALUES (?, ?)';
    
    connection.query(query, [name, picture], (error, results) => {
        if (error) {
        console.error('Error al crear equipo:', error);
        return res.status(500).json({ error: 'Error al crear equipo' });
        }
        res.status(201).json({ message: 'Equipo creado con éxito', picture });
    });
}

const getAllTeans = (req, res) => {
const query = 'SELECT * FROM teams';
    connection.query(query, (error, results) => {
        if (error) {
        console.error('Error al obtener equipos:', error);
        return res.status(500).json({ error: 'Error al obtener equipos' });
        }
        res.json(results);
    });
}

const getAllTeansWithoutOwner = (req, res) => {
    const query = 'SELECT * FROM teams WHERE owner_id IS NULL';
    connection.query(query, (error, results) => {
        if (error) {
        console.error('Error al obtener equipos sin dueño:', error);
        return res.status(500).json({ error: 'Error al obtener equipos sin dueño' });
        }
        res.json(results);
    });
}

const assignTeam = (req, res) => {
    const { teamId, userId } = req.body;
    const query = 'UPDATE teams SET owner_id = ? WHERE id = ?';
    connection.query(query, [userId, teamId], (error, results) => {
        if (error) {
        console.error('Error al asignar equipo al usuario:', error);
        return res.status(500).json({ error: 'Error al asignar equipo al usuario' });
        }
        res.json({ message: 'Equipo asignado con éxito' });
    });
}

const resetTeamOwnership = (req, res) => {
    const query = 'UPDATE teams SET owner_id = NULL WHERE owner_id IS NOT NULL';
    const dropGroupPlayerTableQuery = 'TRUNCATE TABLE group_player';

    connection.query(dropGroupPlayerTableQuery, (err) => {
        if (err) {
            console.error("Error dropping group_player table", err);
        }
    });
    connection.query(query, (error, results) => {
        if (error) {
        console.error('Error al restablecer la propiedad del equipo:', error);
        return res.status(500).json({ error: 'Error al restablecer la propiedad del equipo' });
        }
        res.json({ message: 'Propiedad del equipo restablecida con éxito' });
    });
}

module.exports = {
  createTeam,
  getAllTeans,
  assignTeam,
  getAllTeansWithoutOwner,
  resetTeamOwnership
};