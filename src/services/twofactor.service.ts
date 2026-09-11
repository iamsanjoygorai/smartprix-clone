const TWOFACTOR_BASE_URL = "https://2factor.in/API/V1";

function getApiKey(): string {
  const apiKey = process.env.TWOFACTOR_API_KEY;

  if (!apiKey) {
    throw new Error(
      "TWOFACTOR_API_KEY is not configured",
    );
  }

  return apiKey;
}

/**
 * Send a 6-digit OTP using 2Factor AUTOGEN.
 *
 * 2Factor generates the OTP and sends it to the
 * user's mobile number.
 *
 * Returns the OTP Session ID from `Details`.
 */
export const sendTwoFactorOtp = async (
  mobile: string,
) => {
  const apiKey = getApiKey();

  const phone = mobile.replace(/\D/g, "");

  if (phone.length !== 10) {
    throw new Error(
      "Invalid mobile number",
    );
  }

  const url =
    `${TWOFACTOR_BASE_URL}/` +
    `${encodeURIComponent(apiKey)}/` +
    `SMS/+91${phone}/AUTOGEN/OTP1`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    console.error(
      "2Factor HTTP error:",
      response.status,
    );

    throw new Error(
      "Unable to send verification SMS",
    );
  }

  const data = await response.json();

  console.log("2Factor SEND OTP response:", {
    Status: data?.Status,
    Details: data?.Details ? "[RECEIVED]" : "[MISSING]",
  });

  if (
    data?.Status !== "Success" ||
    typeof data?.Details !== "string" ||
    !data.Details
  ) {
    throw new Error(
      "Unable to send verification SMS",
    );
  }

  return {
    sessionId: data.Details,
  };
};

/**
 * Verify a user-entered OTP using the
 * 2Factor OTP Session ID.
 */
export const verifyTwoFactorOtp = async (
  sessionId: string,
  otp: string,
) => {
  const apiKey = getApiKey();

  const cleanSessionId =
    sessionId.trim();

  const cleanOtp =
    otp.trim();

  if (!cleanSessionId) {
    throw new Error(
      "OTP session is missing",
    );
  }

  if (!/^\d{6}$/.test(cleanOtp)) {
    throw new Error(
      "The verification code is invalid.",
    );
  }

  const url =
    `${TWOFACTOR_BASE_URL}/` +
    `${encodeURIComponent(apiKey)}/` +
    `SMS/VERIFY/` +
    `${encodeURIComponent(cleanSessionId)}/` +
    `${encodeURIComponent(cleanOtp)}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    console.error(
      "2Factor VERIFY HTTP error:",
      response.status,
    );

    throw new Error(
      "The verification code is invalid.",
    );
  }

  const data = await response.json();

  console.log(
    "2Factor VERIFY response:",
    {
      Status: data?.Status,
      Details: data?.Details,
    },
  );

  if (data?.Status !== "Success") {
    throw new Error(
      "The verification code is invalid.",
    );
  }

  return {
    verified: true,
  };
};