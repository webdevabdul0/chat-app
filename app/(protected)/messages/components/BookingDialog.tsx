"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  query,
  where,
  doc,
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
import { Book, Eye, Trash2, Plus } from "lucide-react";

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
  const [bookings, setBookings] = useState<any[]>([]);

  // Fetch all bookings for this recipient
  useEffect(() => {
    const fetchBookings = async () => {
      if (!currentUser) return;
      try {
        const bookingsRef = collection(db, "bookings");
        const q = query(
          bookingsRef,
          where("bookedBy", "==", currentUser.uid),
          where("bookedUser", "==", recipientId)
        );
        const querySnapshot = await getDocs(q);
        const fetchedBookings = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date?.seconds
            ? new Date(doc.data().date.seconds * 1000)
            : null,
        }));
        setBookings(fetchedBookings);
      } catch (error) {
        console.error("Error fetching bookings:", error);
      }
    };

    fetchBookings();
  }, [currentUser, recipientId]);

  const handleBooking = async () => {
    if (!currentUser || !recipientId || !jobTitle || !date) {
      toast.error("Please fill all fields.");
      return;
    }

    try {
      setLoading(true);
      await addDoc(collection(db, "bookings"), {
        bookedBy: currentUser.uid,
        bookedUser: recipientId,
        jobTitle,
        date: Timestamp.fromDate(date),
        createdAt: serverTimestamp(),
      });

      // Send notification
      await addDoc(collection(db, "notifications"), {
        userId: recipientId,
        message: `You have been booked for "${jobTitle}" on ${date.toDateString()}`,
        createdAt: serverTimestamp(),
        type: "booking",
      });

      toast.success("Booking added!");
      setJobTitle("");
      setDate(null);

      // Refresh bookings
      setBookings((prev) => [
        ...prev,
        { jobTitle, date, id: Math.random().toString() }, // Temporary ID until refresh
      ]);
    } catch (error) {
      console.error("Error booking user:", error);
      toast.error("Failed to book. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    try {
      await deleteDoc(doc(db, "bookings", bookingId));
      toast.success("Booking deleted!");
      setBookings((prev) => prev.filter((b) => b.id !== bookingId));
    } catch (error) {
      console.error("Error deleting booking:", error);
      toast.error("Failed to delete booking. Try again.");
    }
  };

  return (
    <>
      {bookings.length > 0 ? (
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
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-semibold">{booking.jobTitle}</p>
                    <p className="text-sm">
                      {booking.date ? booking.date.toDateString() : "No date"}
                    </p>
                  </div>
                  <Button
                    onClick={() => handleDeleteBooking(booking.id)}
                    variant="destructive"
                    size="icon"
                  >
                    <Trash2 size={20} />
                  </Button>
                </div>
              ))}
              {/* Add Booking Button Inside the Dialog */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-3 w-full">
                    <Plus size={20} /> Add New Booking
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
                      <p className="text-sm font-semibold">
                        Select the booking date
                      </p>
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
            </div>
          </DialogContent>
        </Dialog>
      ) : (
        <Dialog>
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
