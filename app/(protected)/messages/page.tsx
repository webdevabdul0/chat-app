"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useChat } from "@/app/ChatProvider";
import { useAuth } from "@/app/provider";
import { db } from "@/lib/firebase"; // Import Firebase config
import { doc, getDoc } from "firebase/firestore";
import NewChatDialog from "./components/NewChatDialog"; // Import the dialog component
import NewGroupDialog from "./components/NewGroupDialog";
import {
  ChannelList,
  Channel,
  MessageList,
  MessageInput,
  Window,
} from "stream-chat-react";
import {
  MessageSquareText,
  ArrowLeft,
  Loader2,
  Settings,
  Plus,
} from "lucide-react";
import CustomChannelHeader from "./components/CustomChannelHeader";
import ChatMember from "./components/ChatMember";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react"; // Import Group Icon

import { MessageSimple } from "stream-chat-react";

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
  const isGroupChat = members.length > 2;

  // Get Group Name (If exists) or List Recipient Names
  const chatName = isGroupChat
    ? channel.data.name || "Unnamed Group"
    : members.find((member) => member.user.id !== currentUser?.uid)?.user
        ?.name || "Unknown User";

  // Fetch profile picture only for 1-on-1 chat
  useEffect(() => {
    if (isGroupChat) {
      setRecipientProfilePic(null);
      return;
    }

    const fetchProfilePic = async () => {
      const recipient = members.find(
        (member) => member.user.id !== currentUser?.uid
      );
      if (!recipient?.user?.id) return;

      try {
        const userDoc = await getDoc(doc(db, "users", recipient.user.id));
        if (userDoc.exists()) {
          setRecipientProfilePic(userDoc.data().profilePic || null);
        }
      } catch (error) {
        console.error("Error fetching profile picture:", error);
      }
    };

    fetchProfilePic();
  }, [members, currentUser?.uid, isGroupChat]);

  const lastMessage =
    channel.state.messages.length > 0
      ? channel.state.messages[channel.state.messages.length - 1].text
      : "No messages yet";

  const isSelected = selectedChannel?.id === channel.id;

  return (
    <div
      className={`flex items-center justify-between p-3 m-2 rounded-lg cursor-pointer transition-all 
        ${isSelected ? "bg-primary/5" : "hover:bg-primary/5"}`}
      onClick={() => {
        setActiveChannel(channel);
        setSelectedChannel(channel);
        setShowChatWindow(true);
      }}
    >
      <div className="flex items-center gap-3">
        {/* Group Icon or Profile Picture */}
        {isGroupChat ? (
          <div className="w-10 h-10 flex items-center justify-center bg-gray-300 rounded-full">
            <Users className="w-6 h-6 text-primary" />{" "}
            {/* Primary color group icon */}
          </div>
        ) : recipientProfilePic ? (
          <img
            src={recipientProfilePic}
            alt={chatName}
            className="w-10 h-10 rounded-full object-cover"
            onError={() => setRecipientProfilePic(null)}
          />
        ) : (
          <div className="w-10 h-10 flex items-center justify-center bg-gray-300 text-white rounded-full">
            {chatName.charAt(0)?.toUpperCase() || "?"}
          </div>
        )}

        <div>
          <span className="font-semibold block text-black/80 truncate w-48">
            {chatName}
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
  const [open, setOpen] = useState(false); // State for dialog
  const [openGroup, setOpenGroup] = useState(false); // State for dialog
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
        className={`w-full sm:w-1/3 xl:w-1/5 bg-white pt-20 xl:pt-4 border-r flex flex-col ${
          showChatWindow ? "hidden sm:flex" : "flex"
        }`}
      >
        <div className="p-4 text-lg font-semibold border-b flex items-center justify-between">
          <div className="flex items-center text-primary text-xl gap-3 font-semibold">
            <MessageSquareText className="text-primary" /> Messages
          </div>
        </div>

        {/* Channel List */}
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

        {/* Buttons Section */}
        <div className="mt-auto p-4 flex flex-row sm:flex-col gap-5">
          <Button
            onClick={() => setOpen(true)}
            className="w-full bg-primary text-white rounded-xl text-base py-5 flex items-center gap-2 font-semibold hover:bg-primary/90"
          >
            <Plus className="w-5 h-5" /> New Chat
          </Button>

          <NewChatDialog
            open={open}
            setOpen={setOpen}
            setSelectedChannel={setSelectedChannel}
            setShowChatWindow={setShowChatWindow}
          />

          <Button
            className="w-full bg-primary/5 border border-primary  text-primary rounded-xl text-base py-5 flex items-center gap-2 font-semibold hover:bg-primary/20"
            onClick={() => setOpenGroup(true)}
          >
            <Plus className="w-5 h-5" /> New Group Chat
          </Button>

          <NewGroupDialog open={openGroup} setOpen={setOpenGroup} />
        </div>
      </div>

      {/* Chat Window - Overlay on Mobile */}
      <div
        className={`w-full sm:w-2/3 xl:w-3/5 flex flex-col bg-white border-r ${
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
                <CustomChannelHeader
                  setSelectedChannel={setSelectedChannel}
                  setShowChatWindow={setShowChatWindow}
                />
              </div>
              <MessageList
                messageActions={[
                  "react", // Allows users to react with emojis

                  "quote", // Allows quoting a message in a reply
                  "edit", // Lets users edit their own messages
                  "delete", // Allows deleting messages
                ]}
              />

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
      <div className="hidden xl:w-1/5 bg-secondary xl:flex flex-col p-4">
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
