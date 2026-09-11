import type { NextFunction, Request, Response } from "express";
import { firebaseAdminAuth } from "../config/firebaseAdmin";
import { auth } from "./firebase";

export interface FirebaseRequest extends Request {
  firebaseUser?: {
    uid: string;
    email?: string;
    phoneNumber?: string;
  };
}

export async function firebaseAuth(
  req: FirebaseRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Firebase authentication token is required.",
      });
    }

    const token = authHeader.substring(7);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Invalid Firebase authentication token.",
      });
    }

    const decodedToken = await firebaseAdminAuth.verifyIdToken(token);

    req.firebaseUser = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      phoneNumber: decodedToken.phone_number,
    };

    next();
  } catch (error) {
    console.error("Firebase authentication failed:", error);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired Firebase authentication token.",
    });
  }
}


/* =========================================================
   SMARTPRIX BACKEND FIREBASE LOGIN
========================================================= */

export async function loginToSmartprixWithFirebase() {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("No Firebase user is signed in.");
  }

  // Get Firebase ID token
  const idToken = await user.getIdToken();

  // Send Firebase token to Smartprix backend
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api"}/auth/firebase`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        idToken,
      }),
    },
  );

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(
      result.message || "Smartprix Firebase login failed",
    );
  }

  // Save your existing Smartprix JWT
  localStorage.setItem(
    "smartprix_token",
    result.data.token,
  );

  return result.data;
}