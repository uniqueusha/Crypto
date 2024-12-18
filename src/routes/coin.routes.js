const express = require('express');
const router = express.Router();
const coinController = require('../controllers/coin.controllers');

router.post('/',coinController.addCoin);
router.get('',coinController.getCoins);
//active list 
router.get('/wma', coinController.getCoinWma);
//list by id
router.get('/:id', coinController.getCoin);

module.exports = router