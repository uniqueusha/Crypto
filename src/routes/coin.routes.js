const express = require('express');
const router = express.Router();
const coinController = require('../controllers/coin.controllers');

router.post('/',coinController.addCoin);
router.get('',coinController.getCoins);
router.get('/wma', coinController.getCoinWma);

module.exports = router