const express = require('express');
const router = express.Router();
const groupsController = require('../controllers/groupsController');
const verifyToken = require('../middlewares/verifyToken');
const authorizeRole = require('../middlewares/authorizationRole');

router.post('/create', verifyToken, authorizeRole('admin'), groupsController.createGroups);
router.get('/get-all-matches', verifyToken, authorizeRole('user', 'admin'), groupsController.getAllMatches);
router.get('/get-all', verifyToken, authorizeRole('user', 'admin'), groupsController.getAllGroups);
router.post('/update-matches', verifyToken, authorizeRole('admin'), groupsController.updateMatches);
router.get('/check-all-matches-played', verifyToken, authorizeRole('admin'), groupsController.checkIfAllMatchesPlayed);

module.exports = router;
