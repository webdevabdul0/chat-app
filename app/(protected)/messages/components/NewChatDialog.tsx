import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, User } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { useChat } from "@/app/ChatProvider";

const NewChatDialog = ({ open, setOpen }) => {
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

    await channel.watch(); // Ensure channel exists
    setOpen(false); // Close dialog
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md p-6">
        <DialogTitle>Select a User</DialogTitle>
        <div className="flex flex-col gap-4">
          {users.map((user) => (
            <button
              key={user.id}
              onClick={() => startChat(user)}
              className="flex items-center gap-3 p-3 hover:bg-primary/10 rounded-lg transition"
            >
              {user.profilePic ? (
                <img
                  src={user.profilePic}
                  alt={user.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 flex items-center justify-center bg-gray-300 text-white rounded-full">
                  <User className="w-5 h-5" />
                </div>
              )}
              <div>
                <p className="font-medium">{user.name}</p>
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
