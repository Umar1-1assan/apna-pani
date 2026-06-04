const User = require('../models/User');

/**
 * Seed Super Admin on server startup if not already present
 */
const seedSuperAdmin = async () => {
  try {
    const adminPhone = process.env.SUPER_ADMIN_PHONE || '+923001234567';
    const adminEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@aquaflow.com';

    // Check if admin already exists by email or phone
    const existingAdmin = await User.findOne({
      $or: [{ phone: adminPhone }, { email: adminEmail }]
    });

    if (!existingAdmin) {
      console.log('⟳ Seeding Super Admin user...');
      const admin = new User({
        username: 'admin',
        phone: adminPhone,
        email: adminEmail,
        fullName: process.env.SUPER_ADMIN_NAME || 'Super Admin',
        role: 'super_admin',
        password: process.env.SUPER_ADMIN_PASSWORD || 'admin123',
        passwordText: process.env.SUPER_ADMIN_PASSWORD || 'admin123',
        isActive: true
      });
      // Hash is performed in User schema pre-save hook
      await admin.save();
      console.log('✓ Super Admin account seeded successfully');
    } else if (!existingAdmin.username || !existingAdmin.passwordText) {
      console.log('⟳ Updating existing Super Admin with username & passwordText...');
      existingAdmin.username = 'admin';
      existingAdmin.password = process.env.SUPER_ADMIN_PASSWORD || 'admin123';
      existingAdmin.passwordText = process.env.SUPER_ADMIN_PASSWORD || 'admin123';
      await existingAdmin.save();
      console.log('✓ Super Admin account updated successfully');
    } else {
      console.log('✓ Super Admin account verified (already exists)');
    }
  } catch (error) {
    console.error('✗ Failed to seed Super Admin:', error.message);
  }
};

const SubscriptionPlan = require('../models/SubscriptionPlan');

/**
 * Seed Subscription Plans
 */
const seedPlans = async () => {
  try {
    const plans = [
      {
        name: 'basic',
        displayName: 'Basic Plan',
        maxCustomers: 20,
        maxRiders: 3,
        pricePkr: 0,
        description: 'For small water suppliers starting out',
        features: { whatsapp: false, sms: false, reports: false, api: false, gps: false, customBranding: false, support: 'Email' }
      },
      {
        name: 'standard',
        displayName: 'Standard Plan',
        maxCustomers: 200,
        maxRiders: 10,
        pricePkr: 5000,
        description: 'For growing water suppliers',
        features: { whatsapp: true, sms: false, reports: true, api: false, gps: true, customBranding: false, support: 'Email & Chat' }
      },
      {
        name: 'enterprise',
        displayName: 'Enterprise Plan',
        maxCustomers: 999999, // practically unlimited
        maxRiders: 999999, // practically unlimited
        pricePkr: 15000,
        description: 'For large scale water distribution networks',
        features: { whatsapp: true, sms: true, reports: true, api: true, gps: true, customBranding: true, support: '24/7 Priority' }
      }
    ];

    for (const planData of plans) {
      const existingPlan = await SubscriptionPlan.findOne({ name: planData.name });
      if (!existingPlan) {
        const plan = new SubscriptionPlan(planData);
        await plan.save();
        console.log(`✓ Seeded ${planData.name} plan`);
      } else {
        // Update existing plan with new limits if needed
        existingPlan.maxCustomers = planData.maxCustomers;
        existingPlan.maxRiders = planData.maxRiders;
        await existingPlan.save();
      }
    }
  } catch (error) {
    console.error('✗ Failed to seed plans:', error.message);
  }
};

module.exports = { seedSuperAdmin, seedPlans };
