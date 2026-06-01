import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { authenticate } from "../middleware/auth";
import { Customer } from "../models/Customer";
import { normalizePhone } from "../utils/phone";

export const customersRouter = Router();

customersRouter.use(authenticate);

customersRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const tenantId = req.user?.tenantId;
    const customers = await Customer.find({ tenantId }).sort({ createdAt: -1 }).limit(50);
    res.json({ customers });
  })
);

customersRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const tenantId = req.user?.tenantId;
    const customer = await Customer.create({
      tenantId,
      name: String(req.body.name ?? ""),
      phone: normalizePhone(String(req.body.phone ?? "")),
      address: String(req.body.address ?? ""),
      monthlyBottles: Number(req.body.monthlyBottles ?? 2),
      bottlePrice: Number(req.body.bottlePrice ?? 0),
      status: req.body.status ?? "active"
    });

    res.status(201).json({ customer });
  })
);
