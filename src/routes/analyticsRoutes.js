const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

router.get('/demographics', analyticsController.getDemographics);
router.get('/location', analyticsController.getLocationStats);
router.get('/sha', analyticsController.getSHAStats);
router.get('/filtered', analyticsController.getFilteredStats);

module.exports = router;