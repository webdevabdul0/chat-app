"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/app/provider";

export default function MessageButton({
  recipientId,
  recipientName,
}: {
  recipientId: string;
}) {
  const router = useRouter();
  const { user } = useAuth(); // Get logged-in user

  const startChat = async () => {
    if (!user) return;

    try {
      console.log(user);

      const res = await fetch("/api/privChat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid, // Sender's ID
          username: user.username, // Sender's Username
          displayName: user.displayName, // Sender's Display Name
          recipientId, // Recipient's ID
          recipientName,
        }),
      });

      const data = await res.json();
      if (data.channelId) {
        console.log("✅ Chat created! Redirecting to /messages");
        router.push("/messages"); // ✅ Redirect to messages list
      } else {
        console.error("Failed to start chat");
      }
    } catch (error) {
      console.error("Error starting chat:", error);
    }
  };

  return (
    <button
      onClick={startChat}
      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg"
    >
      Message
    </button>
  );
}
