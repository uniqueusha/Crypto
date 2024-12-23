const express = require('express');
const router = express.Router();
const saleTargetHeaderController = require('../controllers/sale-target-header.controllers');
const checkAuth = require("../middleware/check.auth");

//add sale target header
router.post('/', checkAuth, saleTargetHeaderController.addSaleTargetHeader);
router.post('/currant-price', saleTargetHeaderController.createCurrentPrice);
router.get('/', saleTargetHeaderController.getSetTargets);
router.get('/download-set-target', saleTargetHeaderController.getSetTargetDownload);
router.put('/', checkAuth, saleTargetHeaderController.currantPriceUpdateTargetComplitionStatus);

module.exports = router