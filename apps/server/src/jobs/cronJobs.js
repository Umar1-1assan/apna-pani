const cron = require('node-cron');
const Supplier = require('../models/Supplier');
const { generateDeliveriesForSupplier } = require('../services/delivery.service');

function initCronJobs(io) {
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

  // End of Month Billing Job (Placeholder logic)
  cron.schedule('55 23 28-31 * *', async () => {
    // Logic to run only on the last day of the month
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (tomorrow.getDate() === 1) {
      console.log('[CRON] Running End of Month Billing Generation...');
      // Future logic: Aggregate walletBalances into Invoices
    }
  });
}

module.exports = { initCronJobs };
