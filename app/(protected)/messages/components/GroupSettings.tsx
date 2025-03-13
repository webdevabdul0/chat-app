import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UserMinus, UserPlus, Trash } from "lucide-react";
import { useChat } from "@/app/ChatProvider";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

const GroupSettingsModal = ({ open, setOpen, channel }) => {
  const { chatClient } = useChat();
  const currentUserID = chatClient?.userID;
  const [members, setMembers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const isAdmin = channel?.data?.created_by?.id === currentUserID;

  useEffect(() => {
    if (open) {
      refreshMembers();
      fetchUsers();
    }
  }, [open]);

  const refreshMembers = async () => {
    await channel.query(); // Refresh channel state
    setMembers(Object.values(channel.state.members || {}));
  };

  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      setAllUsers(
        querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const addMember = async (userId) => {
    await channel.addMembers([userId]);
    refreshMembers(); // Refresh UI after adding member
  };

  const removeMember = async (userId) => {
    await channel.removeMembers([userId]);
    refreshMembers(); // Refresh UI after removing member
    if (userId === currentUserID) setOpen(false);
  };

  const deleteGroup = async () => {
    await channel.delete();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md p-6">
        <DialogTitle>Group Settings</DialogTitle>
        <div className="flex flex-col gap-4">
          {/* Member List */}
          <div>
            <h3 className="text-lg font-semibold">Members</h3>
            {members.map((member) => (
              <div
                key={member.user.id}
                className="flex justify-between items-center p-2 bg-gray-100 rounded-md mt-2"
              >
                <span>{member.user.name}</span>
                {(isAdmin || member.user.id === currentUserID) && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeMember(member.user.id)}
                  >
                    <UserMinus className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Add Members */}
          {isAdmin && (
            <div>
              <h3 className="text-lg font-semibold">Add Members</h3>
              {allUsers.map(
                (user) =>
                  !members.some((m) => m.user.id === user.id) && (
                    <div
                      key={user.id}
                      className="flex justify-between items-center p-2 bg-gray-100 rounded-md mt-2"
                    >
                      <span>{user.fullName}</span>
                      <Button size="sm" onClick={() => addMember(user.id)}>
                        <UserPlus className="w-4 h-4" />
                      </Button>
                    </div>
                  )
              )}
            </div>
          )}

          {/* Delete Group */}
          {isAdmin && (
            <Button
              variant="destructive"
              className="w-full mt-4"
              onClick={deleteGroup}
            >
              <Trash className="w-5 h-5 mr-2" /> Delete Group
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GroupSettingsModal;
