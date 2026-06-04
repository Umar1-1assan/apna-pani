const mongoose = require('mongoose');

const AdminInvoiceSchema = new mongoose.Schema({
  supplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true
  },
  invoiceNumber: {
    type: String,
    required: true,
    unique: true
  },
  amount: {
    type: Number,
    required: true
  },
  billingPeriodStart: {
    type: Date,
    required: true
  },
  billingPeriodEnd: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['unpaid', 'paid', 'overdue'],
    default: 'unpaid'
  }
}, { timestamps: true });

const AdminInvoice = mongoose.model('AdminInvoice', AdminInvoiceSchema);

module.exports = AdminInvoice;
