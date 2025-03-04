"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { db, storage } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from "@/app/provider";

export default function CreatePost() {
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const handlePost = async () => {
    if (!caption || !image) return alert("Caption and image are required");
    setLoading(true);

    try {
      // Upload Image to Firebase Storage
      const imageRef = ref(storage, `posts/${user.uid}/${Date.now()}`);
      await uploadBytes(imageRef, image);
      const imageUrl = await getDownloadURL(imageRef);

      // Save Post to Firestore
      await addDoc(collection(db, "posts"), {
        userId: user.uid,
        caption,
        location,
        imageUrl,
        createdAt: serverTimestamp(),
        likes: 0,
        comments: [],
      });

      router.push("/home"); // Redirect to home page
    } catch (error) {
      console.error("Error posting:", error);
      alert("Failed to post. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-white shadow-md rounded">
      <h2 className="text-xl font-bold mb-4">Create Post</h2>
      <textarea
        className="w-full p-2 border rounded mb-3"
        placeholder="Write a caption..."
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
      />
      <input
        className="w-full p-2 border rounded mb-3"
        type="text"
        placeholder="Location (optional)"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
      />
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setImage(e.target.files?.[0] || null)}
        className="mb-3"
      />
      <button
        onClick={handlePost}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? "Posting..." : "Post"}
      </button>
    </div>
  );
}
