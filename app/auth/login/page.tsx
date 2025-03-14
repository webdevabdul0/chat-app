"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/provider";
import { login, loginWithPhone, verifyOTPForLogin } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import auth from "@/public/auth.png";

export default function LoginPage() {
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      const lastRoute = localStorage.getItem("lastRoute") || "/home";
      router.push(lastRoute);
      localStorage.removeItem("lastRoute");
    }
  }, [user, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const isEmail = /\S+@\S+\.\S+/.test(form.identifier);
    let res;

    if (isEmail) {
      res = await login(form.identifier, form.password);
    } else {
      res = await loginWithPhone(form.identifier);
      if (res.success) {
        setConfirmationResult(res.confirmationResult);
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
    const res = await verifyOTPForLogin(confirmationResult, otp);
    setLoading(false);

    if (!res.success) {
      setError(res.error);
      return;
    }

    router.push("/home");
  };

  return (
    <div className="w-full h-screen flex justify-center items-center">
      <div className="max-w-7xl flex flex-row items-center justify-between p-4 h-full">
        <div className="w-1/2 h-full hidden lg:flex">
          <Image
            src={auth}
            alt="auth-Img"
            className="object-cover object-left h-full rounded-2xl"
          />
        </div>

        <div className="w-full lg:w-1/2 flex flex-col items-center justify-center">
          <Image src="/logo.png" alt="logo" width={100} height={100} />

          <Card className="mx-10 w-full max-w-md shadow-lg rounded-3xl p-6 mt-4">
            <CardHeader>
              <CardTitle className="text-start text-4xl text-primary font-bold">
                Welcome Back
              </CardTitle>
            </CardHeader>
            <CardContent>
              {error && (
                <p className="text-red-500 text-sm mb-4 text-center">{error}</p>
              )}
              <form onSubmit={handleSubmit} className="space-y-6">
                {!confirmationResult && (
                  <div>
                    <Label htmlFor="identifier">Email or Phone</Label>
                    <Input
                      id="identifier"
                      type="text"
                      name="identifier"
                      placeholder="Enter Email or Phone"
                      value={form.identifier}
                      onChange={handleChange}
                      required
                    />
                  </div>
                )}

                {/\S+@\S+\.\S+/.test(form.identifier) ? (
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      name="password"
                      placeholder="Enter Password"
                      value={form.password}
                      onChange={handleChange}
                      required
                    />
                  </div>
                ) : confirmationResult ? (
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
                ) : null}

                <div className="flex flex-row justify-between items-center">
                  {!confirmationResult ? (
                    <Button
                      type="submit"
                      className="px-6 py-6 rounded-2xl text-base"
                      disabled={loading}
                    >
                      {loading ? "Logging in..." : "Log In"}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      className="px-6 py-6 rounded-2xl text-base"
                      onClick={handleVerifyOtp}
                      disabled={loading}
                    >
                      {loading ? "Verifying OTP..." : "Verify OTP"}
                    </Button>
                  )}

                  <p className="text-sm mt-4 text-start font-semibold">
                    <Link href="/" className="text-black/40">
                      Forgot Password?
                    </Link>
                  </p>
                </div>
              </form>

              <p className="text-sm mt-4 text-start font-semibold">
                Don’t have an account?{" "}
                <Link href="/auth/signup" className="text-primary">
                  Sign Up
                </Link>
              </p>

              <div className="text-center mt-4 text-sm">or</div>

              <h3 className="w-full text-start font-semibold text-black text-xl mt-4">
                Log In with
              </h3>
              <Button
                variant="outline"
                className="px-6 py-6 rounded-2xl text-base mt-4"
              >
                Log In with Google
              </Button>

              <p className="text-sm mt-4 text-start font-semibold text-black/40">
                © 2024 ihere. All rights reserved.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
      <div id="recaptcha-container"></div>
    </div>
  );
}
