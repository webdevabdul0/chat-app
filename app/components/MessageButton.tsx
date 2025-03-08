"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/app/provider";
import { Button } from "@/components/ui/button"; // ✅ Importing ShadCN Button
import ChatIcon from "@/public/icons/ChatDots.svg";
import Image from "next/image";

export default function MessageButton({
  recipientId,
  recipientName,
}: {
  recipientId: string;
  recipientName: string;
}) {
  const router = useRouter();
  const { user } = useAuth();

  const startChat = async () => {
    if (!user) return;

    try {
      const res = await fetch("/api/privChat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          username: user.username,
          displayName: user.displayName,
          recipientId,
          recipientName,
        }),
      });

      const data = await res.json();
      if (data.channelId) {
        console.log("✅ Chat created! Redirecting to /messages");
        router.push("/messages");
      } else {
        console.error("Failed to start chat");
      }
    } catch (error) {
      console.error("Error starting chat:", error);
    }
  };

  return (
    <Button
      onClick={startChat}
      className="flex items-center gap-3 p-3 sm:p-6 rounded-2xl text-base font-medium transition bg-primary text-white hover:bg-primary/90"
    >
      <Image src={ChatIcon} alt="Chat Icon" width={24} height={24} />
      Message
    </Button>
  );
}
