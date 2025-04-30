"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

import { useAuth } from "@/app/provider";
import { db, storage } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageIcon, VideoIcon, PencilIcon, Trash2Icon, MusicIcon } from "lucide-react";

type MediaFile = File | null;

export default function PostInput() {
  const [text, setText] = useState("");
  const [media, setMedia] = useState<MediaFile>(null);
  const [mediaUrl, setMediaUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setMedia(file);
  };

  const handlePost = async () => {
    if (!text.trim() && !media) return alert("Post content is required!");
    if (!user) return alert("You must be logged in to post.");

    setUploading(true);

    try {
      let uploadedUrl = "";

      // Upload media if exists
      if (media) {
        const mediaRef = ref(
          storage,
          `posts/${user.uid}/${Date.now()}_${media.name}`
        );
        const uploadTask = uploadBytesResumable(mediaRef, media);

        // Wait for the upload to finish
        await new Promise<void>((resolve, reject) => {
          uploadTask.on(
            "state_changed",
            null,
            (error) => reject(error),
            async () => {
              uploadedUrl = await getDownloadURL(uploadTask.snapshot.ref);
              resolve();
            }
          );
        });
      }

      // Store post data in Firestore
      await addDoc(collection(db, "posts"), {
        userId: user.uid,
        caption: text,
        imageUrl: uploadedUrl,
        mediaType: media
          ? media.type.startsWith("video")
            ? "video"
            : media.type.startsWith("audio")
            ? "audio"
            : "image"
          : null,
        createdAt: serverTimestamp(),
      });

      // Reset form
      setText("");
      setMedia(null);
      setMediaUrl("");
    } catch (error) {
      console.error("Error posting:", error);
      alert("Failed to post. Try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full shadow-md rounded-2xl p-4 flex flex-col space-y-4">
      <Textarea
        placeholder="What's on your mind?"
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full border-none text-sm sm:text-lg md:text-lg"
      />

      {/* Media Preview */}
      {media && (
        <div className="relative mt-2">
          {media.type.startsWith("image") ? (
            <img
              src={URL.createObjectURL(media)}
              alt="Preview"
              className="w-full h-full object-cover rounded-lg"
            />
          ) : media.type.startsWith("video") ? (
            <video controls className="w-full h-48 rounded-lg">
              <source src={URL.createObjectURL(media)} type={media.type} />
            </video>
          ) : media.type.startsWith("audio") ? (
            <div className="w-full p-4 bg-gray-100 rounded-lg">
              <audio controls className="w-full">
                <source src={URL.createObjectURL(media)} type={media.type} />
                Your browser does not support the audio element.
              </audio>
            </div>
          ) : null}

          {/* Edit & Remove Media Icons */}
          <div className="absolute top-2 right-2 flex space-x-4 bg-black bg-opacity-50 p-2 rounded-lg">
            {/* Edit Icon */}
            <Label htmlFor="media-upload" className="cursor-pointer">
              <PencilIcon className="w-6 h-6 text-white hover:text-gray-300" />
            </Label>
            <Input
              id="media-upload"
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={handleMediaChange}
            />

            {/* Remove Icon */}
            <Trash2Icon
              className="w-6 h-6 text-white cursor-pointer hover:text-red-500"
              onClick={() => setMedia(null)}
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        {/* Media Upload Icons */}
        <div className="flex space-x-4 text-gray-500">
          {/* Image Upload */}
          <Label htmlFor="image-upload">
            <ImageIcon className="w-6 h-6 cursor-pointer hover:text-blue-500" />
          </Label>
          <Input
            id="image-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleMediaChange}
          />

          {/* Video Upload */}
          <Label htmlFor="video-upload">
            <VideoIcon className="w-6 h-6 cursor-pointer hover:text-green-500" />
          </Label>
          <Input
            id="video-upload"
            type="file"
            accept="video/*"
            className="hidden"
            onChange={handleMediaChange}
          />

          {/* Music Upload */}
          <Label htmlFor="music-upload">
            <MusicIcon className="w-6 h-6 cursor-pointer hover:text-purple-500" />
          </Label>
          <Input
            id="music-upload"
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={handleMediaChange}
          />
        </div>

        {/* Post Button */}
        <Button
          onClick={handlePost}
          disabled={uploading || (!text.trim() && !media)}
          className="px-4 py-2 rounded-lg"
        >
          {uploading ? "Posting..." : "Post"}
        </Button>
      </div>
    </div>
  );
}
