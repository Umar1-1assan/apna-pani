import mongoose, { Schema, type InferSchemaType } from "mongoose";

const tenantSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    plan: { type: String, default: "starter" },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export type TenantDocument = InferSchemaType<typeof tenantSchema>;

export const Tenant = mongoose.model("Tenant", tenantSchema);
