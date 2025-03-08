"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { db, storage } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from "@/app/provider";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function CreatePost() {
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const handlePost = async () => {
    if (!caption.trim()) return alert("Caption is required");
    setLoading(true);

    try {
      let imageUrl = "";

      if (image) {
        const imageRef = ref(storage, `posts/${user.uid}/${Date.now()}`);
        await uploadBytes(imageRef, image);
        imageUrl = await getDownloadURL(imageRef);
      }

      await addDoc(collection(db, "posts"), {
        userId: user.uid,
        caption,
        location,
        imageUrl,
        createdAt: serverTimestamp(),
        likes: 0,
        comments: [],
      });

      router.push("/home");
    } catch (error) {
      console.error("Error posting:", error);
      alert("Failed to post. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex justify-center">
      <div className="max-w-3xl w-full mx-auto mt-7 mb-40 p-4 flex flex-col items-center">
        <Card className="w-full shadow-lg rounded-3xl p-6">
          <CardHeader>
            <CardTitle className="text-start text-3xl text-primary font-bold">
              Create Post
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="caption">Caption</Label>
                <Textarea
                  id="caption"
                  placeholder="Write a caption..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="location">Location (Optional)</Label>
                <Input
                  id="location"
                  type="text"
                  placeholder="Enter location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="image">Upload Image (Optional)</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImage(e.target.files?.[0] || null)}
                  className="mt-1"
                />
              </div>

              <Button
                onClick={handlePost}
                disabled={loading}
                className="px-6 py-6 rounded-2xl text-base w-full"
              >
                {loading ? "Posting..." : "Post"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
