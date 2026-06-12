const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');

async function runMigration() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ MongoDB connected');

    console.log('Removing passwordText field from all user documents...');
    const result = await User.updateMany(
      { passwordText: { $exists: true } },
      { $unset: { passwordText: "" } }
    );

    console.log(`✓ Migration completed! Modified ${result.modifiedCount} user documents.`);
    process.exit(0);
  } catch (error) {
    console.error('✗ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
