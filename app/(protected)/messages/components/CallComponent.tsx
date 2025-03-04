// CallComponent.tsx
import React, { useState } from "react";
import { useAuth } from "@/app/provider";
import { useChat } from "@/app/ChatProvider";
import { useChannelStateContext } from "stream-chat-react";
import { useRouter } from "next/navigation";

const CallComponent = ({ isVideoCall, startCallCallback, endCallCallback }) => {
  const { user } = useAuth();
  const { chatClient, videoClient } = useChat();
  const { channel } = useChannelStateContext();
  const router = useRouter();
  const [isInCall, setIsInCall] = useState(false);
  const [callId, setCallId] = useState(null);

  const startCall = async () => {
    if (!videoClient || !channel) {
      console.error("Video client or channel is not available");
      return;
    }

    try {
      const newCallId = `call-${Date.now()}`;
      const callInstance = videoClient.call("default", newCallId);
      await callInstance.join({ create: true });

      setCallId(newCallId);
      setIsInCall(true);
      startCallCallback();
      console.log(isVideoCall ? "Video Call Started" : "Voice Call Started");

      const baseUrl = window.location.origin;
      await channel.sendMessage({
        text: `📞 ${user.displayName || user.username} has started a ${
          isVideoCall ? "video" : "voice"
        } call.\n[👉 Join Call](${baseUrl}/messages/${newCallId})`,
        customData: {
          callId: newCallId,
          callType: isVideoCall ? "video" : "voice",
          initiator: user.id,
          active: true,
        },
      });

      router.push(`/messages/${newCallId}`);
    } catch (error) {
      console.error("Failed to start call:", error);
    }
  };

  return (
    <button
      onClick={startCall}
      className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition"
    >
      {isVideoCall ? "Start Video Call" : "Start Voice Call"}
    </button>
  );
};

export default CallComponent;
