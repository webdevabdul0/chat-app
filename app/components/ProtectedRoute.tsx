"use client";

import { useAuth } from "@/app/provider";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        localStorage.setItem("lastRoute", pathname); // Save last attempted route
        router.push("/auth/login");
      }
    }
  }, [user, loading, router, pathname]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );

  return <>{children}</>;
}
