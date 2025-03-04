"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useChat } from "@/app/ChatProvider";
import {
  ChannelList,
  Channel,
  MessageList,
  MessageInput,
  Window,
} from "stream-chat-react";
import { Video, MessageSquareText, Plus } from "lucide-react";
import { useAuth } from "@/app/provider";
import CustomChannelHeader from "./components/CustomChannelHeader";

const CustomChannelPreview = ({
  channel,
  setActiveChannel,
  selectedChannel,
}) => {
  const { user: currentUser } = useAuth();
  if (!channel || !channel.state || !channel.state.members) return null;

  const members = Object.values(channel.state.members || {});
  if (members.length !== 2) return null;

  const recipient = members.find(
    (member) => member.user.id !== currentUser?.uid
  );

  const recipientName = recipient?.user?.name || "Unknown User";
  const recipientAvatar = recipient?.user?.image;
  const lastMessage =
    channel.state.messages.length > 0
      ? channel.state.messages[channel.state.messages.length - 1].text
      : "No messages yet";

  // Check if this channel is the selected one
  const isSelected = selectedChannel?.id === channel.id;

  return (
    <div
      className={`flex items-center justify-between p-3 m-2 rounded-lg cursor-pointer transition-all 
        ${isSelected ? "bg-primary/10" : "hover:bg-primary/5"}`}
      onClick={() => setActiveChannel(channel)}
    >
      <div className="flex items-center gap-3">
        {recipientAvatar ? (
          <img
            src={recipientAvatar}
            alt={recipientName}
            className="w-10 h-10 rounded-full"
          />
        ) : (
          <div className="w-10 h-10 flex items-center justify-center bg-gray-300 text-white rounded-full">
            {recipientName.charAt(0).toUpperCase()}
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

  if (!chatClient)
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin w-8 h-8 text-purple-500" />
      </div>
    );

  return (
    <div className="flex h-screen bg-purple-50">
      {/* Sidebar */}
      <div className="sm:w-1/3 md:w-1/5 bg-white shadow-md border-r hidden sm:flex flex-col">
        <div className="p-4 text-lg font-semibold border-b flex items-center justify-between">
          <div className="flex items-center gap-2 text-black/80">
            <MessageSquareText className="text-black/80" /> Messages
          </div>
          <Plus className="cursor-pointer text-purple-500" />
        </div>

        <ChannelList
          filters={{
            type: "messaging",
            members: { $in: [chatClient.userID!] },
          }}
          options={{ presence: true, state: true }}
          Preview={CustomChannelPreview}
        />
      </div>

      {/* Chat Window */}
      <div className="w-full sm:w-2/3 md:w-3/5 flex flex-col bg-white border-r">
        <Channel channel={selectedChannel}>
          <Window>
            <CustomChannelHeader />
            <MessageList />
            <MessageInput />
          </Window>
        </Channel>
      </div>

      {/* Right Sidebar - Member Info */}
      <div className="hidden  md:w-1/5 bg-secondary md:flex flex-col p-4">
        <h2 className="text-black/80  font-semibold text-xl mb-4">
          Chat Members
        </h2>
        {selectedChannel && (
          <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow">
            <img
              src={
                selectedChannel?.state?.members?.[chatClient.userID!]?.user
                  ?.image || "default.png"
              }
              alt="user"
              className="w-10 h-10 rounded-full"
            />
            <span className="font-medium text-purple-900">
              {selectedChannel?.state?.members?.[chatClient.userID!]?.user
                ?.name || "User"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesPage;
