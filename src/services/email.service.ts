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

export const sendPasswordResetCodeEmail = async (
  email: string,
  code: string,
) => {
  await transporter.sendMail({
    from: env.MAIL_FROM,
    to: email,
    subject: "Your Smartprix verification code",

    text: `Your Smartprix password recovery verification code is:

${code}

This code will expire in 10 minutes.

If you did not request a password reset, you can safely ignore this email.`,

    html: `
      <div
        style="
          font-family: Arial, Helvetica, sans-serif;
          max-width: 600px;
          margin: 0 auto;
          padding: 32px 20px;
          color: #1c1e21;
        "
      >
        <div
          style="
            text-align: center;
            margin-bottom: 28px;
          "
        >
          <div
            style="
              display: inline-block;
              font-size: 30px;
              font-weight: 800;
              color: #1877f2;
              letter-spacing: -1px;
            "
          >
            Smartprix
          </div>
        </div>

        <div
          style="
            border: 1px solid #e4e6eb;
            border-radius: 14px;
            padding: 30px;
            background: #ffffff;
          "
        >
          <h2
            style="
              margin: 0 0 12px;
              font-size: 24px;
              color: #1c1e21;
            "
          >
            Verify your account
          </h2>

          <p
            style="
              margin: 0 0 24px;
              font-size: 15px;
              line-height: 1.6;
              color: #65676b;
            "
          >
            We received a request to reset your Smartprix password.
            Enter the verification code below to continue.
          </p>

          <div
            style="
              margin: 28px 0;
              text-align: center;
            "
          >
            <div
              style="
                display: inline-block;
                padding: 16px 28px;
                border-radius: 10px;
                background: #f0f6ff;
                color: #1877f2;
                font-size: 32px;
                font-weight: 800;
                letter-spacing: 8px;
              "
            >
              ${code}
            </div>
          </div>

          <p
            style="
              margin: 0 0 8px;
              font-size: 14px;
              color: #65676b;
              text-align: center;
            "
          >
            This code expires in
            <strong>10 minutes</strong>.
          </p>

          <p
            style="
              margin: 24px 0 0;
              padding-top: 20px;
              border-top: 1px solid #e4e6eb;
              font-size: 13px;
              line-height: 1.5;
              color: #8a8d91;
            "
          >
            If you did not request a password reset, you can safely
            ignore this email.
          </p>
        </div>

        <p
          style="
            margin: 22px 0 0;
            text-align: center;
            font-size: 12px;
            color: #8a8d91;
          "
        >
          © ${new Date().getFullYear()} Smartprix
        </p>
      </div>
    `,
  });
};

/**
 * Kept for backward compatibility with the previous
 * password-reset implementation.
 */
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
      <div
        style="
          font-family: Arial, sans-serif;
          max-width: 600px;
          margin: auto;
        "
      >
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
              background: #1877f2;
              color: #fff;
              text-decoration: none;
              border-radius: 6px;
            "
          >
            Reset Password
          </a>
        </p>

        <p>
          This link will expire in
          <strong>15 minutes</strong>.
        </p>

        <p style="color: #666; font-size: 14px;">
          If you did not request this password reset, you can safely
          ignore this email.
        </p>
      </div>
    `,
  });
};