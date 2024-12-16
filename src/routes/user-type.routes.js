const express = require("express");
const router = express.Router();
const userTypeController = require("../controllers/user-type.controllers");
const checkAuth = require("../middleware/check.auth");

//Add User Type
router.post('/', userTypeController.addUserType);
//Get List
 router.get('/', userTypeController.getUserTypes);
//Active list
router.get('/wma', userTypeController.getUserTypeWma);
//get user type list by user type id
router.get('/:id', userTypeController.getUserType);
//update user type
router.put('/:id', userTypeController.updateUserType);
//update status
router.patch('/:id', userTypeController.onStatusChange);

module.exports = router