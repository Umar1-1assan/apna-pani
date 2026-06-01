import { Router } from "express";
import jwt from "jsonwebtoken";
import { asyncHandler } from "../lib/asyncHandler";
import { env } from "../config/env";
import { User } from "../models/User";
import { Tenant } from "../models/Tenant";
import { normalizePhone } from "../utils/phone";
import { authenticate } from "../middleware/auth";
import { sendOtp, verifyOtp } from "../services/otp";

export const authRouter = Router();

function createTokens(user: { _id: { toString(): string }; role: string; tenantId?: { toString(): string } }) {
  const accessToken = jwt.sign(
    { tenantId: user.tenantId?.toString(), role: user.role },
    env.JWT_SECRET,
    { subject: user._id.toString(), expiresIn: "15m" }
  );

  const refreshToken = jwt.sign(
    { tenantId: user.tenantId?.toString(), role: user.role },
    env.JWT_REFRESH_SECRET,
    { subject: user._id.toString(), expiresIn: "30d" }
  );

  return { accessToken, refreshToken };
}

authRouter.post(
  "/send-otp",
  asyncHandler(async (req, res) => {
    const phone = normalizePhone(String(req.body.phone ?? ""));
    const result = await sendOtp(phone);
    res.json({ message: "OTP sent", ...result });
  })
);

authRouter.post(
  "/verify-otp",
  asyncHandler(async (req, res) => {
    const phone = normalizePhone(String(req.body.phone ?? ""));
    const code = String(req.body.code ?? "");
    const approved = await verifyOtp(phone, code);

    if (!approved) {
      res.status(400).json({ message: "Invalid OTP" });
      return;
    }

    const user = await User.findOne({ phone });
    if (!user) {
      res.status(404).json({ message: "User not found. Use demo login to bootstrap a tenant." });
      return;
    }

    const tokens = createTokens(user);
    res.json({
      ...tokens,
      user: {
        id: user._id,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
        tenantId: user.tenantId
      }
    });
  })
);

authRouter.post(
  "/demo-login",
  asyncHandler(async (req, res) => {
    const phone = normalizePhone(String(req.body.phone ?? ""));
    const fullName = String(req.body.fullName ?? "Demo User");
    const role = String(req.body.role ?? "tenant_admin") as "super_admin" | "tenant_admin" | "staff";
    const tenantName = String(req.body.tenantName ?? "AquaFlow Demo");

    let tenant = await Tenant.findOne({ name: tenantName });
    if (!tenant) {
      tenant = await Tenant.create({ name: tenantName, slug: tenantName.toLowerCase().replace(/[^a-z0-9]+/g, "-") });
    }

    let user = await User.findOne({ phone });
    if (!user) {
      user = await User.create({ tenantId: tenant._id, role, fullName, phone });
    }

    const tokens = createTokens(user);

    res.json({
      ...tokens,
      user: {
        id: user._id,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
        tenantId: user.tenantId
      },
      tenant: {
        id: tenant._id,
        name: tenant.name,
        slug: tenant.slug,
        plan: tenant.plan
      }
    });
  })
);

authRouter.get(
  "/me",
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user?.userId).select("fullName phone role tenantId avatarUrl");
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.json({ user });
  })
);
