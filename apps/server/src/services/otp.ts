import twilio from "twilio";
import { env } from "../config/env";

const demoOtpStore = new Map<string, { code: string; expiresAt: number }>();

function hasTwilioConfig() {
  return Boolean(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_VERIFY_SID);
}

export async function sendOtp(phone: string) {
  if (!hasTwilioConfig()) {
    const code = "123456";
    demoOtpStore.set(phone, { code, expiresAt: Date.now() + 5 * 60 * 1000 });
    return { mode: "demo", code };
  }

  const client = twilio(env.TWILIO_ACCOUNT_SID!, env.TWILIO_AUTH_TOKEN!);
  await client.verify.v2.services(env.TWILIO_VERIFY_SID!).verifications.create({
    to: phone,
    channel: "sms"
  });

  return { mode: "twilio" };
}

export async function verifyOtp(phone: string, code: string) {
  if (!hasTwilioConfig()) {
    const entry = demoOtpStore.get(phone);
    return Boolean(entry && entry.code === code && entry.expiresAt > Date.now());
  }

  const client = twilio(env.TWILIO_ACCOUNT_SID!, env.TWILIO_AUTH_TOKEN!);
  const result = await client.verify.v2.services(env.TWILIO_VERIFY_SID!).verificationChecks.create({
    to: phone,
    code
  });

  return result.status === "approved";
}
