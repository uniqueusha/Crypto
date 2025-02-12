const express = require("express");
const router = express.Router();
const userController = require("../controllers/admin.controllers");
const checkAuth = require("../middleware/check.auth");

//Add User
router.post('/', userController.addUser);
//Get List
router.get('/', userController.getUsers);
//login
router.post('/login',userController.userLogin);
//Active list
router.get('/wma',userController.getUserWma);
//user count
router.get('/user-count', userController.getUserCount);
//get list by id
router.get('/:id',userController.getUser);
//chnage password
router.put('/change-password', userController.onChangePassword);
//update user
router.put('/:id',userController.updateUser);
//update status
router.patch('/:id',userController.onStatusChange);

module.exports = router