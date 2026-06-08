const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
  supplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: [true, 'Supplier ID is required']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required']
  },
  address: {
    type: String
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    }
  },
  deliveryBoyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DeliveryBoy'
  },
  bottlesPerDelivery: {
    type: Number,
    default: 2,
    min: [1, 'Must order at least 1 bottle per delivery']
  },
  nextDeliveryDate: {
    type: Date
  },
  lastDeliveryDate: {
    type: Date
  },
  deliveryFrequency: {
    type: Number,
    default: 1,
    min: [1, 'Delivery frequency must be at least 1 day'],
    max: [30, 'Delivery frequency cannot exceed 30 days']
  },
  bottlePrice: {
    type: Number,
    required: [true, 'Bottle price is required'],
    min: [1, 'Price must be at least 1 PKR']
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'blocked', 'pending_payment', 'cancelled'],
    default: 'active'
  },
  lastInvoiceDate: {
    type: Date
  },
  outstandingDues: {
    type: Number,
    default: 0
  },
  billingCycle: {
    type: String,
    enum: ['weekly', 'fortnightly', 'monthly'],
    default: 'monthly'
  },
  deliveryCharges: {
    type: Number,
    default: 0
  },
  preferredDeliveryTime: {
    type: String,
    enum: ['any', 'morning', 'afternoon', 'evening'],
    default: 'any'
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

// GeoJSON index for location queries
CustomerSchema.index({ location: '2dsphere' });

// Multi-tenant indexes
CustomerSchema.index({ supplierId: 1 });
CustomerSchema.index({ supplierId: 1, status: 1 });
CustomerSchema.index({ supplierId: 1, deliveryBoyId: 1 });

const Customer = mongoose.model('Customer', CustomerSchema);

module.exports = Customer;
