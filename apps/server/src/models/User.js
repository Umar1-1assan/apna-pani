const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    match: [/^\+92[0-9]{10}$/, 'Invalid E.164 phone format. Must be +92XXXXXXXXXX']
  },
  fullName: {
    type: String,
    required: [true, 'Full name is required']
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format']
  },
  role: {
    type: String,
    enum: ['super_admin', 'supplier', 'delivery_boy', 'customer'],
    required: [true, 'Role is required']
  },
  password: {
    type: String,
    select: false
  },
  passwordText: {
    type: String
  },
  resetCode: {
    type: String
  },
  resetCodeExpires: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
}, { timestamps: true });

// Hash password before saving (only for super_admin)
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  
  try {
    const bcrypt = require('bcryptjs');
    this.password = await bcrypt.hash(this.password, 12);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
UserSchema.methods.comparePassword = async function(inputPassword) {
  try {
    const bcrypt = require('bcryptjs');
    return await bcrypt.compare(inputPassword, this.password);
  } catch (error) {
    return false;
  }
};

// Indexes — phone unique index already created by unique:true on the field
UserSchema.index({ role: 1 });

const User = mongoose.model('User', UserSchema);

module.exports = User;
