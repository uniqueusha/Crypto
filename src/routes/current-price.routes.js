const express = require("express");
const router = express.Router();
const currentPriceController = require("../controllers/current-price.controller");
const checkAuth = require("../middleware/check.auth");

//Add Current Price
router.post('/', checkAuth,currentPriceController.addCurrentPrice);
//Get List
router.get('/', checkAuth,currentPriceController.getCurrentprice);
// //login
// router.post('/login',userController.userLogin);
// //Active list
// router.get('/wma',userController.getUserWma);
// //user count
// router.get('/user-count', userController.getUserCount);
// //get list by id
// router.get('/:id',userController.getUser);
// //update user
// router.put('/:id',userController.updateUser);
// //update status
// router.patch('/:id',userController.onStatusChange);

module.exports = router