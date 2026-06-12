const mongoose = require('mongoose');

/**
 * Atomic counter for sequential ID generation.
 * Uses findOneAndUpdate with $inc to avoid race conditions.
 */
const CounterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 999 }
});

module.exports = mongoose.model('Counter', CounterSchema);
