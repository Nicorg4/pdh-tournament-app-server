const express = require('express');
const router = express.Router();
const playOffsController = require('../controllers/playoffsController');

router.get('/get-all', playOffsController.getPlayoffs);
router.post('/create-all', playOffsController.createPlayoffs);
router.post('/update-matches', playOffsController.updateMatches);
router.get('/check-all-quarters-played', playOffsController.checkIfAllQuartersPlayed);
router.get('/check-all-semifinals-played', playOffsController.checkIfAllSemifinalsPlayed);
router.post('/create-semifinals', playOffsController.createSemifinals);
router.post('/create-final', playOffsController.createFinal);

module.exports = router;