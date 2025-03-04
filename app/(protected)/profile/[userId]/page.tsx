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
import MessageButton from "@/app/components/MessageButton"; // Import MessageButton component

interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  location: string;
  profilePic: string;
  createdAt: any;
}

interface Post {
  id: string;
  userId: string;
  imageUrl: string;
  caption?: string;
  createdAt: any;
}

export default function ProfilePage() {
  const { userId } = useParams(); // Get userId from URL
  const { user: currentUser } = useAuth(); // Get logged-in user
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const fetchUserData = async () => {
      try {
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          setUser({ id: userSnap.id, ...userSnap.data() } as User);
        }

        // Fetch user posts
        const postsQuery = query(
          collection(db, "posts"),
          where("userId", "==", userId)
        );
        const postsSnap = await getDocs(postsQuery);

        const fetchedPosts = postsSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Post[];

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
    <div className="max-w-2xl mx-auto p-4">
      {user ? (
        <div className="bg-gray-900 p-6 rounded-lg shadow-md text-white">
          <div className="flex items-center space-x-4">
            <img
              src={user.profilePic || "/default-avatar.png"}
              alt="Profile"
              className="w-20 h-20 rounded-full"
            />
            <div>
              <h1 className="text-2xl font-bold">{user.fullName}</h1>
              <p className="text-gray-400">{user.location}</p>
              <p className="text-gray-400">{user.email}</p>
            </div>
          </div>

          {/* ✅ Show Message Button only if it's not the current user's profile */}
          {currentUser && currentUser.uid !== user.id && (
            <div className="mt-4">
              <MessageButton
                recipientId={user.id}
                recipientName={user.fullName}
              />
            </div>
          )}
        </div>
      ) : (
        <p className="text-white">User not found.</p>
      )}

      <h2 className="text-xl font-bold mt-6 text-white">Posts</h2>
      <div className="grid grid-cols-2 gap-4 mt-4">
        {posts.map((post) => (
          <div key={post.id} className="bg-gray-800 p-2 rounded-lg">
            <img src={post.imageUrl} alt="Post" className="w-full rounded-md" />
            <p className="text-white text-sm mt-2">{post.caption}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
