"use client";

import { auth, db } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  signInWithPhoneNumber,
  RecaptchaVerifier,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

/**
 * Signup with Email & Password
 */
export const signup = async (
  fullName: string,
  username: string,
  email: string,
  password: string,
  location: string
) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    await updateProfile(user, { displayName: fullName });

    await setDoc(doc(db, "users", user.uid), {
      fullName,
      username,
      email,
      location,
      profilePic: "",
      createdAt: new Date(),
    });

    return { success: true, user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

/**
 * Signup with Phone Number (OTP)
 */
declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
  }
}

export const signupWithPhone = async (phoneNumber: string) => {
  try {
    if (typeof window !== "undefined") {
      const recaptchaContainer = document.getElementById("recaptcha-container");
      if (recaptchaContainer) recaptchaContainer.innerHTML = "";

      if (window.recaptchaVerifier) {
        console.log("Resetting existing reCAPTCHA...");
        window.recaptchaVerifier.clear();
      }

      window.recaptchaVerifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        {
          size: "invisible",
          callback: (response: any) => {
            console.log("reCAPTCHA solved:", response);
          },
        }
      );

      const appVerifier = window.recaptchaVerifier;
      console.log("App Verifier Initialized:", appVerifier);

      console.log("Calling signInWithPhoneNumber...");
      const confirmationResult = await signInWithPhoneNumber(
        auth,
        phoneNumber,
        appVerifier
      );

      console.log("Confirmation Result:", confirmationResult);
      return { success: true, confirmationResult };
    }
  } catch (error: any) {
    console.error("Error in signupWithPhone:", error);
    return { success: false, error: error.message };
  }
};

export const loginWithPhone = async (phoneNumber: string) => {
  try {
    // Ensure Recaptcha is available
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        {
          size: "invisible",
        }
      );
    }

    const confirmationResult = await signInWithPhoneNumber(
      auth,
      phoneNumber,
      window.recaptchaVerifier
    );

    return { success: true, confirmationResult };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const verifyOTPForLogin = async (
  confirmationResult: any,
  otp: string
) => {
  try {
    const userCredential = await confirmationResult.confirm(otp);
    const user = userCredential.user;

    return { success: true, user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

/**
 * Verify OTP after sending it
 */
export const verifyOTP = async (
  confirmationResult: any,
  otp: string,
  userInfo: { fullName: string; username: string; location: string }
) => {
  try {
    const userCredential = await confirmationResult.confirm(otp);
    const user = userCredential.user;

    // Save user info to Firestore
    await setDoc(doc(db, "users", user.uid), {
      fullName: userInfo.fullName,
      username: userInfo.username,
      phoneNumber: user.phoneNumber,
      location: userInfo.location,
      profilePic: "",
      createdAt: new Date(),
    });

    return { success: true, user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

/**
 * Login with Email & Password
 */
export const login = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    return { success: true, user: userCredential.user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

/**
 * Logout
 */
export const logout = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};
