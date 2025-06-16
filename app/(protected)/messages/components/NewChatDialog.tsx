import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { User } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { useChat } from "@/app/ChatProvider";
import Image from "next/image";

const NewChatDialog = ({
  open,
  setOpen,
  setSelectedChannel,
  setShowChatWindow,
}) => {
  const [users, setUsers] = useState([]);
  const { chatClient } = useChat();
  const currentUserID = chatClient?.userID;

  useEffect(() => {
    const fetchUsers = async () => {
      const querySnapshot = await getDocs(collection(db, "users"));
      const userList = querySnapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter((user) => user.id !== currentUserID); // Exclude current user
      setUsers(userList);
    };

    if (open) fetchUsers();
  }, [open]);

  const startChat = async (user) => {
    const channel = chatClient.channel("messaging", {
      members: [currentUserID, user.id],
    });

    try {
      await channel.watch(); // Ensure channel exists
      await channel.show(); // Unhide the chat if it was hidden
      setSelectedChannel(channel); // Set the active chat
      setShowChatWindow(true); // Show the chat window
      setOpen(false); // Close dialog
    } catch (error) {
      console.error("Error starting chat:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md w-full max-h-[60vh] sm:max-h-[80vh] flex flex-col">
        {/* Fixed Title & Close Button */}
        <div className="p-4 border-b">
          <DialogTitle>Select a User</DialogTitle>
        </div>

        {/* Scrollable User List */}
        <div className="flex-1 w-full overflow-y-auto p-0">
          {users.map((user) => (
            <button
              key={user.id}
              onClick={() => startChat(user)}
              className="flex w-full items-center gap-3 p-3 hover:bg-primary/10 rounded-lg transition"
            >
              {user.profilePic ? (
                <Image
                  src={user.profilePic}
                  alt={user.fullName}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 flex items-center justify-center bg-gray-300 text-white rounded-full">
                  <User className="w-5 h-5" />
                </div>
              )}
              <div className="text-start">
                <p className="font-medium">{user.fullName}</p>
                <p className="text-sm text-gray-500">@{user.username}</p>
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewChatDialog;
