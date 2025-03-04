"use client";

import { useEffect, useState } from "react";
import {
  StreamCall,
  CallingState,
  useCall,
  useCallStateHooks,
  StreamVideo,
} from "@stream-io/video-react-sdk";
import { useAuth } from "@/app/provider";
import { useChat } from "@/app/ChatProvider";
import { use } from "react";
import { useRouter } from "next/navigation";
export default function CallPage({
  params,
}: {
  params: Promise<{ callId: string }>;
}) {
  const unwrappedParams = use(params);
  const callId = unwrappedParams.callId;

  const { user } = useAuth();
  const { videoClient } = useChat();
  const [call, setCall] = useState(null);
  const [mediaError, setMediaError] = useState(null);

  useEffect(() => {
    if (!callId || !user || !videoClient) return;

    // Request mic and camera permissions but don't fail if unavailable
    navigator.mediaDevices
      .getUserMedia({ audio: true, video: true })
      .catch(() => {
        console.warn("No mic or camera detected, but proceeding anyway.");
      });

    const newCall = videoClient.call("default", callId);
    newCall
      .join()
      .then(() => {
        console.log("✅ Joined call successfully!");
        setCall(newCall);
      })
      .catch((err) => {
        console.error("❌ Error joining call:", err);
      });

    return () => {
      if (newCall) {
        newCall.leave().catch(console.error);
      }
    };
  }, [callId, user, videoClient]);

  if (!call) return <p>Joining call...</p>;

  return (
    <div className="h-screen flex flex-col">
      <h1 className="p-4 bg-gray-100">Call: {callId}</h1>
      <StreamCall call={call}>
        <CallUI call={call} />
      </StreamCall>
    </div>
  );
}

const CallUI = ({ call }) => {
  const { useCallCallingState, useParticipantCount } = useCallStateHooks();
  const callingState = useCallCallingState();
  const participantCount = useParticipantCount();
  const router = useRouter();

  useEffect(() => {
    if (!call) return;

    // Listen for call ending event
    const handleCallEnded = () => {
      console.log("Call ended. Redirecting...");
      router.push("/messages"); // Redirect both users
    };

    call.on("call.ended", handleCallEnded);

    return () => {
      call.off("call.ended", handleCallEnded);
    };
  }, [call, router]);

  const handleEndCall = async () => {
    if (call) {
      await call.endCall(); // End the entire session
    }
    router.push("/messages"); // Redirect initiator
  };

  if (callingState !== CallingState.JOINED) {
    return <div>Loading call...</div>;
  }

  return (
    <div className="flex-1 grid place-items-center">
      <div className="text-center">
        <p className="mb-4">Call is active</p>
        <p>Call ID: {call.id}</p>
        <p>Participants: {participantCount}</p>
        <StreamVideo call={call} />
        <button
          className="mt-4 px-4 py-2 bg-red-500 text-white rounded"
          onClick={handleEndCall}
        >
          End Call
        </button>
      </div>
    </div>
  );
};
