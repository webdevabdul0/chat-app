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
import { Heart, MessageSquareMore } from "lucide-react";
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
  const [modalOpen, setModalOpen] = useState(false);
  const [comments, setComments] = useState([]);

  useEffect(() => {
    if (user) {
      setLiked(
        Array.isArray(post.likes) ? post.likes.includes(user.uid) : false
      );
    }
  }, [post.likes, user]);

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
    const q = query(commentsRef, orderBy("createdAt", "desc")); // 🔹 Fetch newest comments first

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setComments(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe();
  }, [post.id]);

  const toggleLike = async () => {
    if (!user) return;

    const likeRef = doc(db, "posts", post.id, "likes", user.uid);
    const likeDoc = await getDoc(likeRef);

    try {
      if (likeDoc.exists()) {
        // Unlike (Delete document)
        await deleteDoc(likeRef);
        setLiked(false);
        setLikeCount((prev) => prev - 1);
      } else {
        // Like (Create document)
        await setDoc(likeRef, {
          userId: user.uid,
          createdAt: serverTimestamp(),
        });

        setLiked(true);
        setLikeCount((prev) => prev + 1);

        // 🔔 Send notification if liking someone else's post
        if (post.userId !== user.uid) {
          await addDoc(collection(db, "notifications"), {
            userId: post.userId,
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
                  {" "}
                  {/* Ensures menu stays open */}
                  <DropdownMenuTrigger asChild>
                    <MoreVertical className="w-5 h-5 text-gray-600" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {/* AlertDialog for Confirmation */}
                    <AlertDialog open={open} onOpenChange={setOpen}>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem
                          className="text-red-500 flex items-center space-x-2"
                          onSelect={(e) => e.preventDefault()} // Prevent closing menu
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
        </div>
      </div>

      {/*This is a Section Breaker */}
      <div className="w-full h-px bg-black/5 my-5"></div>

      <p className="text-foreground text-lg font-semibold my-5">
        {post.caption}
      </p>

      {post.imageUrl && (
        <>
          <div
            className="w-full relative overflow-hidden cursor-pointer"
            onClick={() => setPreviewImage(post.imageUrl)}
          >
            <Image
              src={post.imageUrl}
              alt="Post Image"
              width={500}
              height={500}
              className="w-full h-auto rounded-lg"
            />
          </div>

          {/* Image Preview with Backdrop */}
          {previewImage && (
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
          className="flex items-center gap-2 p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition"
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
          <span className="text-sm font-medium">{likeCount}</span>
        </button>

        {/* Comments Button with Modal */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogTrigger className="flex items-center gap-2 p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition">
            <motion.div
              animate={{ scale: 1.2 }}
              transition={{ type: "spring", stiffness: 300, damping: 10 }}
            >
              <MessageSquareMore className="w-6 h-6 text-black" />
            </motion.div>
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
      </div>

      {/* Inline Comments Preview */}
      <div className="mt-4">
        {/*This is a Section Breaker */}
        <div className="w-full h-px bg-black/5 my-5"></div>
        {previewComments.map((comment) => (
          <div
            key={comment.id}
            className="flex gap-2 items-start pb-2 text-sm text-black/60 font-semibold"
          >
            <p>{comment.text}</p>
          </div>
        ))}

        {/* View All Comments Button (Opens Modal) */}
        {comments.length > 2 && (
          <button
            onClick={() => setModalOpen(true)}
            className="text-primar  text-sm font-semibold mt-2 flex items-center gap-1"
          >
            <MessageSquareMore className="w-5 h-5" /> View All Comments (
            {comments.length})
          </button>
        )}

        <div className="mt-4">
          <CommentSection postId={post.id} />
        </div>
      </div>
    </div>
  );
};

export default Post;
