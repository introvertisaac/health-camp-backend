const Patient = require('../models/Patient');

exports.getDemographics = async (req, res) => {
  try {
    const demographics = await Patient.aggregate([
      {
        $group: {
          _id: {
            gender: '$gender',
            ageGroup: {
              $switch: {
                branches: [
                  { case: { $lte: ['$age', 18] }, then: '0-18' },
                  { case: { $lte: ['$age', 30] }, then: '19-30' },
                  { case: { $lte: ['$age', 50] }, then: '31-50' },
                  { case: { $lte: ['$age', 70] }, then: '51-70' }
                ],
                default: '70+'
              }
            }
          },
          count: { $sum: 1 }
        }
      }
    ]);
    res.json(demographics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getLocationStats = async (req, res) => {
  try {
    const locationStats = await Patient.aggregate([
      {
        $group: {
          _id: '$location',
          count: { $sum: 1 }
        }
      }
    ]);
    res.json(locationStats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getSHAStats = async (req, res) => {
    try {
      const shaStats = await Patient.aggregate([
        {
          $group: {
            _id: '$nhif',
            count: { $sum: 1 }
          }
        }
      ]);
      
      // Calculate total and percentages
      const total = shaStats.reduce((sum, stat) => sum + stat.count, 0);
      
      const statsWithPercentage = shaStats.map(stat => ({
        status: stat._id === null ? 'Unrecorded' : stat._id ? 'Covered' : 'Not Covered',
        count: stat.count,
        percentage: ((stat.count / total) * 100).toFixed(1) + '%'
      }));
  
      const response = {
        total_patients: total,
        details: statsWithPercentage
      };
  
      res.json(response);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

exports.getFilteredStats = async (req, res) => {
  try {
    const { location, startDate, endDate, gender, ageMin, ageMax } = req.query;
    
    let query = {};
    
    if (location) query.location = location;
    if (gender) query.gender = gender;
    if (ageMin || ageMax) {
      query.age = {};
      if (ageMin) query.age.$gte = parseInt(ageMin);
      if (ageMax) query.age.$lte = parseInt(ageMax);
    }
    if (startDate || endDate) {
      query.updatedAt = {};
      if (startDate) query.updatedAt.$gte = new Date(startDate);
      if (endDate) query.updatedAt.$lte = new Date(endDate);
    }

    const results = await Patient.find(query);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};