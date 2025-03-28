const express = require('express');
const router = express.Router();
const auctionsController = require('../controllers/auctionsController');

router.get('/get-all', auctionsController.getAuctions);
router.get('/get-finished', auctionsController.getFinishedAuctions);
router.post('/publish-player', auctionsController.publishPlayer);
router.post('/unpublish-player', auctionsController.unpublishPlayer);
router.post('/purchase-player', auctionsController.purchasePlayer);

module.exports = router;
