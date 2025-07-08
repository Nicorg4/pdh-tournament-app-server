const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const upload = require('../middlewares/upload');
const verifyToken = require('../middlewares/verifyToken');
const authorizeRole = require('../middlewares/authorizationRole');

router.post('/create', verifyToken, authorizeRole('admin'), upload.single('picture'), teamController.createTeam);
router.get('/get-all', verifyToken, authorizeRole('user', 'admin'), teamController.getAllTeans);
router.get('/get-all-without-owner', verifyToken, authorizeRole('admin'), teamController.getAllTeansWithoutOwner);
router.post('/assign', verifyToken, authorizeRole('admin'), teamController.assignTeam);
router.post('/reset-team-ownership', verifyToken, authorizeRole('admin'), teamController.resetTeamOwnership);

module.exports = router;
