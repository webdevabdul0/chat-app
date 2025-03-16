import { useState, useEffect } from "react";
import { useChatContext } from "stream-chat-react";
import { useAuth } from "@/app/provider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, Send } from "lucide-react";

const ShareButton = ({ text, attachments }) => {
  const { client } = useChatContext();
  const { user: currentUser } = useAuth();
  const [channels, setChannels] = useState([]);
  const [selectedChannels, setSelectedChannels] = useState([]); // Toggle Selection
  const [open, setOpen] = useState(false); // Control modal state

  // Fetch user's channels dynamically
  useEffect(() => {
    const fetchChannels = async () => {
      if (!client?.userID) return;
      try {
        const filters = {
          type: "messaging",
          members: { $in: [client.userID] },
        };
        const sort = { last_message_at: -1 };
        const userChannels = await client.queryChannels(filters, sort, {
          watch: true,

          state: false, // Don't fetch full state (less data)
          limit: 20,
          presence: false, // Don't track online status (reduces load)
          fields: ["id", "name", "members"], // Fetch only needed fields
        });

        console.log("Fetched Channels:", userChannels); // Debugging

        setChannels(userChannels);
      } catch (error) {
        console.error("Error fetching channels:", error);
      }
    };

    fetchChannels();
  }, [client]);

  // Get Display Name (Recipient Name for DMs, Group Name for Group Chats)
  const getChannelDisplayName = (channel) => {
    if (!channel?.state) return "Unknown Chat";

    const members = Object.values(channel.state.members);
    const isGroupChat = members.length > 2;
    if (isGroupChat) return channel.data?.name || `Group Chat (${channel.id})`;

    const recipient = members.find(
      (member) => member.user.id !== currentUser?.uid
    );
    return recipient?.user?.name || `Chat with ${recipient?.user?.id}`;
  };

  // Toggle Selection
  const toggleChannelSelection = (channel) => {
    setSelectedChannels(
      (prevSelected) =>
        prevSelected.some((ch) => ch.id === channel.id)
          ? prevSelected.filter((ch) => ch.id !== channel.id) // Remove if already selected
          : [...prevSelected, channel] // Add if not selected
    );
  };

  // Send Message & Close Modal
  const handleShare = async () => {
    if (!selectedChannels.length) return;

    await Promise.all(
      selectedChannels.map((channel) =>
        channel.sendMessage({ text, attachments })
      )
    );

    setSelectedChannels([]); // Clear selection
    setOpen(false); // Close modal
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* Trigger Icon Button */}
      <DialogTrigger asChild>
        <Send className="w-6 h-6 cursor-pointer" />
      </DialogTrigger>

      {/* Modal Content */}
      <DialogContent className="w-[400px]">
        <DialogHeader>
          <DialogTitle>Share to Chats</DialogTitle>
        </DialogHeader>

        {/* List of Channels (Scrollable) */}
        <ScrollArea className="max-h-[300px] space-y-2">
          {channels.length > 0 ? (
            channels.map((channel) => {
              const isSelected = selectedChannels.some(
                (ch) => ch.id === channel.id
              );
              return (
                <div
                  key={channel.id}
                  onClick={() => toggleChannelSelection(channel)}
                  className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition
                    ${isSelected ? "bg-primary/10" : "hover:bg-gray-100"}`}
                >
                  <span>{getChannelDisplayName(channel)}</span>
                  {isSelected && <Check className="w-6 h-6 text-primary" />}
                </div>
              );
            })
          ) : (
            <p className="text-center text-gray-500">No chats available</p>
          )}
        </ScrollArea>

        {/* Share Button */}
        <Button
          onClick={handleShare}
          className="w-full mt-3"
          disabled={!selectedChannels.length}
        >
          Share
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default ShareButton;
