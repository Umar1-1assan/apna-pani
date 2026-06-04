const mongoose = require('mongoose');

const SubscriptionRequestSchema = new mongoose.Schema({
  supplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: [true, 'Supplier ID is required']
  },
  currentPlan: {
    type: String,
    enum: ['basic', 'standard', 'enterprise'],
    required: true
  },
  requestedPlan: {
    type: String,
    enum: ['basic', 'standard', 'enterprise'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  adminNotes: {
    type: String,
    trim: true
  }
}, { timestamps: true });

SubscriptionRequestSchema.index({ supplierId: 1, status: 1 });
SubscriptionRequestSchema.index({ status: 1 });

const SubscriptionRequest = mongoose.model('SubscriptionRequest', SubscriptionRequestSchema);

module.exports = SubscriptionRequest;
