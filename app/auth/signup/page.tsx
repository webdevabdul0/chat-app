"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/provider";
import { signup, signupWithPhone, verifyOTP } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";

export default function SignupPage() {
  const [form, setForm] = useState({
    fullName: "",
    username: "",
    email: "",
    identifier: "", // Can be email or phone
    password: "",
    confirmPassword: "",
    location: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const isEmail = /\S+@\S+\.\S+/.test(form.identifier);
    let res;

    if (isEmail) {
      if (form.password !== form.confirmPassword) {
        setError("Passwords do not match!");
        return;
      }
    }

    setLoading(true);

    if (isEmail) {
      res = await signup(
        form.fullName,
        form.username,
        form.identifier, // Email
        form.password,
        form.location
      );
    } else {
      res = await signupWithPhone(form.identifier); // Phone signup
      if (res.success) {
        console.log("Abdul Hanan");
        setConfirmationResult(res.confirmationResult); // Store confirmation result for OTP verification
      }
    }

    setLoading(false);

    if (!res.success) {
      setError(res.error);
      return;
    }

    if (isEmail) {
      router.push("/home");
    }
  };

  const handleVerifyOtp = async () => {
    if (!confirmationResult || !otp) {
      setError("Please enter the OTP.");
      return;
    }

    setLoading(true);

    // Pass the fullName, username, and location to verifyOTP
    const res = await verifyOTP(confirmationResult, otp, {
      fullName: form.fullName,
      username: form.username,
      location: form.location,
    });

    setLoading(false);

    if (!res.success) {
      setError(res.error);
      return;
    }

    router.push("/home");
  };

  return (
    <div className="w-full h-screen flex justify-center items-center">
      <div className="max-w-7xl flex flex-row items-start justify-between p-4 h-full">
        <div className="w-1/2 h-full hidden lg:flex ">
          <Image
            src="/auth.png"
            alt="auth-Img"
            className="object-cover object-left h-full w-full rounded-2xl"
          />
        </div>

        <div className="w-full lg:w-1/2 flex flex-col items-center justify-start">
          <Image src="/logo.png" alt="logo" width={140} height={140} />

          <Card className="mx-10 w-full max-w-md shadow-lg rounded-3xl p-6 mt-4">
            <CardHeader>
              <CardTitle className="text-start text-4xl text-primary font-bold">
                Create an Account
              </CardTitle>
            </CardHeader>
            <CardContent>
              {error && (
                <p className="text-red-500 text-sm mb-4 text-center">{error}</p>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                {!confirmationResult && (
                  <div className="flex gap-5">
                    <div>
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        type="text"
                        name="fullName"
                        placeholder="Enter Full Name"
                        value={form.fullName}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        type="text"
                        name="username"
                        placeholder="Enter Username"
                        value={form.username}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                )}

                {!confirmationResult && (
                  <div>
                    <Label htmlFor="identifier">Email or Phone</Label>
                    <Input
                      id="identifier"
                      type="text" // Accepts both email and phone
                      name="identifier"
                      placeholder="Enter Email or Phone"
                      value={form.identifier}
                      onChange={handleChange}
                      required
                    />
                  </div>
                )}

                {/\S+@\S+\.\S+/.test(form.identifier) ? (
                  <>
                    <div className="relative">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="Enter Password"
                        value={form.password}
                        onChange={handleChange}
                        required
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-10 text-gray-500"
                      >
                        {showPassword ? (
                          <EyeOff size={20} />
                        ) : (
                          <Eye size={20} />
                        )}
                      </button>
                    </div>

                    <div className="relative mt-4">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        placeholder="Confirm Password"
                        value={form.confirmPassword}
                        onChange={handleChange}
                        required
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-10 text-gray-500"
                      >
                        {showConfirmPassword ? (
                          <EyeOff size={20} />
                        ) : (
                          <Eye size={20} />
                        )}
                      </button>
                    </div>
                  </>
                ) : confirmationResult ? (
                  <>
                    <div>
                      <Label htmlFor="otp">Enter OTP</Label>
                      <Input
                        id="otp"
                        type="text"
                        name="otp"
                        placeholder="Enter OTP"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        required
                      />
                    </div>

                    <Button
                      type="button"
                      className="px-6 py-6 rounded-2xl text-base"
                      onClick={handleVerifyOtp}
                      disabled={loading}
                    >
                      {loading ? "Verifying OTP..." : "Verify OTP"}
                    </Button>
                  </>
                ) : null}
                {!confirmationResult && (
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      type="text"
                      name="location"
                      placeholder="Enter Location"
                      value={form.location}
                      onChange={handleChange}
                      required
                    />
                  </div>
                )}
                {!confirmationResult && (
                  <div className="flex flex-row justify-between items-center">
                    <Button
                      type="submit"
                      className="px-6 py-6 rounded-2xl text-base"
                      disabled={loading}
                    >
                      {loading ? "Signing up..." : "Sign Up"}
                    </Button>
                  </div>
                )}
              </form>
              <p className="text-sm mt-4 text-start font-semibold">
                Already have an account?{" "}
                <Link href="/auth/login" className="text-primary">
                  Log In
                </Link>
              </p>
              <div className="text-center mt-4 text-sm">or</div>
              <h3 className="w-full text-start font-semibold text-black text-xl mt-4">
                Sign Up with
              </h3>
              <Button
                variant="outline"
                className="px-6 py-6 rounded-2xl text-base mt-4"
              >
                Sign Up with Google
              </Button>
              <p className="text-sm mt-4 text-start font-semibold text-black/40">
                © 2024 GoGreek. All rights reserved.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
      <div id="recaptcha-container"></div>
    </div>
  );
}
