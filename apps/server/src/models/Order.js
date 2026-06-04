const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    unique: true
  },
  supplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: [true, 'Supplier ID is required']
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: [true, 'Customer ID is required']
  },
  deliveryBoyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DeliveryBoy'
  },
  productType: {
    type: String,
    enum: ['19L carboy', 'refill', 'bottles'],
    default: '19L carboy'
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  deliveryDate: {
    type: Date,
    required: true
  },
  timeSlot: {
    type: String,
    enum: ['morning', 'afternoon', 'evening'],
    default: 'morning'
  },
  deliveryAddress: {
    type: String,
    required: true
  },
  deliveryType: {
    type: String,
    enum: ['standard', 'express'],
    default: 'standard'
  },
  deliveryFee: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'assigned', 'in_transit', 'arrived', 'delivered', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  statusTimeline: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    actorRole: { type: String, enum: ['system', 'supplier', 'delivery_boy', 'customer'] },
    actorId: mongoose.Schema.Types.ObjectId
  }],
  customerConfirmed: {
    type: Boolean,
    default: false
  },
  customerConfirmedAt: Date,
  paymentMethod: {
    type: String,
    enum: ['COD', 'Easypaisa', 'JazzCash', 'Credit'],
    default: 'COD'
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid'],
    default: 'unpaid'
  },
  paymentReceivedAt: Date,
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  emptyCarboysReturned: {
    type: Number,
    default: 0
  },
  failureReason: {
    type: String
  },
  notes: {
    type: String
  },
  proofPhotoUrl: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Pre-save hook to generate sequential Order ID (e.g. ORD-1042)
OrderSchema.pre('save', async function(next) {
  if (this.isNew) {
    const lastOrder = await mongoose.model('Order').findOne({}, {}, { sort: { 'createdAt' : -1 } });
    if (lastOrder && lastOrder.orderId) {
      const lastNumber = parseInt(lastOrder.orderId.split('-')[1]);
      this.orderId = `ORD-${lastNumber + 1}`;
    } else {
      this.orderId = 'ORD-1000';
    }
  }
  next();
});

// Indexes
OrderSchema.index({ supplierId: 1 });
OrderSchema.index({ customerId: 1 });
OrderSchema.index({ deliveryBoyId: 1 });
OrderSchema.index({ status: 1 });

const Order = mongoose.model('Order', OrderSchema);

module.exports = Order;
