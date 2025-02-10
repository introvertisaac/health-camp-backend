const Patient = require('../models/Patient');

exports.getDemographics = async (req, res) => {
  try {
    const { location } = req.query;
    
    const pipeline = [];
    if (location) {
      pipeline.push({ $match: { location } });
    }
    
    pipeline.push({
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
    });

    const demographics = await Patient.aggregate(pipeline);
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
    const { location } = req.query;
    
    const pipeline = [];
    if (location) {
      pipeline.push({ $match: { location } });
    }
    
    pipeline.push({
      $project: {
        insurance_status: {
          $cond: {
            if: { $ne: ["$shif", null] },
            then: "$shif",
            else: "$nhif"
          }
        }
      }
    });
    
    pipeline.push({
      $group: {
        _id: '$insurance_status',
        count: { $sum: 1 }
      }
    });

    const shaStats = await Patient.aggregate(pipeline);
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

exports.getLabStatistics = async (req, res) => {
  try {
    const { startDate, endDate, location, staffEmail } = req.query;
    
    let match = {};
    
    // Add date range filter if provided
    if (startDate || endDate) {
      match.updatedAt = {};
      if (startDate) match.updatedAt.$gte = new Date(startDate);
      if (endDate) match.updatedAt.$lte = new Date(endDate);
    }
    
    // Add location filter if provided
    if (location) {
      match.location = location;
    }

    const pipeline = [
      { $match: match },
      {
        $facet: {
          // Total patients with any lab test
          totalLabTests: [
            {
              $match: {
                $or: [
                  { randomBloodSugar: { $exists: true, $ne: null } },
                  { malaria_ag_test: { $exists: true, $ne: null } },
                  { hiv_screening: { $exists: true, $ne: null } },
                  { urinalysis: { $exists: true, $ne: null } },
                  { disease_burden: { $exists: true, $ne: null } },
                  { cancer_screening: { $exists: true, $ne: null } }
                ]
              }
            },
            { $count: 'count' }
          ],

          // Tests by type
          testsByType: [
            {
              $project: {
                randomBloodSugar: { $cond: [{ $ifNull: ['$randomBloodSugar', false] }, 1, 0] },
                malaria: { $cond: [{ $ifNull: ['$malaria_ag_test', false] }, 1, 0] },
                hiv: { $cond: [{ $ifNull: ['$hiv_screening', false] }, 1, 0] },
                urinalysis: { $cond: [{ $ifNull: ['$urinalysis', false] }, 1, 0] },
                hba1c: { $cond: [{ $ifNull: ['$disease_burden', false] }, 1, 0] },
                cancer: { $cond: [{ $ifNull: ['$cancer_screening', false] }, 1, 0] }
              }
            },
            {
              $group: {
                _id: null,
                bloodSugarTests: { $sum: '$randomBloodSugar' },
                malariaTests: { $sum: '$malaria' },
                hivTests: { $sum: '$hiv' },
                urinalysisTests: { $sum: '$urinalysis' },
                hba1cTests: { $sum: '$hba1c' },
                cancerScreenings: { $sum: '$cancer' }
              }
            }
          ],

          // Tests by location if no specific location filter
          testsByLocation: [
            {
              $match: {
                $or: [
                  { randomBloodSugar: { $exists: true } },
                  { malaria_ag_test: { $exists: true } },
                  { hiv_screening: { $exists: true } },
                  { urinalysis: { $exists: true } },
                  { disease_burden: { $exists: true } },
                  { cancer_screening: { $exists: true } }
                ]
              }
            },
            {
              $group: {
                _id: '$location',
                count: { $sum: 1 }
              }
            }
          ],

          // Tests by staff if staffEmail provided
          testsByStaff: [
            {
              $match: {
                $or: [
                  { 'randomBloodSugar.userEmail': staffEmail },
                  { 'malaria_ag_test.userEmail': staffEmail },
                  { 'hiv_screening.userEmail': staffEmail },
                  { 'urinalysis.userEmail': staffEmail },
                  { 'disease_burden.userEmail': staffEmail },
                  { 'cancer_screening.userEmail': staffEmail }
                ]
              }
            },
            {
              $group: {
                _id: '$staffEmail',
                count: { $sum: 1 }
              }
            }
          ]
        }
      }
    ];

    const stats = await Patient.aggregate(pipeline);

    const response = {
      total_patients_with_labs: stats[0].totalLabTests[0]?.count || 0,
      tests_by_type: stats[0].testsByType[0] || {
        bloodSugarTests: 0,
        malariaTests: 0,
        hivTests: 0,
        urinalysisTests: 0,
        hba1cTests: 0,
        cancerScreenings: 0
      },
      tests_by_location: stats[0].testsByLocation || [],
      tests_by_staff: staffEmail ? stats[0].testsByStaff : undefined
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getLocations = async (req, res) => {
  try {
    const locations = await Patient.distinct('location');
    res.json({
      status: 'success',
      data: {
        locations: locations
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    const { location } = req.query;
    
    const pipeline = [];
    
    // Match stage for location filter
    if (location) {
      pipeline.push({ $match: { location } });
    }

    pipeline.push({
      $facet: {
        // Metadata - total records
        totalRecords: [
          { $count: 'count' }
        ],

        // Age distribution
        ageDistribution: [
          {
            $bucket: {
              groupBy: '$age',
              boundaries: [0, 19, 31, 51, 71],
              default: '71+',
              output: {
                count: { $sum: 1 }
              }
            }
          }
        ],

        // Gender distribution
        genderDistribution: [
          {
            $group: {
              _id: {
                $cond: [
                  { $eq: [{ $type: '$gender' }, 'string'] },
                  { $toLower: '$gender' },
                  'unknown'
                ]
              },
              count: { $sum: 1 }
            }
          }
        ],

        // Updated Insurance coverage (NHIF/SHIF)
        insuranceCoverage: [
          {
            $group: {
              _id: '$location',
              covered: {
                $sum: {
                  $cond: {
                    if: {
                      $or: [
                        { $eq: ['$nhif', true] },
                        { $eq: ['$shif', true] }
                      ]
                    },
                    then: 1,
                    else: 0
                  }
                }
              },
              total: { $sum: 1 }
            }
          }
        ],

        // Blood pressure metrics
        bloodPressure: [
          {
            $match: {
              'triage.systolic_pressure': { $exists: true },
              'triage.diastolic_pressure': { $exists: true }
            }
          },
          {
            $group: {
              _id: null,
              avgSystolic: { $avg: '$triage.systolic_pressure' },
              avgDiastolic: { $avg: '$triage.diastolic_pressure' },
              hypertensionCount: {
                $sum: {
                  $cond: [
                    {
                      $or: [
                        { $gte: ['$triage.systolic_pressure', 140] },
                        { $gte: ['$triage.diastolic_pressure', 90] }
                      ]
                    },
                    1,
                    0
                  ]
                }
              },
              total: { $sum: 1 }
            }
          }
        ],

        // BMI categories
        bmiStats: [
          {
            $match: {
              'triage.height': { $exists: true, $ne: 0 },
              'triage.weight': { $exists: true }
            }
          },
          {
            $project: {
              bmi: {
                $divide: [
                  { $convert: { input: '$triage.weight', to: 'double', onError: 0 } },
                  {
                    $pow: [
                      { $divide: [
                        { $convert: { input: '$triage.height', to: 'double', onError: 100 } },
                        100
                      ] },
                      2
                    ]
                  }
                ]
              }
            }
          },
          {
            $group: {
              _id: {
                $switch: {
                  branches: [
                    { case: { $lt: ['$bmi', 18.5] }, then: 'underweight' },
                    { case: { $lt: ['$bmi', 25] }, then: 'normal' },
                    { case: { $lt: ['$bmi', 30] }, then: 'overweight' }
                  ],
                  default: 'obese'
                }
              },
              count: { $sum: 1 }
            }
          }
        ],

        // Medical conditions
        medicalConditions: [
          {
            $unwind: {
              path: '$medical_conditions',
              preserveNullAndEmptyArrays: false
            }
          },
          {
            $group: {
              _id: '$medical_conditions',
              count: { $sum: 1 }
            }
          },
          { $sort: { count: -1 } },
          { $limit: 10 }
        ]
      }
    });

    const [result] = await Patient.aggregate(pipeline);

    // Format age distribution
    const ageGroups = {
      '0-18': 0,
      '19-30': 0,
      '31-50': 0,
      '51-70': 0,
      '70+': 0
    };
    result.ageDistribution.forEach(({ _id, count }) => {
      const ranges = ['0-18', '19-30', '31-50', '51-70', '70+'];
      const index = _id === '71+' ? 4 : Math.floor(_id / 19);
      ageGroups[ranges[index]] = count;
    });

    // Format gender distribution
    const genderCounts = {
      male: 0,
      female: 0
    };
    result.genderDistribution.forEach(({ _id, count }) => {
      if (_id === 'male' || _id === 'female') {
        genderCounts[_id] = count;
      }
    });

    const totalRecords = result.totalRecords[0]?.count || 0;
    const bpStats = result.bloodPressure[0] || {
      avgSystolic: 0,
      avgDiastolic: 0,
      hypertensionCount: 0,
      total: 0
    };

    // Format BMI categories
    const bmiCategories = {
      underweight: 0,
      normal: 0,
      overweight: 0,
      obese: 0
    };
    result.bmiStats.forEach(({ _id, count }) => {
      bmiCategories[_id] = count;
    });

    const response = {
      status: 'success',
      data: {
        metadata: {
          total_records: totalRecords
        },
        insights: {
          demographic_insights: {
            age_distribution: {
              groups: ageGroups
            },
            gender_distribution: genderCounts
          },
          health_metrics: {
            blood_pressure: {
              average_systolic: bpStats.avgSystolic || 0,
              average_diastolic: bpStats.avgDiastolic || 0,
              hypertension_risk: bpStats.total ? bpStats.hypertensionCount / bpStats.total : 0
            },
            bmi_analysis: {
              bmi_categories: bmiCategories
            }
          },
          coverage_analysis: {
            insurance_coverage: {
              coverage_rate: result.insuranceCoverage.reduce((acc, loc) => 
                acc + (loc.covered / loc.total), 0) / result.insuranceCoverage.length,
              coverage_by_location: result.insuranceCoverage.reduce((acc, loc) => ({
                ...acc,
                [loc._id]: loc.covered / loc.total
              }), {})
            },
            service_metrics: {
              locations_covered: result.insuranceCoverage.length
            }
          },
          medical_analysis: {
            top_conditions: result.medicalConditions.reduce((acc, { _id, count }) => ({
              ...acc,
              [_id]: count
            }), {})
          }
        }
      }
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.getPatients = async (req, res) => {
  try {
    const { page = 1, limit = 10, sort_by = 'updatedAt', sort_order = 'desc', location, search } = req.query;

    let query = {};
    if (location) query.location = location;
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { location: new RegExp(search, 'i') }
      ];
    }

    const totalRecords = await Patient.countDocuments(query);
    const totalPages = Math.ceil(totalRecords / limit);

    const patients = await Patient.find(query)
      .sort({ [sort_by]: sort_order === 'asc' ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      status: 'success',
      data: {
        patients,
        pagination: {
          total_records: totalRecords,
          total_pages: totalPages,
          current_page: page,
          has_next: page < totalPages,
          has_previous: page > 1
        }
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPatientDetails = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.json({
      status: 'success',
      data: patient
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.getFirstHundredPatients = async (req, res) => {
  try {
    const patients = await Patient.find({})
      .limit(100)
      .sort({ createdAt: 1 }); // sorts by creation date, oldest first

    res.json(patients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getLabData = async (req, res) => {
  try {
    const { patientId, location } = req.query;
    
    let query = {};
    if (patientId) query.patientId = parseInt(patientId);
    if (location) query.location = location;

    const labData = await Patient.find(query).select({
      name: 1,
      patientId: 1,
      location: 1,
      randomBloodSugar: 1,
      malaria_ag_test: 1,
      hiv_screening: 1,
      urinalysis: 1,
      disease_burden: 1,
      cancer_screening: 1,
      reproductive_screening: 1,
      'triage.userEmail': 1,
      'triage.userRole': 1
    });

    // Transform the data to include staff details and lab tests
    const formattedData = labData.map(patient => {
      const labTests = {
        patient_name: patient.name,
        patient_id: patient.patientId,
        location: patient.location,
        triage_staff: patient.triage?.userEmail ? {
          email: patient.triage.userEmail,
          role: patient.triage.userRole
        } : null,
        tests: {}
      };

      // Add lab tests if they exist
      if (patient.randomBloodSugar) {
        labTests.tests.blood_sugar = {
          value: patient.randomBloodSugar.sugar,
          staff: {
            email: patient.randomBloodSugar.userEmail,
            role: patient.randomBloodSugar.userRole
          }
        };
      }

      if (patient.malaria_ag_test) {
        labTests.tests.malaria = {
          result: patient.malaria_ag_test.malaria_ag_test,
          staff: {
            email: patient.malaria_ag_test.userEmail,
            role: patient.malaria_ag_test.userRole
          }
        };
      }

      if (patient.hiv_screening) {
        labTests.tests.hiv = {
          result: patient.hiv_screening.discordant_test_result,
          staff: {
            email: patient.hiv_screening.userEmail,
            role: patient.hiv_screening.userRole
          }
        };
      }

      if (patient.urinalysis) {
        labTests.tests.urinalysis = {
          results: {
            leucocytes: patient.urinalysis.leucocytes,
            nitrites: patient.urinalysis.nitrites,
            ph: patient.urinalysis.ph,
            blood: patient.urinalysis.blood,
            protein: patient.urinalysis.protein,
            glucose: patient.urinalysis.glucose
          },
          staff: {
            email: patient.urinalysis.userEmail,
            role: patient.urinalysis.userRole
          }
        };
      }

      if (patient.disease_burden) {
        labTests.tests.hba1c = {
          value: patient.disease_burden.hb1a_test,
          staff: {
            email: patient.disease_burden.userEmail,
            role: patient.disease_burden.userRole
          }
        };
      }

      if (patient.cancer_screening) {
        labTests.tests.cancer_screening = {
          results: {
            via: patient.cancer_screening.via,
            psa: patient.cancer_screening.psa,
            rapidPsa: patient.cancer_screening.rapidPsa,
            ca125: patient.cancer_screening.ca125,
            ca199: patient.cancer_screening.ca199,
            cea: patient.cancer_screening.cea
          },
          staff: {
            email: patient.cancer_screening.userEmail,
            role: patient.cancer_screening.userRole
          }
        };
      }

      return labTests;
    });

    res.json(formattedData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.getHourlyRegistrations = async (req, res) => {
  try {
    const { location } = req.query;
    const pipeline = [
      {
        $match: {
          location: location || 'Baringo',
          createdAt: {
            $gte: new Date(new Date().setHours(0, 0, 0, 0)) // Start of today
          }
        }
      },
      {
        $group: {
          _id: {
            hour: { $hour: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { "_id.hour": 1 }
      }
    ];

    const hourlyStats = await Patient.aggregate(pipeline);
    
    // Format for 24-hour timeline
    const formattedData = Array(24).fill(0);
    hourlyStats.forEach(stat => {
      formattedData[stat._id.hour] = stat.count;
    });

    res.json({
      location: location || 'Baringo',
      hourly_data: formattedData,
      total: formattedData.reduce((a, b) => a + b, 0)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};