import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { useChat } from "@/app/ChatProvider";
import { v4 as uuidv4 } from "uuid";

const NewGroupDialog = ({ open, setOpen }) => {
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const { chatClient } = useChat();
  const currentUserID = chatClient?.userID;

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "users"));
        const userList = querySnapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter((user) => user.id !== currentUserID);
        setUsers(userList);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    if (open) fetchUsers();
  }, [open]);

  const toggleUserSelection = (user) => {
    setSelectedUsers((prev) =>
      prev.includes(user.id)
        ? prev.filter((id) => id !== user.id)
        : [...prev, user.id]
    );
  };

  const createGroupChat = async () => {
    if (selectedUsers.length < 2) return; // Require at least 2 other users

    const groupMembers = [currentUserID, ...selectedUsers];
    const channelID = `group_${uuidv4()}`; // Generate a unique, short ID
    const channel = chatClient.channel("messaging", channelID, {
      name: "New Group",
      members: groupMembers,
    });

    await channel.watch();
    setOpen(false);
    setSelectedUsers([]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md p-6">
        <DialogTitle>Select Users for Group Chat</DialogTitle>
        <div className="flex flex-col gap-4">
          {users.map((user) => (
            <button
              key={user.id}
              onClick={() => toggleUserSelection(user)}
              className={`flex items-center gap-3 p-3 rounded-lg transition ${
                selectedUsers.includes(user.id)
                  ? "bg-primary/20"
                  : "hover:bg-primary/10"
              }`}
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
        <Button
          onClick={createGroupChat}
          disabled={selectedUsers.length < 2}
          className="w-full mt-4"
        >
          Create Group Chat
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default NewGroupDialog;
