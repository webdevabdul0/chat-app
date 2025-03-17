"use client";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  deleteDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase"; // Make sure to import `auth`
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trash } from "lucide-react"; // Import the Trash icon from Lucide React

const CommentsList = ({ postId }) => {
  const [comments, setComments] = useState([]);

  useEffect(() => {
    const q = query(
      collection(db, "posts", postId, "comments"),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const commentsData = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const comment = { id: docSnap.id, ...docSnap.data() };

          // Fetch user details
          const userRef = doc(db, "users", comment.userId);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            return { ...comment, user: userSnap.data() };
          }
          return comment;
        })
      );

      setComments(commentsData);
    });

    return () => unsubscribe();
  }, [postId]);

  // Function to handle deleting a comment
  const handleDelete = async (commentId) => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    // Find the comment
    const commentToDelete = comments.find(
      (comment) => comment.id === commentId
    );

    if (commentToDelete?.userId === userId) {
      try {
        // Delete the comment from Firestore
        await deleteDoc(doc(db, "posts", postId, "comments", commentId));
      } catch (error) {
        console.error("Error deleting comment:", error);
      }
    } else {
      console.error("You can only delete your own comments.");
    }
  };

  return (
    <div className="mt-2 space-y-2">
      {comments.map((comment) => (
        <Card
          key={comment.id}
          className="flex items-start space-x-3 p-3 bg-gray-100 shadow-sm hover:shadow-md transition rounded-xl"
        >
          {/* User Avatar */}
          <Avatar>
            <AvatarImage src={comment.user?.profilePic || ""} />
            <AvatarFallback className="bg-primary text-white">
              {comment.user?.fullName?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>

          {/* Comment Content */}
          <div className="flex-1">
            {/* User Info */}
            <div className="flex items-center space-x-2">
              <span className="font-semibold">
                {comment.user?.fullName || "Unknown"}
              </span>
              <span className="text-gray-500 text-sm">
                @{comment.user?.username || "user"}
              </span>
            </div>

            {/* Comment Text */}
            <p className="text-gray-900 text-sm">{comment.text}</p>

            {/* Timestamp */}
            <span className="text-xs text-gray-400">
              {comment.createdAt?.seconds
                ? new Date(comment.createdAt.seconds * 1000).toLocaleString()
                : "Unknown time"}
            </span>
          </div>

          {/* Delete Icon (Trash Bin) */}
          {comment.userId === auth.currentUser?.uid && (
            <div
              className="ml-4 cursor-pointer"
              onClick={() => handleDelete(comment.id)}
            >
              <Trash className="text-gray-500 hover:text-red-500 transition" />
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};

export default CommentsList;
