const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');
const Order = require('../models/Order');

/**
 * Generate automated deliveries for a specific supplier for "today".
 * 
 * Uses Date Difference Algorithm:
 * A delivery is due if: 
 * (Today - LastDeliveryDate) >= DeliveryFrequency OR LastDeliveryDate is null
 * 
 * @param {String} supplierId - The ID of the supplier
 * @param {Object} io - Socket.io instance for real-time events (optional)
 * @returns {Object} result - { success: boolean, count: number, message: string }
 */
async function generateDeliveriesForSupplier(supplierId, io = null) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const currentDayOfWeek = today.getDay();

    const supplier = await Supplier.findById(supplierId);
    if (!supplier || !supplier.isActive) {
      return { success: false, count: 0, message: 'Supplier not found or inactive' };
    }

    const operatingDays = supplier.operatingDays || [0, 1, 2, 3, 4, 5, 6];
    
    // Check if today is an operating day for this supplier
    if (!operatingDays.includes(currentDayOfWeek)) {
      return { success: true, count: 0, message: 'Today is an off-day for this supplier. No deliveries generated.' };
    }

    // Fetch the supplier's first active product to use as default productType
    const Product = require('../models/Product');
    const defaultProduct = await Product.findOne({ supplierId: supplierId, isAvailable: true });
    const fallbackProductType = defaultProduct ? defaultProduct.name : 'Standard Product';

    // Fetch all active customers for this supplier
    const customers = await Customer.find({ supplierId: supplierId, status: 'active' });
    let generatedCount = 0;

    for (const customer of customers) {
      let isDue = false;

      if (!customer.lastDeliveryDate) {
        // First-time delivery
        isDue = true;
      } else {
        // Date Difference Logic
        // Calculate difference in milliseconds, then convert to days
        const lastDate = new Date(customer.lastDeliveryDate);
        lastDate.setHours(0, 0, 0, 0);
        
        const diffTime = Math.abs(today - lastDate);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays >= (customer.deliveryFrequency || 1)) {
          isDue = true;
        }
      }

      if (isDue) {
        // CRITICAL CHECK: Prevent duplicates
        // Has an order already been generated for this customer *for today's delivery date*?
        const existingOrder = await Order.findOne({
          customerId: customer._id,
          deliveryDate: { $gte: today, $lt: tomorrow }
        });

        if (existingOrder) {
          // Skip, order already generated
          continue;
        }

        // Generate Order
        const newOrder = new Order({
          supplierId: customer.supplierId,
          customerId: customer._id,
          deliveryBoyId: customer.deliveryBoyId || null,
          productType: fallbackProductType,
          quantity: customer.bottlesPerDelivery || 1,
          deliveryDate: today,
          timeSlot: customer.preferredDeliveryTime !== 'any' ? customer.preferredDeliveryTime : 'morning',
          deliveryAddress: customer.address || 'Address not provided',
          deliveryType: 'standard',
          deliveryFee: customer.deliveryCharges || 0,
          status: customer.deliveryBoyId ? 'assigned' : 'pending',
          paymentMethod: 'Billed_Later',
          totalAmount: ((customer.bottlesPerDelivery || 1) * (customer.bottlePrice || 0)) + (customer.deliveryCharges || 0),
          notes: 'Auto-generated delivery based on schedule'
        });

        await newOrder.save();
        generatedCount++;

        // Update Customer's lastDeliveryDate
        customer.lastDeliveryDate = today;
        await customer.save();

        // Emit real-time event to supplier dashboard
        if (io) {
          io.to(supplier._id.toString()).emit('orderCreated', newOrder);
        }
      }
    }

    return { success: true, count: generatedCount, message: `Successfully generated ${generatedCount} deliveries.` };

  } catch (error) {
    console.error(`[DeliveryService] Error generating deliveries for supplier ${supplierId}:`, error);
    return { success: false, count: 0, message: 'Internal Server Error during delivery generation' };
  }
}

module.exports = {
  generateDeliveriesForSupplier
};
