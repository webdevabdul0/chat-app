"use client";

import { db } from "@/lib/firebase"; // Firestore instance
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import Post from "@/app/components/Post"; // Import the Post component
import Image from "next/image";
import RightPanel from "@/app/components/RightPanel";
import { Ghost } from "lucide-react"; // Import an icon for better UI

interface PostData {
  id: string;
  userId: string;
  caption: string;
  imageUrl: string;
  location?: string;
  createdAt: any;
  likes: string[]; // Array of user IDs who liked the post
}

export default function HomePage() {
  const [posts, setPosts] = useState<PostData[]>([]);

  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedPosts = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as PostData[];
      setPosts(fetchedPosts);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="flex-1  justify-center">
      <div className="max-w-3xl w-full mx-auto mt-7 mb-40 p-4 flex flex-col items-center">
        <Image src="/logo.png" alt="logo" width={100} height={100} />

        <div className="w-full mt-8 space-y-8">
          {posts.length > 0 ? (
            posts.map((post) => <Post key={post.id} post={post} />)
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

      <div className="w-full hidden xl:flex">
        <RightPanel />
      </div>
    </div>
  );
}
