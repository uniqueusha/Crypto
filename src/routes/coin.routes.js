const express = require('express');
const router = express.Router();
const coinController = require('../controllers/coin.controllers');
const checkAuth = require("../middleware/check.auth");

// add coin
router.post('/',coinController.addCoin);
//get all coin list
router.get('/',coinController.getCoins);
//active list 
router.get('/wma', coinController.getCoinWma);
//active coin current price
router.get('/active-coin-currant-price', coinController.getCoinActiveCurrentPrice);
//list by id
router.get('/:id', coinController.getCoin);

module.exports = router