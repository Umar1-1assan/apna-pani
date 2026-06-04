const mongoose = require('mongoose');

const SubscriptionPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Plan name is required'],
    unique: true,
    enum: ['basic', 'standard', 'enterprise']
  },
  displayName: {
    type: String,
    required: [true, 'Display name is required']
  },
  maxCustomers: {
    type: Number
  },
  maxRiders: {
    type: Number
  },
  pricePkr: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  features: {
    whatsapp: Boolean,
    sms: Boolean,
    reports: Boolean,
    api: Boolean,
    gps: Boolean,
    customBranding: Boolean,
    support: String
  },
  description: String,
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

SubscriptionPlanSchema.index({ isActive: 1 });

const SubscriptionPlan = mongoose.model('SubscriptionPlan', SubscriptionPlanSchema);

module.exports = SubscriptionPlan;
