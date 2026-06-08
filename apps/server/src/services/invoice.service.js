const mongoose = require('mongoose');
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');
const Order = require('../models/Order');
const Invoice = require('../models/Invoice');

/**
 * Generate automated invoices based on customer billing cycles.
 * 
 * @param {Object} io - Socket.io instance for real-time events (optional)
 * @returns {Object} result - { success: boolean, count: number, message: string }
 */
async function generateBillingCycleInvoices(io = null) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fetch all active customers
    const customers = await Customer.find({ status: { $in: ['active', 'paused'] } });
    let generatedCount = 0;

    for (const customer of customers) {
      try {
        let isDue = false;

        const cycleLength = {
          'weekly': 7,
          'fortnightly': 14,
          'monthly': 30
        }[customer.billingCycle] || 30;

        const referenceDate = customer.lastInvoiceDate || customer.createdAt;
        const refDate = new Date(referenceDate);
        refDate.setHours(0, 0, 0, 0);
        
        const diffTime = Math.abs(today - refDate);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays >= cycleLength) {
          isDue = true;
        }

        if (isDue) {
          // Precise period calculation bounded by the cycle
          const periodStart = new Date(refDate);
          const periodEnd = new Date(refDate);
          periodEnd.setDate(periodEnd.getDate() + cycleLength);
          
          // Calculate due date (7 days from generation)
          const dueDate = new Date(today);
          dueDate.setDate(dueDate.getDate() + 7);

          const session = await mongoose.startSession();
          await session.withTransaction(async () => {
            // Find all unbilled completed orders, including legacy orders
            const unbilledOrders = await Order.find({
              customerId: customer._id,
              $or: [{ isBilled: false }, { isBilled: { $exists: false } }],
              status: { $in: ['completed', 'delivered'] }
            }).session(session);

            if (unbilledOrders.length > 0) {
              let totalBottles = 0;
              let totalAmount = 0;
              const orderIds = [];

              for (const order of unbilledOrders) {
                totalBottles += order.quantity;
                totalAmount += order.totalAmount;
                orderIds.push(order._id);
              }

              // Generate Invoice
              const newInvoice = new Invoice({
                supplierId: customer.supplierId,
                customerId: customer._id,
                orderIds: orderIds,
                billingCycle: customer.billingCycle,
                startDate: periodStart,
                endDate: periodEnd,
                totalAmount: totalAmount,
                totalBottles: totalBottles,
                bottlePrice: customer.bottlePrice || 150,
                previousDues: 0,
                arrearsDetails: [],
                dueDate: dueDate,
                collectionMethod: 'cash',
                collectionRiderId: customer.deliveryBoyId || null,
                paymentStatus: 'unpaid'
              });

              await newInvoice.save({ session });
              generatedCount++;

              // Mark orders as billed
              await Order.updateMany(
                { _id: { $in: orderIds } },
                { $set: { isBilled: true, invoiceId: newInvoice._id } },
                { session }
              );

              // Update Customer's lastInvoiceDate (advance by cycle length perfectly)
              customer.lastInvoiceDate = periodEnd;
              await customer.save({ session });

              // Emit real-time event to supplier dashboard
              if (io) {
                io.to(customer.supplierId.toString()).emit('invoiceCreated', newInvoice);
              }
            } else {
              // No unbilled orders, but cycle passed. Just advance cycle to prevent checking every day.
              customer.lastInvoiceDate = periodEnd;
              await customer.save({ session });
            }
          });
          session.endSession();
        }
      } catch (custError) {
        console.error(`[InvoiceService] Error generating invoice for customer ${customer._id}:`, custError);
        // Loop continues for the next customer automatically
      }
    }

    return { success: true, count: generatedCount, message: `Successfully generated ${generatedCount} invoices.` };

  } catch (error) {
    console.error(`[InvoiceService] Error generating billing cycle invoices:`, error);
    return { success: false, count: 0, message: 'Internal Server Error during invoice generation' };
  }
}

/**
 * Generate an invoice manually for a specific customer, regardless of their cycle.
 * 
 * @param {String} customerId - ID of the customer
 * @param {Object} io - Socket.io instance for real-time events (optional)
 * @returns {Object} result - { success: boolean, invoice: Object, message: string }
 */
async function generateInvoiceForCustomer(customerId, io = null) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return { success: false, message: 'Customer not found' };
    }

    const referenceDate = customer.lastInvoiceDate || customer.createdAt;
    const refDate = new Date(referenceDate);
    refDate.setHours(0, 0, 0, 0);

    const dueDate = new Date(today);
    dueDate.setDate(dueDate.getDate() + 7);

    let newInvoiceResult = null;

    const session = await mongoose.startSession();
    await session.withTransaction(async () => {
      const unbilledOrders = await Order.find({
        customerId: customer._id,
        $or: [{ isBilled: false }, { isBilled: { $exists: false } }],
        status: { $in: ['completed', 'delivered'] }
      }).session(session);

      if (unbilledOrders.length === 0) {
        throw new Error('NO_UNBILLED_ORDERS');
      }

      let totalBottles = 0;
      let totalAmount = 0;
      const orderIds = [];

      for (const order of unbilledOrders) {
        totalBottles += order.quantity;
        totalAmount += order.totalAmount;
        orderIds.push(order._id);
      }

      // Generate Invoice
      const newInvoice = new Invoice({
        supplierId: customer.supplierId,
        customerId: customer._id,
        orderIds: orderIds,
        billingCycle: 'ad-hoc',
        startDate: refDate,
        endDate: today,
        totalAmount: totalAmount,
        totalBottles: totalBottles,
        bottlePrice: customer.bottlePrice || 150,
        previousDues: 0,
        arrearsDetails: [],
        dueDate: dueDate,
        collectionMethod: 'cash',
        collectionRiderId: customer.deliveryBoyId || null,
        paymentStatus: 'unpaid'
      });

      await newInvoice.save({ session });
      newInvoiceResult = newInvoice;

      // Mark orders as billed
      await Order.updateMany(
        { _id: { $in: orderIds } },
        { $set: { isBilled: true, invoiceId: newInvoice._id } },
        { session }
      );

      // Update Customer's lastInvoiceDate
      customer.lastInvoiceDate = today;
      await customer.save({ session });

      // Emit real-time event to supplier dashboard
      if (io) {
        io.to(customer.supplierId.toString()).emit('invoiceCreated', newInvoice);
      }
    });
    session.endSession();

    return { success: true, invoice: newInvoiceResult, message: 'Invoice generated successfully.' };

  } catch (error) {
    if (error.message === 'NO_UNBILLED_ORDERS') {
      return { success: false, message: 'No unbilled deliveries found for this customer.' };
    }
    console.error(`[InvoiceService] Error generating invoice for customer ${customerId}:`, error);
    return { success: false, message: 'Internal Server Error during invoice generation' };
  }
}

module.exports = {
  generateBillingCycleInvoices,
  generateInvoiceForCustomer
};
