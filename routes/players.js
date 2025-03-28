// players.js
const express = require('express');
const router = express.Router();
const playersController = require('../controllers/playersController');

router.get('/get-by/:teamId', playersController.getPlayersByTeamId);
router.get('/on-sale-by/:teamId', playersController.getPlayersOnSaleByTeamId);
router.get('/not-on-sale-by/:teamId', playersController.getPlayersNotOnSaleByTeamId);
router.post('/create', playersController.createPlayer);

module.exports = router;
