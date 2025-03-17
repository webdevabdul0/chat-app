"use client";
import { useState, useRef } from "react";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/app/provider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Smile } from "lucide-react";
import { motion } from "framer-motion";
import Picker from "@emoji-mart/react"; // Import emoji picker

const CommentSection = ({ postId }) => {
  const { user } = useAuth();
  const [comment, setComment] = useState("");
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const inputRef = useRef(null);

  const handleComment = async () => {
    if (!user || !comment.trim()) return;

    const postRef = doc(db, "posts", postId);
    const postDoc = await getDoc(postRef);
    const postOwnerId = postDoc.data()?.userId;

    await addDoc(collection(db, "posts", postId, "comments"), {
      userId: user.uid,
      text: comment,
      createdAt: serverTimestamp(),
    });

    // Fetch user details
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists() && postOwnerId !== user.uid) {
      const userData = userSnap.data();

      // Save notification
      await addDoc(collection(db, "notifications"), {
        userId: postOwnerId,
        message: `${userData.username} commented '${comment}' on your post: "${
          postDoc.data().caption
        }".`,
        createdAt: serverTimestamp(),
      });
    }

    setComment("");
  };

  // Function to insert emoji into input field
  const addEmoji = (emoji) => {
    setComment((prev) => prev + emoji.native); // Append emoji
    setEmojiPickerOpen(false); // Close picker after selection
  };

  return (
    <div className="relative flex items-center space-x-2 w-full">
      {/* Input Field */}
      <div className="relative flex-1">
        <Input
          ref={inputRef}
          type="text"
          placeholder="Write a comment..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="pr-12"
        />
        {/* Emoji Icon */}

        <div className="hidden sm:block">
          <motion.div
            whileTap={{ scale: 0.8 }}
            whileHover={{ scale: 1.2 }}
            transition={{ type: "spring", stiffness: 300, damping: 10 }}
            className="absolute right-3 top-1/3 transform cursor-pointer text-gray-400"
            onClick={() => setEmojiPickerOpen((prev) => !prev)}
          >
            <Smile />
          </motion.div>
        </div>
        {/* Emoji Picker Dropdown */}
        {emojiPickerOpen && (
          <div className="absolute bottom-12 right-0 z-50">
            <Picker onEmojiSelect={addEmoji} theme="light" />
          </div>
        )}
      </div>

      {/* Comment Button */}
      <Button
        onClick={handleComment}
        className="bg-primary hover:bg-primary/90 p-5 rounded-2xl"
      >
        Comment
      </Button>
    </div>
  );
};

export default CommentSection;
