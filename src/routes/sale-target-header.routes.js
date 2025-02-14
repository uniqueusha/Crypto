const express = require('express');
const router = express.Router();
const saleTargetHeaderController = require('../controllers/sale-target-header.controllers');
const checkAuth = require("../middleware/check.auth");

//add sale target header
router.post('/', checkAuth, saleTargetHeaderController.addSaleTargetHeader);
router.post('/currant-price', saleTargetHeaderController.createCurrentPrice);
router.post('/coin-exchange', checkAuth, saleTargetHeaderController.checkCoinExchange);
router.get('/', checkAuth, saleTargetHeaderController.getSetTargets);
router.get('/currant-price-count', checkAuth, saleTargetHeaderController.getCurrentPriceCount);
router.get('/set-target-count', checkAuth, saleTargetHeaderController.getSetTargetCount);
router.get('/download-set-target', checkAuth, saleTargetHeaderController.getSetTargetDownload);
router.get('/download-sold-coin', checkAuth, saleTargetHeaderController.getSoldCoinDownload);
router.get('/download-dashboard', checkAuth, saleTargetHeaderController.getDashboardDownload);
router.get('/reached', checkAuth, saleTargetHeaderController.getSetTargetReached);
router.get('/sold-coin', checkAuth, saleTargetHeaderController.getSoldCoin);
router.get('/:id', checkAuth, saleTargetHeaderController.getSetTarget);
router.put('/', checkAuth, saleTargetHeaderController.currantPriceUpdateTargetComplitionStatus);
router.put('/:id', checkAuth, saleTargetHeaderController.updateSetTarget);
router.patch('/sell-to-sold', checkAuth, saleTargetHeaderController.updateSellSold);
router.delete('/:id', checkAuth, saleTargetHeaderController.deleteSetTargetChangeStatus);

module.exports = router