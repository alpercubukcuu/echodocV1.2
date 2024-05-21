const express = require('express');
const router = express.Router();
const summaryController = require('../controllers/summaryController');

// Get summary route
router.post('/get-summary', summaryController.getSummary);

module.exports = router;
