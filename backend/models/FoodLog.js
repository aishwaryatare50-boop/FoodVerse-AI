const mongoose = require('mongoose');

const foodLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['food_recognition', 'freshness', 'hygiene', 'cooking', 'meal_plan', 'manual_meal'],
      default: 'food_recognition',
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    summary: {
      type: String,
      default: '',
    },
    calories: {
      type: Number,
      default: 0,
      min: 0,
    },
    macros: {
      protein_g: { type: Number, default: 0 },
      carbs_g: { type: Number, default: 0 },
      fat_g: { type: Number, default: 0 },
      fiber_g: { type: Number, default: 0 },
    },
    healthScore: {
      type: Number,
      default: 80,
      min: 0,
      max: 100,
    },
    healthGrade: {
      type: String,
      default: 'B',
      enum: ['A+', 'A', 'B', 'C', 'D', 'F', 'N/A'],
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    loggedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('FoodLog', foodLogSchema);
