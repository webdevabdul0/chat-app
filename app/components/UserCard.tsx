"use client";

import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserProps {
  user: {
    id: string;
    fullName: string;
    username: string;
    profilePic?: string;
  };
}

// Function to consistently assign a cover based on user ID
const getUserCover = (userId: string) => {
  const covers = [
    "/cover/cover (1).png",
    "/cover/cover (2).png",
    "/cover/cover (3).png",
  ];

  // Generate an index based on user ID
  const index = userId.charCodeAt(0) % covers.length;

  return covers[index];
};

export default function UserCard({ user }: UserProps) {
  const router = useRouter();
  const coverImage = getUserCover(user.id); // Cover remains the same for the user

  return (
    <div
      className="w-full rounded-xl bg-white shadow-lg overflow-hidden relative cursor-pointer transition-all hover:shadow-xl"
      style={{
        backgroundImage: `url('${coverImage}')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
      onClick={() => router.push(`/profile/${user.id}`)} // Navigate on click
    >
      <div className="flex flex-col items-start gap-3 px-4 pt-8 pb-3 rounded-xl">
        <Avatar className="w-12 h-12 border-2 border-white/40">
          <AvatarImage src={user.profilePic} alt={user.fullName} />
          <AvatarFallback className="bg-primary text-white font-semibold">
            {user.fullName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="text-base font-semibold text-white">
            {user.fullName}
          </span>
          <span className="text-sm text-white/80">@{user.username}</span>
        </div>
      </div>
    </div>
  );
}
