"use client";

import React, { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { useAuth } from "@/app/provider";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Loader } from "lucide-react";

const BookingsPage = () => {
  const { user: currentUser } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const fetchBookings = async () => {
      setLoading(true);
      try {
        const bookingsQuery = query(
          collection(db, "bookings"),
          where("bookedUser", "==", currentUser.uid) // ✅ Fetch bookings for the logged-in user
        );
        const bookingDocs = await getDocs(bookingsQuery);

        const bookingData = await Promise.all(
          bookingDocs.docs.map(async (docSnap) => {
            const data = docSnap.data();
            const bookerRef = doc(db, "users", data.bookedBy); // ✅ Fetch booker's details
            const bookerSnap = await getDoc(bookerRef);
            const bookerData = bookerSnap.exists() ? bookerSnap.data() : null;

            return {
              id: docSnap.id,
              jobTitle: data.jobTitle,
              date: data.date?.seconds
                ? new Date(data.date.seconds * 1000)
                : null,
              booker: bookerData,
            };
          })
        );

        setBookings(bookingData);
      } catch (error) {
        console.error("Error fetching bookings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [currentUser]);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Bookings You Have Received</h1>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <Loader className="animate-spin" size={32} />
        </div>
      ) : bookings.length === 0 ? (
        <p className="text-gray-500">No bookings yet.</p>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <Card key={booking.id} className="p-4 flex items-center gap-4">
              <Avatar className="w-12 h-12">
                <AvatarImage
                  src={booking.booker?.profilePic || "/default-avatar.png"}
                />
                <AvatarFallback>
                  {booking.booker?.name?.[0] || "?"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">
                  {booking.booker?.fullName || "Unknown User"}
                </p>
                <p className="text-sm text-gray-500">
                  @{booking.booker?.username || "unknown"}
                </p>
                <p className="mt-2 text-gray-700">
                  <span className="font-semibold">Job Title:</span>{" "}
                  {booking.jobTitle}
                </p>
                <p className="text-gray-700">
                  <span className="font-semibold">Date:</span>{" "}
                  {booking.date ? booking.date.toDateString() : "Unknown"}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default BookingsPage;
