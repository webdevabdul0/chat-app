"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db, storage } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { useAuth } from "@/app/provider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function EditPost({ postId, isOpen, onClose }) {
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [media, setMedia] = useState(null);
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState(""); // New state to track media type
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (postId) fetchPostDetails();
  }, [postId]);

  const fetchPostDetails = async () => {
    try {
      const postRef = doc(db, "posts", postId);
      const postSnap = await getDoc(postRef);
      if (postSnap.exists()) {
        const postData = postSnap.data();
        setCaption(postData.caption);
        setLocation(postData.location || "");
        setMediaUrl(postData.imageUrl || "");
        setMediaType(postData.mediaType || ""); // Fetch media type from DB
      }
    } catch (error) {
      console.error("Error fetching post:", error);
    }
  };

  const handleMediaUpload = async () => {
    if (!media) return mediaUrl; // If no new file, keep the existing one

    const fileType = media.type.startsWith("image/") ? "image" : "video";

    // Delete old media if exists
    if (mediaUrl) {
      const oldMediaRef = ref(storage, mediaUrl);
      await deleteObject(oldMediaRef).catch(() => {});
    }

    // Upload new media
    const newMediaRef = ref(storage, `posts/${user.uid}/${Date.now()}`);
    await uploadBytes(newMediaRef, media);
    const newMediaUrl = await getDownloadURL(newMediaRef);

    setMediaType(fileType); // Update mediaType
    return newMediaUrl;
  };

  const handleEditPost = async () => {
    if (!caption.trim()) return alert("Caption is required");
    setLoading(true);
    try {
      const newMediaUrl = await handleMediaUpload();

      const postRef = doc(db, "posts", postId);
      await updateDoc(postRef, {
        caption,
        location,
        imageUrl: newMediaUrl,
        mediaType, // Save mediaType
      });

      onClose();
      router.refresh();
    } catch (error) {
      console.error("Error updating post:", error);
      alert("Failed to update post. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Post</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="caption">Caption</Label>
            <Textarea
              id="caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="location">Location (Optional)</Label>
            <Input
              id="location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="media">Upload New Image/Video (Optional)</Label>
            <Input
              id="media"
              type="file"
              accept="image/*,video/*"
              onChange={(e) => setMedia(e.target.files?.[0] || null)}
            />
            {mediaUrl &&
              (mediaType === "image" ? (
                <img
                  src={mediaUrl}
                  alt="Post Media"
                  className="mt-2 rounded-lg w-full h-48 object-cover"
                />
              ) : (
                <video
                  src={mediaUrl}
                  controls
                  className="mt-2 rounded-lg w-full h-40 sm:h-full object-cover"
                />
              ))}
          </div>
          <Button
            onClick={handleEditPost}
            disabled={loading}
            className="w-full"
          >
            {loading ? "Updating..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
