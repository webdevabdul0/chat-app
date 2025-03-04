"use client";

import { useState } from "react";

import { Video, Phone, MoreVertical, Trash } from "lucide-react";
import { useAuth } from "@/app/provider";
import { useChannelStateContext } from "stream-chat-react";
import CallComponent from "./CallComponent";

import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase"; // ✅ Ensure Firebase is imported

//Look into it Later
const handleDeleteChannel = async (e, channel, currentUser) => {
  e.stopPropagation(); // Prevents clicking on the chat preview itself
  {
    /*
  try {
    // Log the entire channel object to inspect its structure
    console.log("Full channel object:", channel);

    // Check if currentUser.uid is defined
    if (!currentUser?.uid) {
      console.error("Missing currentUser.uid");
      return;
    }

    const channelRef = doc(db, "channels", channel.id);
    const channelDoc = await getDoc(channelRef);

    if (!channelDoc.exists()) {
      // If channel doesn't exist, create it first
      await setDoc(channelRef, {
        members: [currentUser.uid], // Only include the current user
        createdAt: new Date(),
      });
      console.log("Channel created:", channel.id);
    }

    // Mark channel as deleted for currentUser only
    await updateDoc(channelRef, {
      [`deletedBy.${currentUser.uid}`]: true,
    });

    console.log("Chat hidden for user:", currentUser.uid);
  } catch (error) {
    console.error("Failed to delete (hide) channel", error);
  }

  */
  }
};

const CustomChannelHeader = () => {
  const [isVideoCall, setIsVideoCall] = useState(true); // Set to true for video call, false for voice call
  const [callStarted, setCallStarted] = useState(false);

  const handleCallStart = () => {
    setCallStarted(true); // Start the call
  };

  // Handle end of call
  const handleCallEnd = () => {
    setCallStarted(false); // End the call
  };

  const { channel } = useChannelStateContext(); // ✅ Get current channel from context
  const { user: currentUser } = useAuth(); // ✅ Get logged-in user
  const [menuOpen, setMenuOpen] = useState(false);

  if (!channel || !channel.state || !channel.state.members) return null;

  const members = Object.values(channel.state.members);
  const recipient = members.find(
    (member) => member.user.id !== currentUser?.uid
  );

  const isOnline = recipient?.user?.online; // ✅ Check if recipient is online

  return (
    <div className="p-4 border-b flex items-center justify-between bg-white shadow">
      {/* Left: User Info */}
      <div className="flex items-center gap-3">
        {/* User Avatar */}
        {recipient?.user?.image ? (
          <img
            src={recipient.user.image}
            alt={recipient.user.name}
            className="w-10 h-10 rounded-full"
          />
        ) : (
          <div className="w-10 h-10 flex items-center justify-center bg-gray-300 text-white rounded-full">
            {recipient?.user?.name?.charAt(0).toUpperCase()}
          </div>
        )}

        {/* Name & Online Status */}
        <div>
          <span className="font-semibold text-lg">
            {recipient?.user?.name || "Unknown"}
          </span>
          <div
            className={`text-sm ${
              isOnline ? "text-green-500" : "text-gray-500"
            }`}
          >
            {isOnline ? "Online" : "Offline"}
          </div>
        </div>
      </div>

      {/* Right: Actions (Call, Video, More Options) */}
      <div className="flex items-center gap-3">
        {/* Voice Call Button */}

        {!callStarted ? (
          // Video/Voice Call Buttons
          <>
            <button
              onClick={() => {
                setIsVideoCall(true); // Set to video call
                handleCallStart(); // Start the call
              }}
              className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition"
            >
              <Video className="w-5 h-5 text-gray-600" />
            </button>

            <button
              onClick={() => {
                setIsVideoCall(false); // Set to voice call
                handleCallStart(); // Start the call
              }}
              className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition"
            >
              <Phone className="w-5 h-5 text-gray-600" />
            </button>
          </>
        ) : (
          // Render CallComponent to handle the ongoing call
          <CallComponent
            isVideoCall={isVideoCall}
            startCallCallback={() => console.log("Call started")}
            endCallCallback={() => console.log("Call ended")}
          />
        )}

        {/* More Options (Delete Chat, etc.) */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition"
          >
            <MoreVertical className="w-5 h-5 text-gray-600" />
          </button>

          {/* Dropdown Menu */}
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-white shadow-lg rounded-lg p-2 border border-gray-200 z-20">
              {/* Delete Chat Button */}
              <button
                onClick={(e) => {
                  handleDeleteChannel(e, channel, currentUser); // ✅ Pass event explicitly
                  setMenuOpen(false);
                }}
                className="flex items-center gap-2 w-full text-left p-2 text-red-600 hover:bg-gray-100 rounded-md transition"
              >
                <Trash className="w-5 h-5" />
                Delete Chat
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomChannelHeader;
