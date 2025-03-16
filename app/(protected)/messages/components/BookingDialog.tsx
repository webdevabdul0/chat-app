"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  collection,
} from "firebase/firestore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { useAuth } from "@/app/provider";
import { toast } from "react-hot-toast";
import { Book, Eye, Trash2 } from "lucide-react";

export default function BookingDialog({
  recipientId,
}: {
  recipientId: string;
}) {
  const { user: currentUser } = useAuth();
  const [jobTitle, setJobTitle] = useState("");
  const [date, setDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isBooked, setIsBooked] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<any>(null);

  useEffect(() => {
    const checkBooking = async () => {
      if (!currentUser) return;

      try {
        const bookingRef = doc(
          db,
          "bookings",
          `${currentUser.uid}_${recipientId}`
        );
        console.log("Checking booking for:", bookingRef.path);

        const bookingSnap = await getDoc(bookingRef);

        if (bookingSnap.exists()) {
          const data = bookingSnap.data();
          console.log("Booking Data:", data);

          setIsBooked(true);
          setBookingDetails({
            ...data,
            date: data.date?.seconds
              ? new Date(data.date.seconds * 1000)
              : null, // ✅ Convert Firestore Timestamp
          });
        } else {
          console.log("No booking found.");
          setIsBooked(false);
          setBookingDetails(null);
        }
      } catch (error) {
        console.error("Error fetching booking:", error);
      }
    };

    checkBooking();
  }, [currentUser, recipientId]);

  const handleBooking = async () => {
    if (!currentUser || !recipientId || !jobTitle || !date) {
      toast.error("Please fill all fields.");
      return;
    }

    try {
      setLoading(true);
      const bookingRef = doc(
        db,
        "bookings",
        `${currentUser.uid}_${recipientId}`
      );
      await setDoc(bookingRef, {
        bookedBy: currentUser.uid,
        bookedUser: recipientId,
        jobTitle,
        date: Timestamp.fromDate(date),
        createdAt: serverTimestamp(),
      });

      // ✅ Send notification to the booked user
      const notificationRef = doc(collection(db, "notifications"));
      await setDoc(notificationRef, {
        userId: recipientId, // The booked user should receive this
        message: `You have been booked for "${jobTitle}" on ${date.toDateString()}`,
        createdAt: serverTimestamp(),
        type: "booking", // Optional: Can help filter notifications later
      });

      toast.success("Booking successful!");
      setIsBooked(true);
      setBookingDetails({ jobTitle, date });
      setIsOpen(false);
    } catch (error) {
      console.error("Error booking user:", error);
      toast.error("Failed to book. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBooking = async () => {
    if (!currentUser) return;

    try {
      const bookingRef = doc(
        db,
        "bookings",
        `${currentUser.uid}_${recipientId}`
      );
      await deleteDoc(bookingRef);

      toast.success("Booking deleted!");
      setIsBooked(false);
      setBookingDetails(null);
    } catch (error) {
      console.error("Error deleting booking:", error);
      toast.error("Failed to delete booking. Try again.");
    }
  };

  return (
    <>
      {isBooked ? (
        // If already booked, show "View Booking" button
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="flex items-center gap-3 p-3 sm:p-6 rounded-2xl text-base font-medium transition border-primary text-primary"
            >
              <Eye size={24} /> View Booking
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Booking Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p>
                <span className="font-semibold">Job Title:</span>{" "}
                {bookingDetails?.jobTitle}
              </p>
              <p>
                <span className="font-semibold">Date:</span>{" "}
                {bookingDetails?.date
                  ? bookingDetails.date.toDateString()
                  : "No date found"}
              </p>
              <Button
                onClick={handleDeleteBooking}
                variant="destructive"
                className="flex items-center gap-3 p-3 sm:p-6 rounded-2xl text-base font-medium transition"
              >
                <Trash2 size={24} /> Delete Booking
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      ) : (
        // If not booked, show "Book" button
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="flex items-center gap-3 p-3 sm:p-6 rounded-2xl text-base font-medium transition border-primary text-primary"
            >
              <Book size={24} /> Book
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Book This User</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Job Title / Description"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
              />
              <div>
                <p className="text-sm font-semibold">Select the booking date</p>
                <div className="flex justify-center">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="w-full"
                  />
                </div>
              </div>
              <Button
                onClick={handleBooking}
                disabled={loading}
                className="w-full"
              >
                {loading ? "Booking..." : "Confirm Booking"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
