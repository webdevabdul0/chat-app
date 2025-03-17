"use client";
import { useState, useEffect } from "react";
import {
  doc,
  setDoc,
  getDoc,
  addDoc,
  serverTimestamp,
  collection,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  increment,
  arrayRemove,
  arrayUnion,
  getDocs,
  where,
} from "firebase/firestore";
import { deleteDoc } from "firebase/firestore";
import { deleteObject, ref } from "firebase/storage";
import { storage } from "@/lib/firebase"; // Adjust based on your setup
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { db } from "@/lib/firebase";
import { useAuth } from "@/app/provider";
import CommentSection from "./CommentSection";
import CommentsList from "./CommentsList";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";
import { Heart, MessageSquareMore, Pencil } from "lucide-react";
import { Timestamp } from "firebase/firestore";
import { Trash2, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"; // For hiding the title visually
import { motion } from "framer-motion";
import { X } from "lucide-react";
import EditPost from "./EditPostPopup";
import ShareButton from "./ShareButton";

const Post = ({ post }) => {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);

  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [toastOpen, setToastOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes?.length || 0);
  const [postOwner, setPostOwner] = useState<{
    username: string;
    profilePic?: string;
    fullName: string;
  } | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const [isEditOpen, setIsEditOpen] = useState(false);

  const openEditModal = () => setIsEditOpen(true);
  const closeEditModal = () => setIsEditOpen(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [comments, setComments] = useState([]);

  useEffect(() => {
    const likesRef = collection(db, "posts", post.id, "likes");

    const unsubscribe = onSnapshot(likesRef, (snapshot) => {
      setLikeCount(snapshot.size);
      setLiked(snapshot.docs.some((doc) => doc.id === user?.uid));
    });

    return () => unsubscribe();
  }, [post.id, user]);

  useEffect(() => {
    const fetchPostOwner = async () => {
      if (post.userId) {
        const userRef = doc(db, "users", post.userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          setPostOwner(userSnap.data());
        }
      }
    };

    fetchPostOwner();
  }, [post.userId]);

  // 🔥 FIX: Fetch Comments in Real-Time Using onSnapshot
  useEffect(() => {
    const commentsRef = collection(db, "posts", post.id, "comments");
    const q = query(commentsRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const commentsData = await Promise.all(
        snapshot.docs.map(async (commentDoc) => {
          const commentData = commentDoc.data();
          const userRef = doc(db, "users", commentData.userId);
          const userSnap = await getDoc(userRef);

          return {
            id: commentDoc.id,
            ...commentData,
            user: userSnap.exists() ? userSnap.data() : null,
          };
        })
      );

      setComments(commentsData);
    });

    return () => unsubscribe();
  }, [post.id]);

  const toggleLike = async () => {
    if (!user) return;

    const likeRef = doc(db, "posts", post.id, "likes", user.uid);
    const notificationQuery = query(
      collection(db, "notifications"),
      where("userId", "==", post.userId),
      where("senderId", "==", user.uid),
      where("postId", "==", post.id)
    );

    try {
      const likeSnap = await getDoc(likeRef);

      if (likeSnap.exists()) {
        // Unlike: Remove like document
        await deleteDoc(likeRef);
        setLiked(false);
        setLikeCount((prev) => prev - 1);

        // Remove the notification if it exists
        const notificationSnap = await getDocs(notificationQuery);
        notificationSnap.forEach(async (doc) => {
          await deleteDoc(doc.ref);
        });
      } else {
        // Like: Create like document
        await setDoc(likeRef, {
          userId: user.uid,
          createdAt: new Date(),
        });
        setLiked(true);
        setLikeCount((prev) => prev + 1);

        // Send notification if it's someone else's post
        if (post.userId !== user.uid) {
          await addDoc(collection(db, "notifications"), {
            userId: post.userId, // Post owner
            senderId: user.uid, // User who liked
            postId: post.id, // Post reference
            message: `${user.displayName} liked your post: "${post.caption}".`,
            createdAt: serverTimestamp(),
          });
        }
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const previewComments = comments.slice(0, 2); // 🔹 Shows the latest 2 comments

  const onDelete = async () => {
    if (!post?.id) {
      toast.error("Error: Post ID is missing!");
      return;
    }

    console.log("Post object before deletion:", post); // Debugging log

    try {
      // 🔥 Delete image first if it exists
      if (post.imageUrl) {
        console.log("Deleting image from storage:", post.imageUrl);
        await deleteObject(ref(storage, post.imageUrl));
        console.log("Image deleted successfully");
      } else {
        console.log("No image found for this post.");
      }

      // 🗑️ Now delete the post document from Firestore
      await deleteDoc(doc(db, "posts", post.id));
      console.log("Post deleted from Firestore");

      // ✅ Success notification
      toast.success("Post deleted successfully!");
      setToastOpen(false);
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error(`Error deleting post: ${error.message}`);
    }
  };

  return (
    <div className="p-5 bg-secondary border-black/10 rounded-3xl w-full">
      {/* Post Owner Info */}
      <div className="flex justify-between items-center ">
        {/* Post Owner Info */}
        {postOwner && (
          <div className="flex items-center space-x-2">
            <Avatar className="w-10 h-10">
              {postOwner.profilePic ? (
                <AvatarImage
                  src={postOwner.profilePic}
                  alt={postOwner.username}
                />
              ) : (
                <AvatarFallback className="bg-primary text-white">
                  {postOwner.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
            <div>
              <Link
                href={`/profile/${post.userId}`}
                className="text-black/90 hover:text-black/80"
              >
                <p className="text-black font-semibold text-base">
                  {postOwner.fullName}
                </p>
              </Link>
              <p className="text-sm text-gray-500">@{postOwner.username}</p>
            </div>
          </div>
        )}

        {/* Post Date & 3-dot menu */}
        <div className="flex items-center space-x-3">
          {/* Post Created At */}

          <p className="text-sm text-gray-500">
            {post.createdAt instanceof Timestamp
              ? post.createdAt.toDate().toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : new Date(post.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
          </p>
          {/* 3-dot menu (Only for post owner) */}
          {postOwner && (
            <>
              {String(user?.uid) === String(post?.userId) && (
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <MoreVertical className="w-5 h-5 text-gray-600" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {/* Edit Post Button */}
                    <DropdownMenuItem
                      className="flex items-center space-x-2"
                      onClick={() => setIsEditOpen(true)} // Open edit modal
                    >
                      <Pencil className="w-5 h-5" />
                      <span>Edit</span>
                    </DropdownMenuItem>

                    {/* Delete Post Button */}
                    <AlertDialog open={open} onOpenChange={setOpen}>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem
                          className="text-red-500 flex items-center space-x-2"
                          onSelect={(e) => e.preventDefault()}
                        >
                          <Trash2 className="w-5 h-5" />
                          <span>Delete</span>
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently
                            delete your post.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel onClick={() => setOpen(false)}>
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={onDelete}
                            className="bg-red-500 text-white"
                          >
                            Yes, Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </>
          )}

          {/* Edit Post Dialog */}
          <EditPost
            postId={post.id}
            isOpen={isEditOpen}
            onClose={closeEditModal}
          />
        </div>
      </div>

      {/*This is a Section Breaker */}
      <div className="w-full h-px bg-black/5 my-5"></div>

      <p className="text-foreground text-lg font-semibold my-5">
        {post.caption}
      </p>

      {post.imageUrl && post.imageUrl.trim() !== "" && (
        <>
          <div
            className="w-full relative overflow-hidden cursor-pointer"
            onClick={() =>
              post.mediaType === "image" && setPreviewImage(post.imageUrl)
            }
          >
            {post.mediaType === "image" ? (
              <Image
                src={post.imageUrl}
                alt="Post Image"
                width={500}
                height={500}
                className="w-full h-auto rounded-lg"
              />
            ) : (
              <video
                src={post.imageUrl}
                autoPlay
                playsInline // Prevents full-screen behavior on mobile
                controls
                muted
                className="w-full h-auto rounded-lg max-h-[500px]"
              />
            )}
          </div>

          {/* Image Preview with Backdrop */}
          {previewImage && previewImage.trim() !== "" && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex justify-center items-center z-50">
              {/* Close Button */}
              <button
                onClick={() => setPreviewImage(null)}
                className="absolute top-5 right-5 p-2 bg-white/30 rounded-full"
              >
                <X className="w-6 h-6 text-white" />
              </button>

              {/* Full Image Display */}
              <img
                src={previewImage}
                alt="Preview"
                className="max-w-full max-h-screen object-contain rounded-lg"
              />
            </div>
          )}
        </>
      )}

      <div className="flex items-center space-x-2 mt-4">
        <button
          onClick={toggleLike}
          className="flex items-center gap-2 p-2 rounded-full "
        >
          <motion.div
            animate={{ scale: liked ? 1.2 : 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 10 }}
          >
            {liked ? (
              <Heart className="w-6 h-6 text-red-500 fill-red-500" />
            ) : (
              <Heart className="w-6 h-6 text-black" />
            )}
          </motion.div>
          {/*<span className="text-sm font-medium">Like</span>*/}
        </button>

        {/* Comments Button with Modal */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogTrigger className="flex items-center gap-2 p-2 rounded-full ">
            <MessageSquareMore className="w-7 h-7 text-black" />
          </DialogTrigger>

          <DialogContent>
            <DialogTitle>
              <VisuallyHidden>Comments Section</VisuallyHidden>
            </DialogTitle>

            <h2 className="text-lg font-semibold">All Comments</h2>
            <CommentSection postId={post.id} />
            <CommentsList postId={post.id} />
          </DialogContent>
        </Dialog>

        <ShareButton
          text={`📢 Shared a post with you by ${
            postOwner?.fullName || "someone"
          }: "${post.caption}"`}
          attachments={
            post.imageUrl
              ? [
                  {
                    type: post.mediaType || "image",
                    ...(post.mediaType === "video"
                      ? { asset_url: post.imageUrl }
                      : { image_url: post.imageUrl }),
                  },
                ]
              : []
          }
          postId={post.id} // 🔥 Add this!
        />
      </div>

      {/* Inline Comments Preview */}
      <div className="mt-4">
        <div className="w-full h-px bg-black/5 my-5"></div>
        {previewComments.map((comment) => (
          <div key={comment.id} className="flex items-start gap-2 pb-2">
            {/* Avatar */}
            <Avatar className="w-8 h-8">
              {comment.user?.profilePic ? (
                <AvatarImage
                  src={comment.user.profilePic}
                  alt={comment.user.fullName}
                />
              ) : (
                <AvatarFallback className="bg-primary text-white">
                  {comment.user?.username?.charAt(0).toUpperCase() || "?"}
                </AvatarFallback>
              )}
            </Avatar>

            <div>
              {/* Username */}
              <p className="text-sm font-semibold">
                {comment.user?.fullName || "Unknown User"}
              </p>
              {/* Comment Text */}
              <p className="text-sm text-black/70">{comment.text}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <CommentSection postId={post.id} />
      </div>
    </div>
  );
};

export default Post;
