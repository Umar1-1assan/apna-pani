const express = require('express');
const router = express.Router();
const { requireRole, asyncHandler } = require('../middleware/auth.middleware');
const { ok } = require('../utils/apiResponse');
const { registerRiderHandler, registerCustomerHandler } = require('../controllers/users');
const Supplier = require('../models/Supplier');
const DeliveryBoy = require('../models/DeliveryBoy');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const { generateDeliveriesForSupplier } = require('../services/delivery.service');

/**
 * Protected Supplier Routes
 */

// GET /api/suppliers/me
router.get('/me', 
  requireRole('supplier'),
  asyncHandler(async (req, res) => {
    const supplier = await Supplier.findOne({ userId: req.user._id }).populate('userId', 'fullName email phone');
    return ok(res, supplier, 'Supplier profile retrieved');
  })
);

// PUT /api/suppliers/me
router.put('/me',
  requireRole('supplier'),
  asyncHandler(async (req, res) => {
    const { businessName, supportEmail, supportPhone, timezone, isWhatsAppEnabled, pricing, operatingDays } = req.body;
    const supplier = await Supplier.findOne({ userId: req.user._id });
    if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });

    if (businessName) supplier.businessName = businessName;
    if (supportEmail) supplier.supportEmail = supportEmail;
    if (supportPhone) supplier.supportPhone = supportPhone;
    if (timezone) supplier.timezone = timezone;
    if (isWhatsAppEnabled !== undefined) supplier.isWhatsAppEnabled = isWhatsAppEnabled;
    if (operatingDays !== undefined) supplier.operatingDays = operatingDays;
    
    // Check if we need to update pricing array element 0
    if (pricing !== undefined && pricing !== null) {
      // Create pricing array if it doesn't exist
      if (!supplier.pricing) {
        supplier.pricing = [{ label: '19L Bottle Refill', defaultPrice: pricing, active: true }];
      } else if (supplier.pricing.length > 0) {
        supplier.pricing[0].defaultPrice = pricing;
      } else {
        supplier.pricing.push({ label: '19L Bottle Refill', defaultPrice: pricing, active: true });
      }
    }
    
    await supplier.save();
    return ok(res, supplier, 'Supplier profile updated');
  })
);

// GET /api/suppliers/billing-overview
router.get('/billing-overview',
  requireRole('supplier'),
  asyncHandler(async (req, res) => {
    const Order = require('../models/Order');
    
    // 1. Fetch all active customers for this supplier
    const customers = await Customer.find({ supplierId: req.supplierId })
      .populate('userId', 'fullName phone email');
      
    // 2. Fetch unbilled orders for these customers
    const unbilledOrders = await Order.find({
      supplierId: req.supplierId,
      $or: [
        { isBilled: false },
        { isBilled: { $exists: false } }
      ],
      status: { $in: ['completed', 'delivered'] }
    });
    
    // 3. Map orders to customers
    const unbilledByCustomer = unbilledOrders.reduce((acc, order) => {
      const custId = order.customerId.toString();
      if (!acc[custId]) {
        acc[custId] = { totalBottles: 0, totalAmount: 0 };
      }
      acc[custId].totalBottles += order.quantity;
      acc[custId].totalAmount += order.totalAmount;
      return acc;
    }, {});
    
    const billingData = customers.map(c => {
      const custId = c._id.toString();
      
      const today = new Date();
      today.setHours(0,0,0,0);
      const referenceDate = c.lastInvoiceDate || c.createdAt;
      const cycleLength = {
        'weekly': 7,
        'fortnightly': 14,
        'monthly': 30
      }[c.billingCycle || 'monthly'] || 30;
      
      const nextInvoiceDate = new Date(referenceDate);
      nextInvoiceDate.setDate(nextInvoiceDate.getDate() + cycleLength);

      return {
        _id: c._id,
        customerName: c.userId?.fullName || 'Walk-in Customer',
        phone: c.userId?.phone || c.phoneNumber,
        billingCycle: c.billingCycle || 'monthly',
        bottlePrice: c.bottlePrice || 0,
        unbilledBottles: unbilledByCustomer[custId]?.totalBottles || 0,
        unbilledAmount: unbilledByCustomer[custId]?.totalAmount || 0,
        lastInvoiceDate: c.lastInvoiceDate,
        nextInvoiceDate: nextInvoiceDate
      };
    });
    
    return ok(res, billingData, 'Billing overview retrieved');
  })
);

// GET /api/suppliers/customers
router.get('/customers',
  requireRole('supplier'),
  asyncHandler(async (req, res) => {
    const supplier = await Supplier.findOne({ userId: req.user._id });
    const SubscriptionPlan = require('../models/SubscriptionPlan');
    const plan = await SubscriptionPlan.findOne({ name: supplier.plan || 'basic' });
    const limit = plan ? plan.maxCustomers : 20;

    const customers = await Customer.find({ supplierId: req.supplierId })
      .populate('userId', 'fullName phone email isActive username passwordText')
      .sort({ createdAt: 1 }) // oldest first
      .limit(limit);
    return ok(res, customers, 'List of customers');
  })
);

