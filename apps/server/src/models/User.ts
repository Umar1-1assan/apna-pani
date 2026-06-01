import mongoose, { Schema, type InferSchemaType } from "mongoose";

export const userRoles = ["super_admin", "tenant_admin", "staff"] as const;
export type UserRole = (typeof userRoles)[number];

const userSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant" },
    role: { type: String, enum: userRoles, required: true, default: "tenant_admin" },
    fullName: { type: String, required: true, trim: true },
    phone: {
      type: String,
      required: true,
      unique: true,
      validate: {
        validator: (value: string) => /^\+92[0-9]{10}$/.test(value),
        message: "Phone must be in E.164 format: +92XXXXXXXXXX"
      }
    },
    email: { type: String, lowercase: true, trim: true },
    passwordHash: { type: String, select: false },
    avatarUrl: { type: String }
  },
  { timestamps: true }
);

export type UserDocument = InferSchemaType<typeof userSchema>;

export const User = mongoose.model("User", userSchema);
