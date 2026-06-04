const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  supplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: [true, 'Supplier ID is required']
  },
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative']
  },
  isAvailable: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Multi-tenant indexes for optimal queries
ProductSchema.index({ supplierId: 1 });
ProductSchema.index({ supplierId: 1, isAvailable: 1 });

const Product = mongoose.model('Product', ProductSchema);

module.exports = Product;
