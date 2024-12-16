const express = require('express');
const router = express.Router();
const saleTargetHeaderController = require('../controllers/sale-target-header.controllers');
//const checkAuth = require("");

//add sale target header
router.post('/', saleTargetHeaderController.addSaleTargetHeader)
// router.get('',coinController.getCoins)

module.exports = router