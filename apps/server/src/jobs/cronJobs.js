const cron = require('node-cron');
const Supplier = require('../models/Supplier');
const { generateDeliveriesForSupplier } = require('../services/delivery.service');

function initCronJobs(io) {
  // Auto-fail Past Due Deliveries Job
  // Run every day at 12:01 AM
  cron.schedule('1 0 * * *', async () => {
    console.log('[CRON] Starting Auto-fail Past Due Deliveries Job...');
    const Order = require('../models/Order');
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const result = await Order.updateMany(
        {
          status: { $in: ['pending', 'assigned', 'in_transit'] },
          deliveryDate: { $lt: today }
        },
        { 
          $set: { 
            status: 'failed',
            failureReason: 'Auto-failed: Not delivered on scheduled date.',
            notes: 'System: Automatically marked as failed due to missing delivery.'
          } 
        }
      );
      
      if (result.modifiedCount > 0) {
        console.log(`[CRON] Auto-fail Complete. Marked ${result.modifiedCount} past due orders as failed.`);
      } else {
        console.log('[CRON] Auto-fail Complete. No past due orders found.');
      }
    } catch (error) {
      console.error('[CRON] Error in Auto-fail Job:', error);
    }
  });

  // Run every day at 12:05 AM
  cron.schedule('5 0 * * *', async () => {
    console.log('[CRON] Starting Daily Delivery Generation Job...');
    
    try {
      // 1. Fetch all active suppliers
      const suppliers = await Supplier.find({ isActive: true });
      let totalGenerated = 0;

      for (const supplier of suppliers) {
        const result = await generateDeliveriesForSupplier(supplier._id.toString(), io);
        if (result.success) {
          totalGenerated += result.count;
        }
      }

      console.log(`[CRON] Daily Delivery Generation Complete. Generated ${totalGenerated} orders globally.`);
      
    } catch (error) {
      console.error('[CRON] Error in Daily Delivery Generation Job:', error);
    }
  });

  // Billing Cycle Invoice Generation Job
  // Run every day at 1:00 AM
  cron.schedule('0 1 * * *', async () => {
    console.log('[CRON] Starting Billing Cycle Invoice Generation Job...');
    const { generateBillingCycleInvoices } = require('../services/invoice.service');
    try {
      const result = await generateBillingCycleInvoices(io);
      console.log(`[CRON] Billing Generation Complete. ${result.message}`);
    } catch (error) {
      console.error('[CRON] Error in Billing Generation Job:', error);
    }
  });
}

module.exports = { initCronJobs };
