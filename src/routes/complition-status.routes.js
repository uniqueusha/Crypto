const express = require("express");
const router = express.Router();
const complitionStatusController = require("../controllers/complition-status.controllers");


//Add complition status
router.post('/', complitionStatusController.addComplitionStatus);
//Get List complition status
router.get('/', complitionStatusController.getComplitionStatus);
//Active list
router.get('/wma', complitionStatusController.getComplitionStatusWma);
//get list by id 
router.get('/:id', complitionStatusController.getComplitionStatusById);
//update complition status
router.put('/:id', complitionStatusController.updateComplitionStatus);
//update status
router.patch('/:id', complitionStatusController.onStatusChange);

module.exports = router