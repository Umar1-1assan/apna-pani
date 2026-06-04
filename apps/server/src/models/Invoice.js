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
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  month: {
    type: Number,
    required: [true, 'Month is required'],
    min: [1, 'Month must be 1-12'],
    max: [12, 'Month must be 1-12']
  },
  year: {
    type: Number,
    required: [true, 'Year is required'],
    min: [2020, 'Year must be 2020 or later']
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
    enum: ['unpaid', 'partial', 'paid'],
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
InvoiceSchema.index({ month: 1, year: 1 });

const Invoice = mongoose.model('Invoice', InvoiceSchema);

module.exports = Invoice;
