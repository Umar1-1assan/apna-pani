const mongoose = require('mongoose');

const InvoiceSchema = new mongoose.Schema({
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
  orderIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  }],
  billingCycle: {
    type: String,
    enum: ['weekly', 'fortnightly', 'monthly', 'ad-hoc'],
    default: 'ad-hoc'
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  dueDate: {
    type: Date
  },
  collectionMethod: {
    type: String,
    enum: ['online', 'cash'],
    default: 'cash'
  },
  collectionRiderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DeliveryBoy'
  },
  totalAmount: {
    type: Number,
    default: 0
  },
  totalPaymentReceived: {
    type: Number,
    default: 0
  },
  totalBottles: {
    type: Number,
    default: 0,
    min: [0, 'Cannot be negative']
  },
  bottlePrice: {
    type: Number,
    required: [true, 'Bottle price is required'],
    min: [1, 'Price must be at least 1 PKR']
  },
  previousDues: {
    type: Number,
    default: 0,
    min: [0, 'Cannot be negative']
  },
  arrearsDetails: [{
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice'
    },
    invoiceStringId: String,
    period: String,
    amountDue: Number
  }],
  discounts: {
    type: Number,
    default: 0,
    min: [0, 'Cannot be negative']
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: [0, 'Cannot be negative']
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'partial', 'pending_confirmation', 'paid'],
    default: 'unpaid'
  },
  pdfUrl: String,
  sentVia: {
    type: String,
    enum: ['whatsapp', 'sms', 'manual', 'email']
  },
  generatedAt: {
    type: Date,
    default: Date.now
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

// Virtual field: subtotal
InvoiceSchema.virtual('subtotal').get(function() {
  return this.totalBottles * this.bottlePrice;
});


// Indexes
InvoiceSchema.index({ supplierId: 1 });
InvoiceSchema.index({ customerId: 1 });
InvoiceSchema.index({ startDate: 1, endDate: 1 });

const Invoice = mongoose.model('Invoice', InvoiceSchema);

module.exports = Invoice;
