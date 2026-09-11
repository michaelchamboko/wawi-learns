import Resend from "@auth/core/providers/resend";
import type { RandomReader } from "@oslojs/crypto/random";
import { generateRandomString } from "@oslojs/crypto/random";
import { Resend as ResendClient } from "resend";
import { ConvexError } from "convex/values";

export const ResendOTP = Resend({
  id: "resend-otp",
  apiKey: process.env.AUTH_RESEND_KEY,
  maxAge: 15 * 60,
  async generateVerificationToken() {
    const reader: RandomReader = { read: (bytes) => { bytes.set(crypto.getRandomValues(new Uint8Array(bytes.length))); } };
    return generateRandomString(reader, "0123456789", 8);
  },
  async sendVerificationRequest({ identifier, provider, token }) {
    const from = process.env.AUTH_EMAIL_FROM;
    if (!from || !provider.apiKey) throw new ConvexError("RESET_EMAIL_UNAVAILABLE");
    try {
      const client = new ResendClient(provider.apiKey);
      const result = await client.emails.send({
        from,
        to: [identifier],
        subject: "Your Wawi Learns reset code",
        text: `Your Wawi Learns reset code is ${token}. It expires in 15 minutes. Enter it at https://wawi-learns.vercel.app/home after choosing Forgot password. If you did not request this code, you can ignore this email.`,
      });
      if (result.error) throw new ConvexError("RESET_EMAIL_UNAVAILABLE");
    } catch {
      throw new ConvexError("RESET_EMAIL_UNAVAILABLE");
    }
  },
});
