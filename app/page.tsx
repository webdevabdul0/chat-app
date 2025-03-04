"use client";

import { useAuth } from "@/app/provider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push("/home"); // Redirect logged-in users to home
      } else {
        router.push("/auth/login"); // Redirect guests to login
      }
    }
  }, [user, loading, router]);

  return (
    <div className="flex flex-col justify-center items-center h-screen">
      <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
      <p className="mt-4 text-lg font-semibold text-gray-700">Loading ...</p>
    </div>
  );
}
