const mongoose = require('mongoose');

const SupplierSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    unique: true  // index created by unique:true — no need for schema.index()
  },
  businessName: {
    type: String,
    required: [true, 'Business name is required'],
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    enum: ['Rawalpindi', 'Islamabad', 'Lahore', 'Karachi', 'Multan', 'Peshawar', 'Quetta', 'Faisalabad', 'Other'],
    default: 'Other'
  },
  taxId: {
    type: String,
    trim: true
  },
  businessType: {
    type: String,
    trim: true
  },
  state: {
    type: String,
    trim: true
  },
  postalCode: {
    type: String,
    trim: true
  },
  country: {
    type: String,
    trim: true,
    default: 'Pakistan'
  },
  region: {
    type: String,
    trim: true
  },
  plan: {
    type: String,
    enum: ['basic', 'standard', 'enterprise'],
    default: 'basic'
  },
  planExpiresAt: {
    type: Date
  },
  logoUrl: {
    type: String
  },
  whatsappToken: {
    type: String,
    select: false
  },
  whatsappPhoneId: {
    type: String
  },
  smsEnabled: {
    type: Boolean,
    default: false
  },
  totalCustomers: {
    type: Number,
    default: 0
  },
  totalRiders: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Indexes — userId unique index created by unique:true on field
SupplierSchema.index({ isActive: 1 });
SupplierSchema.index({ plan: 1 });
SupplierSchema.index({ businessName: 'text' });

const Supplier = mongoose.model('Supplier', SupplierSchema);

module.exports = Supplier;
