import { useState, useEffect } from "react";
import { getUserCached } from "@/lib/userCache";
import Image from "next/image";

interface ChatMemberProps {
  userId: string;
  Name: string;
  userName: string;
}

const ChatMember = ({ userId, Name, userName }: ChatMemberProps) => {
  const [profilePic, setProfilePic] = useState(null);

  useEffect(() => {
    const fetchProfilePic = async () => {
      if (!userId) return;
      try {
        const user = await getUserCached(userId);
        setProfilePic(user?.profilePic || null);
      } catch (error) {
        console.error("Error fetching profile picture:", error);
      }
    };

    fetchProfilePic();
  }, [userId]);

  return (
    <div className="flex items-center gap-3 p-3">
      {profilePic ? (
        <Image
          src={profilePic}
          alt={Name}
          width={40}
          height={40}
          className="w-10 h-10 rounded-full object-cover"
          onError={() => setProfilePic(null)}
        />
      ) : (
        <div className="w-10 h-10 flex items-center justify-center bg-gray-300 text-white rounded-full">
          {Name?.charAt(0).toUpperCase() || "?"}
        </div>
      )}
      <div className="flex flex-col text-start">
        <span className="font-semibold text-dark text-lg ">
          {Name || "User"}
        </span>
        <span className="font-semibold text-dark text-sm text-black/60 ">
          {userName || "User"}
        </span>
      </div>
    </div>
  );
};

export default ChatMember;
