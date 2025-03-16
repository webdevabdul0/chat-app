"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const AnnouncementPopup = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const hasSeenAnnouncement = localStorage.getItem("announcement_seen");
    if (!hasSeenAnnouncement) {
      setOpen(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem("announcement_seen", "true");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md p-6 text-center">
        <DialogHeader>
          <DialogTitle>🚀 Exciting News!</DialogTitle>
        </DialogHeader>
        <p className="text-gray-700">
          We have launched a new feature! Check it out now.
        </p>
        <Button onClick={handleClose} className="mt-4">
          Got it!
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default AnnouncementPopup;
