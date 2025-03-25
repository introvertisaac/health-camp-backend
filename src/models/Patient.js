const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  name: String,
  age: Number,
  gender: String,
  phone_number: Number,
  address: String,
  occupation: String,
  marital_status: String,
  nhif: Boolean,
  medical_conditions: [String],
  patientId: Number,
  
  // Triage information
  triage: {
    height: Number,
    weight: Number,
    systolic_pressure: Number,
    diastolic_pressure: Number,
    temperature: Number,
    arm_circumference: Number,
    sp02: Number,
    previous_admissions: Boolean,
    previous_surgeries: Boolean,
    employed: Boolean,
    income: String,
    smoking: Boolean,
    alcohol: Boolean,
    on_medication: Boolean,
    food_allergy: Boolean,
    drug_allergy: Boolean,
    vaccination_status: String,
    userEmail: String,
    userRole: String
  },
  
  // General health information
  general_health: {
    chief_complaint: String,
    history_of_presenting_illness: String,
    general_exam: String,
    cvs: String,
    cns: String,
    resp: String,
    git: String,
    systemic: String,
    diagnosis: String,
    treatment: String,
    userEmail: String,
    userRole: String
  },
  
  // Random blood sugar test
  randomBloodSugar: {
    sugar: Number,
    userEmail: String,
    userRole: String
  },
  
  // Nutrition information
  nutrition: {
    bmi: Number,
    bmi_5_17: String,
    bmi_18: String,
    weight: String,
    muac: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    userEmail: String,
    userRole: String
  },
  
  // Child health information
  child_health: {
    development_milestone: String,
    access_to_clean_water: Boolean,
    userEmail: String,
    userRole: String
  },
  
  // Non-communicable diseases
  non_comunicable_diseases: {
    diagnosed_with_ncd: [String],
    current_tratment_plan: Boolean,
    family_history_of_ncd: Boolean,
    ncd_date_of_diagnosis: Date,
    physical_activity_level: String,
    exposure_to_toxins: Boolean,
    userEmail: String,
    userRole: String
  },
  
  // Maternal health information
  maternal_health: {
    pregnant: Boolean,
    breastfeeding: Boolean,
    pregnancies_no: Number,
    postpartum_care_received: Boolean,
    pregnancy_complications: Boolean,
    miscarriages: Number,
    weeks_of_pregnancy: Number,
    pregnancy_rapid_test: String,
    userEmail: String,
    userRole: String
  },
  
  // Sexual health information
  sexual_health: {
    sexually_active: Boolean,
    using_contraceptives: Boolean,
    frequency_of_contraceptive: String,
    history_of_unintended_pregnancy: Boolean,
    knowledge_of_contraceptive_types: Boolean,
    history_of_sti: String,
    data_collection_method: String,
    contraceptive_fitted: String,
    education: String,
    userEmail: String,
    userRole: String
  },
  
  // Testing results
  malaria_ag_test: {
    malaria_ag_test: String,
    userEmail: String,
    userRole: String
  },
  
  hiv_screening: {
    discordant_test_result: String,
    userEmail: String,
    userRole: String
  },
  
  urinalysis: {
    leucocytes: String,
    nitrites: String,
    urobilinogen: String,
    protein: String,
    ph: Number,
    blood: String,
    specific_gravity: Number,
    ketones: String,
    bilirubin: String,
    glucose: String,
    reference_range: String,
    userEmail: String,
    userRole: String
  },
  
  disease_burden: {
    hb1a_test: Number,
    userEmail: String,
    userRole: String
  },
  
  cancer_screening: {
    via: String,
    psa: Number,
    rapidPsa: String,
    ca125: Number,
    ca199: Number,
    cea: Number,
    userEmail: String,
    userRole: String
  },
  
  fistula_camp_attendance: {
    obstetric_gynaecological_history: String,
    examination: String,
    diagnosis: String,
    muscle_power: String,
    plan_of_action: String,
    comments_observations: String,
    userEmail: String,
    userRole: String
  },
  
  dental_test: {
    dental_history: String,
    teeth_condition: String,
    pain_level: String,
    treatment_received: String,
    dental_medication: String,
    userEmail: String,
    userRole: String
  },
  
  reproductive_screening: {
    chlamydia_test_result: String,
    gonorrhea_test_result: String,
    pregnancy: String,
    userEmail: String,
    userRole: String
  },
  
  covid_test: {
    covid_vaccine_type: String,
    covid_vaccine_doses: String,
    covid_booster_received: Boolean
  },
  
  eye_ear_test_result: {
    eye_test_diagnosis: String
  },
  
  mental_health: {
    mental_health_diagnosis: String
  },
  
  patients_with_disabilities: {
    disability_diagnosis: String
  },
  
  location: String,
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

module.exports = mongoose.model('Patient', patientSchema, 'patients');