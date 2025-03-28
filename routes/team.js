const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const upload = require('../middlewares/upload');

router.post('/create', upload.single('picture'), teamController.createTeam);
router.get('/get-all', teamController.getAllTeans);
router.get('/get-all-without-owner', teamController.getAllTeansWithoutOwner);
router.post('/assign', teamController.assignTeam);
router.post('/reset-team-ownership', teamController.resetTeamOwnership);

module.exports = router;
