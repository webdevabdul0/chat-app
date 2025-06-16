"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "@/app/provider";
import { useParams } from "next/navigation"; // Use `useParams()`
import Sidebar from "@/app/components/Sidebar";
import Post from "@/app/components/Post";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { Ghost } from "lucide-react";

export default function PostPage() {
  const { id } = useParams(); // ✅ Unwrap params properly
  const { user } = useAuth();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    async function fetchPost() {
      const docRef = doc(db, "posts", id as string);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const postData = docSnap.data();
        setPost({
          id: docSnap.id,
          ...postData,
          createdAt: postData.createdAt?.seconds
            ? postData.createdAt.seconds * 1000
            : null,
        });
      } else {
        setPost(null);
      }
      setLoading(false);
    }

    fetchPost();
  }, [id]);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <Sidebar isFixed={true} />

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center p-6 ">
        <Image src="/logo.png" alt="logo" width={140} height={140} />

        {/* Post Section */}
        <div className="max-w-2xl w-full mt-10">
          {loading ? (
            <p className="text-center text-gray-500">Loading...</p>
          ) : post ? (
            <Post post={post} />
          ) : (
            <div className="flex flex-col items-center text-gray-400 py-16">
              <Ghost className="w-16 h-16 text-gray-400" />
              <p className="mt-4 text-xl font-semibold">Post not found</p>
            </div>
          )}
        </div>

        {/* Authenticated / Unauthenticated UI */}
        <div className="mt-10 text-center">
          {user ? (
            <>
              <p className="text-gray-400 text-lg">Return to the homepage</p>
              <Link href="/home">
                <Button className="mt-3">Go to Homepage</Button>
              </Link>
            </>
          ) : (
            <>
              <p className="text-gray-400 text-lg">
                Want to join the conversation?
              </p>
              <Link href="/auth/login">
                <Button className="mt-3">Login</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
