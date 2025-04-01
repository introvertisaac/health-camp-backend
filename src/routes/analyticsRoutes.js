const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

router.get('/demographics', analyticsController.getDemographics);

router.get('/search-diagnosis-family', analyticsController.searchDiagnosisByFamily);
router.get('/location', analyticsController.getLocationStats);
router.get('/sha', analyticsController.getSHAStats);
router.get('/filtered', analyticsController.getFilteredStats);
router.get('/hourly', analyticsController.getHourlyRegistrations);
router.get('/first-hundred', analyticsController.getFirstHundredPatients);
router.get('/search-diagnosis', analyticsController.searchPatientsByDiagnosis);
router.get('/lab-data', analyticsController.getLabData);
router.get('/lab-statistics', analyticsController.getLabStatistics);
router.get('/analyze', analyticsController.getAnalytics);
router.get('/locations', analyticsController.getLocations);
router.get('/patients', analyticsController.getPatients);
router.get('/patients/:id', analyticsController.getPatientDetails);
router.get('/search-diagnosis', analyticsController.searchPatientsByDiagnosis);
router.get('/general-health', analyticsController.getGeneralHealthAnalytics);
router.get('/location-patients', analyticsController.getPatientsByLocation);

module.exports = router;