// POST /api/suppliers/customers
router.post('/customers',
  requireRole('supplier'),
  registerCustomerHandler
);

// PUT /api/suppliers/customers/:id
router.put('/customers/:id',
  requireRole('supplier'),
  asyncHandler(async (req, res) => {
    const { fullName, phone, email, address, bottlesPerDelivery, deliveryFrequency, bottlePrice, deliveryBoyId, status, password, deliveryCharges, preferredDeliveryTime, billingCycle } = req.body;
    
    const customer = await Customer.findOne({ _id: req.params.id, supplierId: req.supplierId });
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

    if (address) customer.address = address;
    if (bottlesPerDelivery !== undefined) customer.bottlesPerDelivery = bottlesPerDelivery;
    if (deliveryFrequency !== undefined) customer.deliveryFrequency = deliveryFrequency;
    if (bottlePrice !== undefined) customer.bottlePrice = bottlePrice;
    if (deliveryBoyId !== undefined) customer.deliveryBoyId = deliveryBoyId || null;
    if (status) customer.status = status;
    if (phone) customer.phoneNumber = phone;
    if (deliveryCharges !== undefined) customer.deliveryCharges = deliveryCharges;
    if (preferredDeliveryTime) customer.preferredDeliveryTime = preferredDeliveryTime;
    if (billingCycle) customer.billingCycle = billingCycle;
    await customer.save();

    const User = require('../models/User');
    if (customer.userId && (fullName || phone || email || password)) {
      const user = await User.findById(customer.userId);
      if (user) {
        if (fullName) user.fullName = fullName;
        if (phone) user.phone = phone;
        if (email) user.email = email;
        if (password) {
          user.password = password;
          user.passwordText = password;
        }
        await user.save();
      }
    }

    return ok(res, customer, 'Customer updated successfully');
  })
);

// DELETE /api/suppliers/customers/:id
router.delete('/customers/:id',
  requireRole('supplier'),
  asyncHandler(async (req, res) => {
    const customer = await Customer.findOne({ _id: req.params.id, supplierId: req.supplierId });
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    
    const User = require('../models/User');
    if (customer.userId) {
      await User.findByIdAndDelete(customer.userId);
    }
    await Customer.findByIdAndDelete(req.params.id);

    return ok(res, null, 'Customer deleted successfully');
  })
);

// GET /api/suppliers/riders
router.get('/riders',
  requireRole('supplier'),
  asyncHandler(async (req, res) => {
    const supplier = await Supplier.findOne({ userId: req.user._id });
    const SubscriptionPlan = require('../models/SubscriptionPlan');
    const plan = await SubscriptionPlan.findOne({ name: supplier.plan || 'basic' });
    const limit = plan ? plan.maxRiders : 3;

    const riders = await DeliveryBoy.find({ supplierId: req.supplierId })
      .populate('userId', 'fullName phone email isActive username passwordText')
      .sort({ createdAt: 1 }) // oldest first
      .limit(limit);
    return ok(res, riders, 'List of riders');
  })
);

// POST /api/suppliers/riders
router.post('/riders',
  requireRole('supplier'),
  registerRiderHandler
);

// PUT /api/suppliers/riders/:id
router.put('/riders/:id',
  requireRole('supplier'),
  asyncHandler(async (req, res) => {
    const { fullName, phone, password, areaName, shiftTiming, assignedVehicle, licenseNumber, isActive } = req.body;
    
    const DeliveryBoy = require('../models/DeliveryBoy');
    const rider = await DeliveryBoy.findOne({ _id: req.params.id, supplierId: req.supplierId });
    if (!rider) return res.status(404).json({ success: false, message: 'Rider not found' });

    if (areaName) rider.areaName = areaName;
    if (shiftTiming) rider.shiftTiming = shiftTiming;
    if (assignedVehicle !== undefined) rider.assignedVehicle = assignedVehicle;
    if (licenseNumber !== undefined) rider.licenseNumber = licenseNumber;
    if (isActive !== undefined) rider.isActive = isActive;
    await rider.save();

    const User = require('../models/User');
    if (rider.userId && (fullName || phone || password)) {
      const user = await User.findById(rider.userId);
      if (user) {
        if (fullName) user.fullName = fullName;
        if (phone) user.phone = phone;
        if (isActive !== undefined) user.isActive = isActive;
        if (phone) user.phone = phone;
        if (password) {
          user.password = password;
          user.passwordText = password;
        }
        await user.save();
      }
    }

    return ok(res, rider, 'Rider updated successfully');
  })
);

// DELETE /api/suppliers/riders/:id
router.delete('/riders/:id',
  requireRole('supplier'),
  asyncHandler(async (req, res) => {
    const DeliveryBoy = require('../models/DeliveryBoy');
    const Customer = require('../models/Customer');
    const User = require('../models/User');

    const rider = await DeliveryBoy.findOne({ _id: req.params.id, supplierId: req.supplierId });
    if (!rider) return res.status(404).json({ success: false, message: 'Rider not found' });

    // Unassign customers assigned to this rider
    await Customer.updateMany(
      { supplierId: req.supplierId, deliveryBoyId: rider._id },
      { $set: { deliveryBoyId: null } }
    );

    // Delete user
    if (rider.userId) {
      await User.findByIdAndDelete(rider.userId);
    }

    // Delete rider
    await DeliveryBoy.findByIdAndDelete(rider._id);

    return ok(res, null, 'Rider deleted and assigned customers marked as unassigned');
  })
);

