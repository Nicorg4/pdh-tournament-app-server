// users.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const upload = require('../middlewares/upload');
const verifyToken = require('../middlewares/verifyToken');
const authorizeRole = require('../middlewares/authorizationRole');

router.post('/login', userController.loginUser);
router.get('/get-all', verifyToken, authorizeRole('user', 'admin'), userController.getAllUsers);
router.get('/get-all-without-team', verifyToken, authorizeRole('user', 'admin'), userController.getAllUsersWithoutTeam);
router.get('/get-all-pairs', verifyToken, authorizeRole('admin'), userController.getAllPairs);
router.post('/create', verifyToken, authorizeRole('admin'), upload.single('picture'), userController.createUser);
router.delete('/delete/:id', verifyToken, authorizeRole('admin'), userController.deleteUser);

module.exports = router;
