const express = require('express');
const router = express.Router();
const auctionsController = require('../controllers/auctionsController');
const verifyToken = require('../middlewares/verifyToken');
const authorizeRole = require('../middlewares/authorizationRole');

router.get('/get-all', verifyToken, authorizeRole('user'), auctionsController.getAuctions);
router.get('/get-finished', verifyToken, authorizeRole('user'), auctionsController.getFinishedAuctions);
router.post('/publish-player', verifyToken, authorizeRole('user', 'admin'), auctionsController.publishPlayer);
router.post('/unpublish-player', verifyToken, authorizeRole('user'), auctionsController.unpublishPlayer);
router.post('/purchase-player', verifyToken, authorizeRole('user'), auctionsController.purchasePlayer);

module.exports = router;
