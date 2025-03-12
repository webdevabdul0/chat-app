"use client";

import { useState, useEffect, useRef } from "react";
import { Video, Phone, MoreVertical, Trash } from "lucide-react";
import { useAuth } from "@/app/provider";
import { useChannelStateContext } from "stream-chat-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import CallComponent from "./CallComponent";

const CustomChannelHeader = () => {
  const [isVideoCall, setIsVideoCall] = useState(true);
  const [callStarted, setCallStarted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [recipientProfilePic, setRecipientProfilePic] = useState(null);

  const hasFetched = useRef(false); // ✅ Prevent multiple fetches

  const { channel } = useChannelStateContext();
  const { user: currentUser } = useAuth();

  if (!channel || !channel.state || !channel.state.members) return null;

  const members = Object.values(channel.state.members);
  const recipient = members.find(
    (member) => member.user.id !== currentUser?.uid
  );
  const isOnline = recipient?.user?.online;

  // ✅ Fetch Profile Picture from Firebase (Only Once)
  useEffect(() => {
    if (hasFetched.current || !recipient?.user?.id) return;
    hasFetched.current = true;

    const fetchProfilePic = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", recipient.user.id));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setRecipientProfilePic(userData.profilePic || null);
        }
      } catch (error) {
        console.error("Error fetching profile picture:", error);
      }
    };

    fetchProfilePic();
  }, []); // ✅ Empty dependency array ensures it runs only once

  return (
    <div className="p-4 xl:border-b flex items-center justify-between bg-white w-full">
      {/* Left: User Info */}
      <div className="flex items-center gap-3">
        {/* User Avatar */}
        {recipientProfilePic ? (
          <img
            src={recipientProfilePic}
            alt={recipient?.user?.name}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 flex items-center justify-center bg-gray-300 text-white rounded-full">
            {recipient?.user?.name?.charAt(0).toUpperCase() || "?"}
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
        {/* Call & Video Buttons  
        {!callStarted ? (
          <>
            <button
              onClick={() => {
                setIsVideoCall(true);
                setCallStarted(true);
              }}
              className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition"
            >
              <Video className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => {
                setIsVideoCall(false);
                setCallStarted(true);
              }}
              className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition"
            >
              <Phone className="w-5 h-5 text-gray-600" />
            </button>
          </>
        ) : (
          <CallComponent isVideoCall={isVideoCall} />
        )}

        */}

        {/* More Options */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition"
          >
            <MoreVertical className="w-5 h-5 text-gray-600" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-white shadow-lg rounded-lg p-2 border border-gray-200 z-20">
              <button
                onClick={() => setMenuOpen(false)}
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
