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
// router.post('/password', userController.getPassword);
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

router.post('/send-otp',userController.sendOtp);
router.post('/verify-otp',userController.verifyOtp);
router.post('/check-emailid',userController.checkEmailId);
router.post('/forgot-Password',userController.forgotPassword);
router.post('/send-otp-if-email-not-exists',userController.sendOtpIfEmailIdNotExists);

module.exports = router