"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { StreamChat } from "stream-chat";
import { Chat } from "stream-chat-react";
import "stream-chat-react/dist/css/v2/index.css";
import { StreamVideoClient } from "@stream-io/video-react-sdk";
import { useAuth } from "@/app/provider";
import { Loader2 } from "lucide-react";

const apiKey = "ggyyw7qegd59";
const chatClient = StreamChat.getInstance(apiKey);

// ✅ Define Context Type
interface ChatContextType {
  chatClient: StreamChat | null;
  videoClient: StreamVideoClient | null;
  userToken: string | null;
}

// ✅ Create Context with Default Value
const ChatContext = createContext<ChatContextType>({
  chatClient: null,
  videoClient: null,
  userToken: null,
});

// ✅ Custom Hook for Using Chat Context
export const useChat = () => useContext(ChatContext);

export default function ChatProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const [clientReady, setClientReady] = useState(false);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [videoClient, setVideoClient] = useState<StreamVideoClient | null>(
    null
  );

  useEffect(() => {
    if (!user || chatClient.userID) return;

    const connectUser = async () => {
      try {
        console.log("🔹 Fetching token for user:", user.uid);

        const res = await fetch("/api/connect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.uid,
            username: user.username,
            displayName: user.displayName,
          }),
        });

        const data = await res.json();
        setUserToken(data.token);
        if (!data.token) throw new Error("No token received");

        console.log("✅ Token received:", data.token);

        await chatClient.connectUser(
          {
            id: user.uid,
            name: user.displayName || user.username || "User",
            username: user.username,
          },
          data.token
        );

        // Initialize Video Client
        const streamVideoClient = new StreamVideoClient({
          apiKey,
          user: {
            id: user.uid,
            name: user.displayName || user.username,
          },
          token: data.token,
        });
        setVideoClient(streamVideoClient);

        console.log("✅ User connected successfully!");
        setClientReady(true);
      } catch (error) {
        console.error("❌ Chat connection error:", error);
      }
    };

    connectUser();

    return () => {
      if (chatClient.userID) {
        chatClient.disconnectUser();
        console.log("🔹 User disconnected");
      }
      if (videoClient) {
        videoClient.disconnectUser();
        console.log("🔹 Video client disconnected");
      }
    };
  }, [user]);

  if (!clientReady)
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
        <p className="mt-4 text-lg font-semibold text-gray-700">
          Please Wait...
        </p>
      </div>
    );

  return (
    <ChatContext.Provider value={{ chatClient, videoClient, userToken }}>
      <Chat client={chatClient}>{children}</Chat>
    </ChatContext.Provider>
  );
}
