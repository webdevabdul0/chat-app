"use client";

import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/app/provider";
import MessageButton from "@/app/components/MessageButton";
import Post from "@/app/components/Post";
import { Ghost, Settings, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import RightPanel from "@/app/components/RightPanel";
import SettingsPopup from "@/app/components/SettingsPopup";
import BookingDialog from "../../messages/components/BookingDialog";
import Image from "next/image";

interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  location: string;
  profilePic: string;
  createdAt: any;
  description?: string;
}

interface PostData {
  id: string;
  userId: string;
  imageUrl: string;
  caption?: string;
  createdAt: any;
  mediaType?: string;
}

export default function ProfilePage() {
  const { userId } = useParams();
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const userIdStr = Array.isArray(userId) ? userId[0] : userId;
    const fetchUserData = async () => {
      try {
        const userRef = doc(db, "users", userIdStr);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          setUser({ id: userSnap.id, ...userSnap.data() } as User);
        }

        // Fetch user's posts
        const postsQuery = query(
          collection(db, "posts"),
          where("userId", "==", userIdStr)
        );
        const postsSnap = await getDocs(postsQuery);

        const fetchedPosts = postsSnap.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            caption: data.caption || "",
          };
        }) as PostData[];

        setPosts(fetchedPosts);
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);

  if (loading)
    return (
      <div className="text-center mt-10 text-white">Loading profile...</div>
    );

  return (
    <div className="flex-1  justify-center ">
      {/* Profile & Posts Section (Centered) */}
      <div className="max-w-3xl w-full mx-auto px-4 mt-7 mb-40 gap-8">
        {user ? (
          <div className="py-10">
            <div className="flex flex-col sm:flex-row items-center justify-between ">
              <div className="flex flex-col sm:flex-row items-center space-x-4">
                {!user.profilePic ? (
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={user.profilePic} alt={user.fullName} />
                    <AvatarFallback>{user.fullName.charAt(0)}</AvatarFallback>
                  </Avatar>
                ) : (
                  <Image
                    src={user.profilePic}
                    alt="Profile"
                    width={96}
                    height={96}
                    className="w-24 h-24 rounded-full object-cover"
                  />
                )}

                <div className="text-center sm:text-start mt-5 sm:mt-0">
                  <h1 className="text-lg font-bold ">{user.fullName}</h1>
                  <p className="text-gray-400">{user.username}</p>
                </div>
              </div>

              <div className="flex sm:hidden">
                <p className="text-base font-semibold text-black">
                  {user.description}
                </p>
              </div>

              <div className="mt-4 flex gap-2">
                {currentUser && currentUser.uid !== user.id ? (
                  <>
                    {/* Show message button only for other users */}
                    <MessageButton
                      recipientId={user.id}
                      recipientName={user.fullName}
                    />
                    <BookingDialog recipientId={user.id} />
                  </>
                ) : (
                  <>
                    {/* Show Edit Profile for self */}
                    <button
                      onClick={() => setIsPopupOpen(true)}
                      className="flex items-center gap-3 px-3 py-2 rounded-xl text-base font-medium transition border border-transparent 
              text-black/40 bg-primary text-white hover:bg-primary/90"
                    >
                      <User className="w-6 h-6" />
                      Edit Profile
                    </button>

                    {isPopupOpen && (
                      <SettingsPopup onClose={() => setIsPopupOpen(false)} />
                    )}

                    {/* Booking dialog for self */}
                    <BookingDialog recipientId={user.id} />
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-white">User not found.</p>
        )}

        <div className=" hidden sm:flex">
          <p className="text-base font-semibold text-black">
            {user?.description}
          </p>
        </div>

        <h2 className="text-xl font-bold mt-6 text-black">Posts</h2>

        <div className="w-full mt-8 space-y-8">
          {posts.length > 0 ? (
            posts.map((post) => (
              <Post
                key={post.id}
                post={{
                  ...post,
                  caption: post.caption || "",
                  mediaType:
                    post.mediaType === "image" || post.mediaType === "video" || post.mediaType === "audio"
                      ? post.mediaType
                      : null,
                }}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center text-gray-300 py-16 sm:py-20 lg:py-28 gap-3">
              <Ghost className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 text-gray-300" />
              <p className="mt-4 text-xl sm:text-2xl lg:text-3xl font-semibold text-gray-400">
                Nothing here yet
              </p>
              <p className="text-base sm:text-lg lg:text-xl text-gray-400 text-center max-w-md">
                Be the first to post something and start the conversation!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Only visible on xl screens */}
      <div className="w-full hidden xl:flex">
        <RightPanel />
      </div>
    </div>
  );
}
