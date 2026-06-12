const mongoose = require('mongoose');

/**
 * Token Blacklist - stores revoked JWT tokens.
 * TTL index auto-deletes expired entries from MongoDB.
 */
const TokenBlacklistSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  expiresAt: { type: Date, required: true }
});

// Auto-delete expired entries (TTL index)
TokenBlacklistSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('TokenBlacklist', TokenBlacklistSchema);
