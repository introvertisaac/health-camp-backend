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
  shif: Boolean,
  medical_conditions: [String],
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
    vaccination_status: String
  },
  location: String,
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

module.exports = mongoose.model('Patient', patientSchema, 'patients');