"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/provider";
import { signup } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import auth from "@/public/auth.png";

export default function SignupPage() {
  const [form, setForm] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    location: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    setLoading(true);
    const res = await signup(
      form.fullName,
      form.username,
      form.email,
      form.password,
      form.location
    );
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
            src={auth}
            alt="auth-Img"
            className="object-cover object-left h-full w-full rounded-2xl"
          />
        </div>

        <div className="w-full lg:w-1/2 flex flex-col items-center justify-start">
          <Image src="/logo.png" alt="logo" width={100} height={100} />

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
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    name="email"
                    placeholder="Enter Email"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </div>
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
                <div>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    name="confirmPassword"
                    placeholder="Confirm Password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </div>
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
                <div className="flex flex-row justify-between items-center">
                  <Button
                    type="submit"
                    className="px-6 py-6 rounded-2xl text-base"
                    disabled={loading}
                  >
                    {loading ? "Signing up..." : "Sign Up"}
                  </Button>
                </div>
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
                © 2024 ihere. All rights reserved.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
