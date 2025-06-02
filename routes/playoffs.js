const express = require('express');
const router = express.Router();
const playOffsController = require('../controllers/playoffsController');

router.get('/get-all', playOffsController.getPlayoffs);
router.post('/create-all', playOffsController.createPlayoffs);
/* router.post('/update-matches', playOffsController.updateMatches); */

module.exports = router;