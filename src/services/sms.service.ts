/**
 * Smartprix SMS Service
 *
 * Sends password-reset OTPs through MSG91 Flow API.
 *
 * Required environment variables:
 *
 * MSG91_AUTH_KEY=your_msg91_auth_key
 * MSG91_SMS_TEMPLATE_ID=your_msg91_template_id
 *
 * Optional:
 *
 * MSG91_SMS_URL=https://control.msg91.com/api/v5/flow
 */

const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY;

const MSG91_SMS_TEMPLATE_ID =
  process.env.MSG91_SMS_TEMPLATE_ID;

const MSG91_SMS_URL =
  process.env.MSG91_SMS_URL ||
  "https://control.msg91.com/api/v5/flow";

/**
 * Convert an Indian mobile number
 * into international format.
 *
 * 9876543210
 *      ↓
 * 919876543210
 */
function normalizeIndianMobile(mobile: string): string {
  const digits = mobile.replace(/\D/g, "");

  // 10-digit Indian number
  if (digits.length === 10) {
    return `91${digits}`;
  }

  // Already in 91XXXXXXXXXX format
  if (
    digits.length === 12 &&
    digits.startsWith("91")
  ) {
    return digits;
  }

  throw new Error(
    "Invalid Indian mobile number",
  );
}

/**
 * Send password-reset OTP SMS.
 *
 * MSG91 Flow payload:
 *
 * {
 *   template_id: "...",
 *   recipients: [
 *     {
 *       mobiles: "919876543210",
 *       otp: "123456"
 *     }
 *   ]
 * }
 */
export const sendPasswordResetCodeSms = async (
  mobile: string,
  code: string,
) => {
  // --------------------------------------------------
  // Validate environment variables
  // --------------------------------------------------

  if (!MSG91_AUTH_KEY) {
    throw new Error(
      "MSG91_AUTH_KEY is not configured",
    );
  }

  if (!MSG91_SMS_TEMPLATE_ID) {
    throw new Error(
      "MSG91_SMS_TEMPLATE_ID is not configured",
    );
  }

  // --------------------------------------------------
  // Validate OTP
  // --------------------------------------------------

  if (!/^\d{6}$/.test(code)) {
    console.error(
      "Invalid OTP generated:",
      code,
    );

    throw new Error(
      "Invalid verification code",
    );
  }

  // --------------------------------------------------
  // Normalize mobile number
  // --------------------------------------------------

  const internationalMobile =
    normalizeIndianMobile(mobile);

  // --------------------------------------------------
  // Debug information
  // --------------------------------------------------

  console.log(
    "========== MSG91 SMS REQUEST ==========",
  );

  console.log(
    "URL:",
    MSG91_SMS_URL,
  );

  console.log(
    "Mobile:",
    internationalMobile,
  );

  console.log(
    "Template ID:",
    MSG91_SMS_TEMPLATE_ID,
  );

  console.log(
    "OTP:",
    code,
  );

  console.log(
    "OTP length:",
    code.length,
  );

  console.log(
    "========================================",
  );

  // --------------------------------------------------
  // Prepare MSG91 request
  // --------------------------------------------------

  const payload = {
    template_id: MSG91_SMS_TEMPLATE_ID,

    recipients: [
      {
        mobiles: internationalMobile,
        otp: code,
      },
    ],
  };

  // --------------------------------------------------
  // Call MSG91
  // --------------------------------------------------

  let response: Response;

  try {
    response = await fetch(
      MSG91_SMS_URL,
      {
        method: "POST",

        headers: {
          accept: "application/json",
          authkey: MSG91_AUTH_KEY,
          "content-type": "application/json",
        },

        body: JSON.stringify(payload),
      },
    );
  } catch (error) {
    console.error(
      "========== MSG91 NETWORK ERROR ==========",
    );

    console.error(
      error,
    );

    console.error(
      "==========================================",
    );

    throw new Error(
      "Unable to connect to MSG91 SMS service",
    );
  }

  // --------------------------------------------------
  // Read MSG91 response
  // --------------------------------------------------

  const text = await response.text();

  let result: unknown;

  try {
    result = JSON.parse(text);
  } catch {
    result = text;
  }

  // --------------------------------------------------
  // Log complete MSG91 response
  // --------------------------------------------------

  console.log(
    "========== MSG91 RESPONSE ==========",
  );

  console.log(
    "HTTP Status:",
    response.status,
  );

  console.log(
    "Response:",
    result,
  );

  console.log(
    "====================================",
  );

  // --------------------------------------------------
  // HTTP error
  // --------------------------------------------------

  if (!response.ok) {
    throw new Error(
      `MSG91 SMS API failed with status ${response.status}`,
    );
  }

  // --------------------------------------------------
  // MSG91 API-level error
  // --------------------------------------------------

  if (
    typeof result === "object" &&
    result !== null &&
    "type" in result &&
    (result as { type?: string }).type ===
      "error"
  ) {
    throw new Error(
      "MSG91 returned an API error",
    );
  }

  // --------------------------------------------------
  // Success
  // --------------------------------------------------

  console.log(
    "========== MSG91 SMS ACCEPTED ==========",
  );

  console.log(
    "Password reset OTP accepted by MSG91",
  );

  console.log(
    "Mobile:",
    internationalMobile,
  );

  console.log(
    "OTP:",
    code,
  );

  console.log(
    "=========================================",
  );

  return result;
};
