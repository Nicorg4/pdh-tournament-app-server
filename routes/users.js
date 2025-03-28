// users.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const upload = require('../middlewares/upload');

router.post('/login', userController.loginUser);
router.get('/get-all', userController.getAllUsers);
router.get('/get-all-without-team', userController.getAllUsersWithoutTeam);
router.get('/get-all-pairs', userController.getAllPairs);
router.post('/create', upload.single('picture'), userController.createUser);
router.delete('/delete/:id', userController.deleteUser);

module.exports = router;
