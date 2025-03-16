"use client";

import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/app/provider";
import Image from "next/image";
import { Heart, MessageSquare, Bell, Book } from "lucide-react";

const NotificationsPage = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNotifications(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <div className="flex flex-col items-center py-10 px-4 max-w-2xl mx-auto">
      {/* Logo */}
      <Image src="/logo.png" alt="iHere Logo" width={120} height={120} />

      <div className="my-5 flex flex-col justify-start items-start w-full">
        {/* Header */}
        <h2 className="text-2xl font-semibold text-gray-900 mt-4 mb-6">
          Notifications
        </h2>

        {/* Notification List */}
        {notifications.length > 0 ? (
          <div className="w-full space-y-4">
            {notifications.map((notif) => {
              // Determine notification type
              const isLike = notif.message.includes("liked");
              const isComment = notif.message.includes("commented");
              const isBooked = notif.type === "booking"; // Check for booking notification

              return (
                <div
                  key={notif.id}
                  className="py-4 border-b-gray-100 border-b-2 flex items-start gap-3"
                >
                  {/* Icon */}
                  <div className="text-primary">
                    {isLike ? (
                      <Heart className="w-5 h-5" />
                    ) : isComment ? (
                      <MessageSquare className="w-5 h-5" />
                    ) : isBooked ? (
                      <Book className="w-5 h-5" />
                    ) : null}
                  </div>

                  {/* Notification Content */}
                  <div>
                    <p className="text-primary font-semibold text-lg">
                      {isLike
                        ? "You received a new like"
                        : isComment
                        ? "You received a new comment"
                        : isBooked
                        ? "You have been booked!"
                        : "New notification"}
                    </p>
                    <p className="text-gray-600 text-sm mt-1">
                      {notif.message}
                    </p>
                    <p className="text-gray-400 text-xs mt-2">
                      {new Date(
                        notif.createdAt?.seconds * 1000
                      ).toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="w-full flex flex-col items-center justify-center text-gray-300 py-16 sm:py-20 lg:py-28 gap-3">
            <Bell className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 text-gray-300" />
            <p className="mt-4 text-xl sm:text-2xl lg:text-3xl font-semibold text-gray-400">
              No notifications yet
            </p>
            <p className="text-base sm:text-lg lg:text-xl text-gray-400 text-center max-w-md">
              Stay tuned! You'll see updates here when someone interacts with
              your posts.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
