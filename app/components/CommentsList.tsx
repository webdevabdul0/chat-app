import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const CommentsList = ({ postId }) => {
  const [comments, setComments] = useState([]);

  useEffect(() => {
    const q = query(
      collection(db, "posts", postId, "comments"),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setComments(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe();
  }, [postId]);

  return (
    <div className="mt-2 space-y-2">
      {comments.map((comment) => (
        <Card
          key={comment.id}
          className="flex items-start space-x-3 p-3 bg-gray-100 shadow-sm hover:shadow-md transition rounded-xl"
        >
          {/* User Avatar (Placeholder for now) */}
          <Avatar>
            <AvatarFallback className="bg-primary text-white">U</AvatarFallback>
          </Avatar>

          {/* Comment Content */}
          <div className="flex-1">
            <p className="text-gray-900 text-sm">{comment.text}</p>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default CommentsList;
