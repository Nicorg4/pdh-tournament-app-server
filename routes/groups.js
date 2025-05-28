const express = require('express');
const router = express.Router();
const groupsController = require('../controllers/groupsController');

router.post('/create', groupsController.createGroups);
router.get('/get-all-matches', groupsController.getAllMatches);
router.get('/get-all', groupsController.getAllGroups);
router.post('/update-matches', groupsController.updateMatches);
router.get('/check-all-matches-played', groupsController.checkIfAllMatchesPlayed);

module.exports = router;
