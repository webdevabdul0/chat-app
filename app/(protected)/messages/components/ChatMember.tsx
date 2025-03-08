import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

const ChatMember = ({ userId, Name, userName }) => {
  const [profilePic, setProfilePic] = useState(null);

  useEffect(() => {
    const fetchProfilePic = async () => {
      if (!userId) return;
      try {
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
          setProfilePic(userDoc.data().profilePic || null);
        }
      } catch (error) {
        console.error("Error fetching profile picture:", error);
      }
    };

    fetchProfilePic();
  }, [userId]);

  return (
    <div className="flex items-center gap-3 p-3">
      {profilePic ? (
        <img
          src={profilePic}
          alt={Name}
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
