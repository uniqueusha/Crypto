const express = require("express");
const router = express.Router();
const targetStatusController = require("../controllers/target-status.controller");


//Add target status
router.post('/', targetStatusController.addTargetStatus);
// Get List target status
router.get('/', targetStatusController.getTargetStatus);
//Active list
router.get('/wma', targetStatusController.getTargetStatusWma);
//get list by id
router.get('/:id', targetStatusController.getTargetStatusById);
//update target status
router.put('/:id', targetStatusController.updateTargetStatus);
//update status
router.patch('/:id', targetStatusController.onStatusChange);

module.exports = router