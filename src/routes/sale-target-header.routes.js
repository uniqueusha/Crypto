const express = require('express');
const router = express.Router();
const saleTargetHeaderController = require('../controllers/sale-target-header.controllers');
const checkAuth = require("../middleware/check.auth");

//add sale target header
router.post('/', checkAuth, saleTargetHeaderController.addSaleTargetHeader)
router.post('/currant-price', saleTargetHeaderController.createCurrentPrice);
router.put('/', checkAuth, saleTargetHeaderController.currantPriceUpdateTargetComplitionStatus);

module.exports = router