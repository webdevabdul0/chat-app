"use client";

import { useAuth } from "@/app/provider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "@/app/components/Sidebar";
import ChatProvider from "@/app/ChatProvider"; // ✅ Import ChatProvider
import { usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isMessagesPage = pathname === "/messages";

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  if (loading)
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
        <p className="mt-4 text-lg font-semibold text-gray-700">
          Connecting...
        </p>
      </div>
    );

  return (
    <ChatProvider>
      {" "}
      {/* ✅ Only loads for authenticated users */}
      <div className="flex">
        <Sidebar isFixed={!isMessagesPage} /> {/* ✅ Pass prop */}
        <main className="flex-1">{children}</main>
      </div>
    </ChatProvider>
  );
}
