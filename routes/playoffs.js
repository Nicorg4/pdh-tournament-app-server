const express = require('express');
const router = express.Router();
const playOffsController = require('../controllers/playoffsController');
const verifyToken = require('../middlewares/verifyToken');
const authorizeRole = require('../middlewares/authorizationRole');

router.get('/get-all', verifyToken, authorizeRole('user', 'admin'), playOffsController.getPlayoffs);
router.post('/create-all', verifyToken, authorizeRole('admin'), playOffsController.createPlayoffs);
router.post('/update-matches', verifyToken, authorizeRole('admin'), playOffsController.updateMatches);
router.get('/check-all-quarters-played', verifyToken, authorizeRole('admin'), playOffsController.checkIfAllQuartersPlayed);
router.get('/check-all-semifinals-played', verifyToken, authorizeRole('admin'), playOffsController.checkIfAllSemifinalsPlayed);
router.post('/create-semifinals', verifyToken, authorizeRole('admin'), playOffsController.createSemifinals);
router.post('/create-final', verifyToken, authorizeRole('admin'), playOffsController.createFinal);

module.exports = router;