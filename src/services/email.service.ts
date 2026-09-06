import nodemailer from "nodemailer";
import { env } from "../config/env";

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: false,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

export const sendPasswordResetEmail = async (
  email: string,
  resetUrl: string,
) => {
  await transporter.sendMail({
    from: env.MAIL_FROM,
    to: email,
    subject: "Reset your Smartprix password",
    text: `You requested a password reset.

Reset your password here:
${resetUrl}

This link will expire in 15 minutes.

If you did not request this password reset, you can safely ignore this email.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2>Reset your Smartprix password</h2>

        <p>
          You requested a password reset for your Smartprix account.
        </p>

        <p>
          Click the button below to create a new password.
        </p>

        <p style="margin: 30px 0;">
          <a
            href="${resetUrl}"
            style="
              display: inline-block;
              padding: 12px 22px;
              background: #000;
              color: #fff;
              text-decoration: none;
              border-radius: 6px;
            "
          >
            Reset Password
          </a>
        </p>

        <p>
          This link will expire in <strong>15 minutes</strong>.
        </p>

        <p style="color: #666; font-size: 14px;">
          If you did not request this password reset, you can safely ignore
          this email.
        </p>
      </div>
    `,
  });
};