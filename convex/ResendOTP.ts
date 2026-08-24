import Resend from "@auth/core/providers/resend";
import { RandomReader, generateRandomString } from "@oslojs/crypto/random";
import { Resend as ResendClient } from "resend";

export const ResendOTP = Resend({
  id: "resend-otp",
  apiKey: process.env.AUTH_RESEND_KEY,
  async generateVerificationToken() {
    const reader: RandomReader = { read: (bytes) => crypto.getRandomValues(bytes) };
    return generateRandomString(reader, "0123456789", 8);
  },
  async sendVerificationRequest({ identifier, provider, token }) {
    const from = process.env.AUTH_EMAIL_FROM;
    if (!from) throw new Error("AUTH_EMAIL_FROM is required");
    const client = new ResendClient(provider.apiKey);
    const result = await client.emails.send({
      from,
      to: [identifier],
      subject: "Your Wawi Learns code",
      text: `Your Wawi Learns code is ${token}`,
    });
    if (result.error) throw new Error("Could not send verification email");
  },
});