// PUT /api/suppliers/inventory
router.put('/inventory',
  requireRole('supplier'),
  asyncHandler(async (req, res) => {
    const { availableStock } = req.body;
    if (availableStock === undefined) return res.status(400).json({ success: false, message: 'availableStock is required' });

    const supplier = await Supplier.findOneAndUpdate(
      { _id: req.supplierId },
      { availableStock },
      { new: true }
    );
    if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });

    return ok(res, supplier, 'Inventory updated successfully');
  })
);

// POST /api/suppliers/broadcast-delay
router.post('/broadcast-delay',
  requireRole('supplier'),
  asyncHandler(async (req, res) => {
    const { message } = req.body;
    const Order = require('../models/Order');

    // Find all pending orders for this supplier
    const pendingOrders = await Order.find({ supplierId: req.supplierId, status: 'pending' }).populate('customerId');
    
    // Broadcast message via WebSockets
    const io = req.app.get('io');
    if (io) {
      pendingOrders.forEach(order => {
        if (order.customerId && order.customerId.userId) {
          io.to(order.customerId.userId.toString()).emit('delayedDelivery', {
            orderId: order._id,
            message: message || 'Your delivery has been delayed due to stock shortage.'
          });
        }
      });
    }

    return ok(res, { count: pendingOrders.length }, 'Delay broadcasted to affected customers');
  })
);

// POST /api/suppliers/deliveries/generate-today
router.post('/deliveries/generate-today',
  requireRole('supplier'),
  asyncHandler(async (req, res) => {
    const io = req.app.get('io');
    const result = await generateDeliveriesForSupplier(req.supplierId, io);
    
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }
    
    return ok(res, { generatedCount: result.count }, result.message);
  })
);

/**
 * Product Management Routes
 */

// GET /api/suppliers/products
router.get('/products',
  requireRole('supplier'),
  asyncHandler(async (req, res) => {
    let products = await Product.find({ supplierId: req.supplierId })
      .sort({ createdAt: -1 });

    return ok(res, products, 'List of products');
  })
);

// POST /api/suppliers/products
router.post('/products',
  requireRole('supplier'),
  asyncHandler(async (req, res) => {
    const { name, description, price, isAvailable } = req.body;
    if (!name || price === undefined) {
      return res.status(400).json({ success: false, message: 'Name and price are required' });
    }

    const product = new Product({
      supplierId: req.supplierId,
      name,
      description,
      price,
      isAvailable: isAvailable !== undefined ? isAvailable : true
    });

    await product.save();
    return ok(res, product, 'Product created successfully');
  })
);

// PUT /api/suppliers/products/:id
router.put('/products/:id',
  requireRole('supplier'),
  asyncHandler(async (req, res) => {
    const { name, description, price, isAvailable } = req.body;

    const product = await Product.findOne({ _id: req.params.id, supplierId: req.supplierId });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    if (name) product.name = name;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = price;
    if (isAvailable !== undefined) product.isAvailable = isAvailable;

    await product.save();
    return ok(res, product, 'Product updated successfully');
  })
);

// DELETE /api/suppliers/products/:id
router.delete('/products/:id',
  requireRole('supplier'),
  asyncHandler(async (req, res) => {
    const product = await Product.findOneAndDelete({ _id: req.params.id, supplierId: req.supplierId });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    return ok(res, null, 'Product deleted successfully');
  })
);

// PATCH /api/suppliers/products/:id/toggle
router.patch('/products/:id/toggle',
  requireRole('supplier'),
  asyncHandler(async (req, res) => {
    const product = await Product.findOne({ _id: req.params.id, supplierId: req.supplierId });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    product.isAvailable = !product.isAvailable;
    await product.save();

    return ok(res, product, `Product is now ${product.isAvailable ? 'available' : 'unavailable'}`);
  })
);

// PUT /api/suppliers/riders/:id/receive-cash
router.put('/riders/:id/receive-cash',
  requireRole('supplier'),
  asyncHandler(async (req, res) => {
    const deliveryBoy = await DeliveryBoy.findOne({ _id: req.params.id, supplierId: req.supplierId });
    
    if (!deliveryBoy) {
      return res.status(404).json({ success: false, message: 'Rider not found' });
    }

    if (!deliveryBoy.cashInHand || deliveryBoy.cashInHand <= 0) {
      return res.status(400).json({ success: false, message: 'Rider has no cash in hand to remit' });
    }

    const remittedAmount = deliveryBoy.cashInHand;
    deliveryBoy.totalCashRemitted = (deliveryBoy.totalCashRemitted || 0) + remittedAmount;
    deliveryBoy.cashInHand = 0;
    
    await deliveryBoy.save();

    return ok(res, deliveryBoy, `Successfully received ₨ ${remittedAmount} from rider.`);
  })
);

module.exports = router;
