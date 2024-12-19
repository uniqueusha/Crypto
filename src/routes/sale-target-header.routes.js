const express = require('express');
const router = express.Router();
const saleTargetHeaderController = require('../controllers/sale-target-header.controllers');
const checkAuth = require("../middleware/check.auth");

//add sale target header
router.post('/', checkAuth, saleTargetHeaderController.addSaleTargetHeader)
router.get('/', checkAuth, saleTargetHeaderController.getCronJob);
router.post('/currant-price', saleTargetHeaderController.createCurrentPrice);

module.exports = router