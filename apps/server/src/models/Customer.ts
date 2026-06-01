import mongoose, { Schema, type InferSchemaType } from "mongoose";

const customerSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    name: { type: String, required: true, trim: true },
    phone: {
      type: String,
      required: true,
      validate: {
        validator: (value: string) => /^\+92[0-9]{10}$/.test(value),
        message: "Phone must be in E.164 format: +92XXXXXXXXXX"
      }
    },
    address: { type: String, required: true, trim: true },
    monthlyBottles: { type: Number, default: 2, min: 0 },
    bottlePrice: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ["active", "paused", "blocked"], default: "active" }
  },
  { timestamps: true }
);

customerSchema.index({ tenantId: 1, phone: 1 }, { unique: true });

export type CustomerDocument = InferSchemaType<typeof customerSchema>;

export const Customer = mongoose.model("Customer", customerSchema);
