const express = require('express');
const router = express.Router();
const groupsController = require('../controllers/groupsController');

router.post('/create', groupsController.createGroups);
router.get('/get-all', groupsController.getAllGroups);

module.exports = router;
