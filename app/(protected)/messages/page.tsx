"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useChat } from "@/app/ChatProvider";
import { useAuth } from "@/app/provider";
import { db } from "@/lib/firebase"; // Import Firebase config
import { doc, getDoc } from "firebase/firestore";
import {
  ChannelList,
  Channel,
  MessageList,
  MessageInput,
  Window,
} from "stream-chat-react";
import { MessageSquareText, ArrowLeft, Loader2 } from "lucide-react";
import CustomChannelHeader from "./components/CustomChannelHeader";
import ChatMember from "./components/ChatMember";

const CustomChannelPreview = ({
  channel,
  setActiveChannel,
  setSelectedChannel,
  selectedChannel,
  setShowChatWindow,
}) => {
  const { user: currentUser } = useAuth();
  const [recipientProfilePic, setRecipientProfilePic] = useState(null);

  if (!channel || !channel.state || !channel.state.members) return null;

  const members = Object.values(channel.state.members || {});
  if (members.length !== 2) return null;

  const recipient = members.find(
    (member) => member.user.id !== currentUser?.uid
  );

  console.log("Recipient Data:", recipient);

  const recipientName = recipient?.user?.name || "Unknown User";

  // Fetch profile picture from Firebase Firestore
  useEffect(() => {
    const fetchProfilePic = async () => {
      if (!recipient?.user?.id) return;

      try {
        const userDoc = await getDoc(doc(db, "users", recipient.user.id));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          console.log("Firebase User Data:", userData);
          setRecipientProfilePic(userData.profilePic || null);
        }
      } catch (error) {
        console.error("Error fetching profile picture:", error);
      }
    };

    fetchProfilePic();
  }, [recipient?.user?.id]);

  const lastMessage =
    channel.state.messages.length > 0
      ? channel.state.messages[channel.state.messages.length - 1].text
      : "No messages yet";

  const isSelected = selectedChannel?.id === channel.id;

  return (
    <div
      className={`flex items-center justify-between p-3 m-2 rounded-lg cursor-pointer transition-all 
        ${isSelected ? "bg-primary/10" : "hover:bg-primary/5"}`}
      onClick={() => {
        setActiveChannel(channel);
        setSelectedChannel(channel);
        setShowChatWindow(true); // Show chat window on mobile
      }}
    >
      <div className="flex items-center gap-3">
        {recipientProfilePic ? (
          <img
            src={recipientProfilePic}
            alt={recipientName}
            className="w-10 h-10 rounded-full object-cover"
            onError={() => setRecipientProfilePic(null)}
          />
        ) : (
          <div className="w-10 h-10 flex items-center justify-center bg-gray-300 text-white rounded-full">
            {recipientName?.charAt(0)?.toUpperCase() || "?"}
          </div>
        )}
        <div>
          <span className="font-medium block text-purple-900">
            {recipientName}
          </span>
          <span className="text-sm text-gray-500 block truncate w-48">
            {lastMessage}
          </span>
        </div>
      </div>
    </div>
  );
};

const MessagesPage = () => {
  const { chatClient } = useChat();
  const router = useRouter();
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [showChatWindow, setShowChatWindow] = useState(false);

  if (!chatClient)
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin w-8 h-8 text-purple-500" />
      </div>
    );

  return (
    <div className="flex h-screen bg-purple-50">
      {/* Sidebar */}
      <div
        className={`w-full sm:w-1/3 md:w-1/5 bg-white pt-20 xl:pt-4 border-r flex flex-col ${
          showChatWindow ? "hidden sm:flex" : "flex"
        }`}
      >
        <div className="p-4 text-lg font-semibold border-b flex items-center justify-between ">
          <div className="flex items-center text-primary text-xl gap-3 font-semibold">
            <MessageSquareText className="text-primary" /> Messages
          </div>
        </div>

        <ChannelList
          filters={{
            type: "messaging",
            members: { $in: [chatClient.userID!] },
          }}
          options={{ presence: true, state: true }}
          Preview={(props) => (
            <CustomChannelPreview
              {...props}
              setSelectedChannel={setSelectedChannel}
              selectedChannel={selectedChannel}
              setShowChatWindow={setShowChatWindow}
            />
          )}
        />
      </div>

      {/* Chat Window - Overlay on Mobile */}
      <div
        className={`w-full sm:w-2/3 md:w-3/5 flex flex-col bg-white border-r ${
          showChatWindow
            ? "fixed inset-0 z-50 bg-white sm:relative"
            : "hidden sm:flex"
        }`}
      >
        {selectedChannel ? (
          <Channel channel={selectedChannel}>
            <Window>
              <div className="flex items-center p-4 border-b">
                <button
                  onClick={() => setShowChatWindow(false)}
                  className="sm:hidden mr-2"
                >
                  <ArrowLeft className="w-7 h-7 text-primary" />
                </button>
                <CustomChannelHeader />
              </div>
              <MessageList />
              <MessageInput />
            </Window>
          </Channel>
        ) : (
          <div className="flex flex-col justify-center items-center h-full text-gray-500">
            <MessageSquareText className="w-12 h-12 text-gray-400 mb-2" />
            <p className="text-lg font-medium">Start a new conversation</p>
          </div>
        )}
      </div>

      {/* Right Sidebar - Member Info (Hidden on small devices) */}
      <div className="hidden md:w-1/5 bg-secondary md:flex flex-col p-4">
        <h2 className="text-black/80 font-semibold text-xl mb-4">
          Chat Members
        </h2>
        {selectedChannel?.state?.members && (
          <div className="flex flex-col gap-2">
            {Object.values(selectedChannel.state.members).map((member) => (
              <ChatMember
                key={member.user.id}
                userId={member.user.id}
                Name={member.user.name}
                userName={member.user.username}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesPage;
