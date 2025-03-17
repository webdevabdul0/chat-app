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
import { Check, Send, Copy, Share2 } from "lucide-react";

const ShareButton = ({ text, attachments, postId }) => {
  const { client } = useChatContext();
  const { user: currentUser } = useAuth();
  const [channels, setChannels] = useState([]);
  const [selectedChannels, setSelectedChannels] = useState([]);
  const [open, setOpen] = useState(false);

  // Construct the post link dynamically
  const postLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/post/${postId}`
      : "";

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
          state: false,
        });
        setChannels(userChannels);
      } catch (error) {
        console.error("Error fetching channels:", error);
      }
    };

    fetchChannels();
  }, [client]);

  // Get recipient name correctly for one-on-one chats
  const getChannelDisplayName = (channel) => {
    if (!channel?.state) return "Unknown Chat";

    const members = Object.values(channel.state.members);
    const isGroupChat = members.length > 2;

    if (isGroupChat) {
      return channel.data?.name || `Group Chat (${channel.id})`;
    }

    // One-on-One Chat: Get recipient
    const recipient = members.find(
      (member) => member.user.id !== currentUser?.uid
    );

    if (!recipient) return "Unnamed Chat";

    const recipientName =
      recipient.user.name || recipient.user.username || recipient.user.id; // Fallback order
    return `${recipientName} `;
  };

  // Toggle channel selection
  const toggleChannelSelection = (channel) => {
    setSelectedChannels((prev) =>
      prev.some((ch) => ch.id === channel.id)
        ? prev.filter((ch) => ch.id !== channel.id)
        : [...prev, channel]
    );
  };

  // Handle sharing the post to selected chats
  const handleShare = async () => {
    if (!selectedChannels.length) return;
    await Promise.all(
      selectedChannels.map((channel) =>
        channel.sendMessage({
          text: `Check out this post: ${postLink}`,
          attachments,
        })
      )
    );
    setSelectedChannels([]);
    setOpen(false);
  };

  // Copy link to clipboard
  const copyLink = async () => {
    await navigator.clipboard.writeText(postLink);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Send className="w-6 h-6 cursor-pointer" />
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share Post</DialogTitle>
        </DialogHeader>

        <p className="text-gray-600">Share this post link:</p>
        <div className="flex items-center space-x-2 mt-2 w-full">
          <Button
            variant="outline"
            onClick={copyLink}
            className="px-3 py-1 text-sm"
          >
            <Copy className="w-4 h-4 mr-1" /> Copy
          </Button>
          <a
            href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
              postLink
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex"
          >
            <Button variant="outline" className="px-3 py-1 text-sm">
              <Share2 className="w-4 h-4 mr-1" /> WhatsApp
            </Button>
          </a>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
              postLink
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex"
          >
            <Button variant="outline" className="px-3 py-1 text-sm">
              <Share2 className="w-4 h-4 mr-1" /> Facebook
            </Button>
          </a>
        </div>

        <ScrollArea className="max-h-[300px] space-y-2 mt-4">
          {channels.length > 0 ? (
            channels.map((channel) => {
              const isSelected = selectedChannels.some(
                (ch) => ch.id === channel.id
              );
              return (
                <div
                  key={channel.id}
                  onClick={() => toggleChannelSelection(channel)}
                  className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition ${
                    isSelected ? "bg-primary/10" : "hover:bg-gray-100"
                  }`}
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

        <Button
          onClick={handleShare}
          className="w-full mt-3"
          disabled={!selectedChannels.length}
        >
          Share to Chats
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default ShareButton;
