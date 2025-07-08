// players.js
const express = require('express');
const router = express.Router();
const playersController = require('../controllers/playersController');
const verifyToken = require('../middlewares/verifyToken');
const authorizeRole = require('../middlewares/authorizationRole');

router.get('/get-by/:teamId', verifyToken, authorizeRole('user', 'admin'), playersController.getPlayersByTeamId);
router.get('/on-sale-by/:teamId', verifyToken, authorizeRole('user', 'admin'), playersController.getPlayersOnSaleByTeamId);
router.get('/not-on-sale-by/:teamId', verifyToken, authorizeRole('user', 'admin'), playersController.getPlayersNotOnSaleByTeamId);
router.post('/create', verifyToken, authorizeRole('admin'), playersController.createPlayer);

module.exports = router;
