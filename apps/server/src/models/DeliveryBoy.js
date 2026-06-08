const mongoose = require('mongoose');

const DeliveryBoySchema = new mongoose.Schema({
  supplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: [true, 'Supplier ID is required']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    unique: true  // index created by unique:true — no need for schema.index()
  },
  areaName: {
    type: String,
    required: [true, 'Area name is required'],
    trim: true
  },
  cnicNumber: {
    type: String,
    default: null
  },
  totalDeliveries: {
    type: Number,
    default: 0
  },
  totalEarnings: {
    type: Number,
    default: 0
  },
  cashInHand: {
    type: Number,
    default: 0
  },
  totalCashRemitted: {
    type: Number,
    default: 0
  },
  assignedCustomers: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Indexes — userId unique index created by unique:true on field
DeliveryBoySchema.index({ supplierId: 1 });
DeliveryBoySchema.index({ isActive: 1 });

const DeliveryBoy = mongoose.model('DeliveryBoy', DeliveryBoySchema);

module.exports = DeliveryBoy;
