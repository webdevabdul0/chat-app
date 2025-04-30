import React, { useState, useRef } from "react";
import { X } from "lucide-react";
import { useAuth } from "@/app/provider"; // Firebase auth context
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { deleteUser, updateProfile } from "firebase/auth";
import {
  doc,
  updateDoc,
  deleteDoc,
  query,
  getDocs,
  collection,
  where,
} from "firebase/firestore";
import { auth, db, storage } from "@/lib/firebase"; // Firebase config
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";

const SettingsPopup = ({ onClose }) => {
  const { userData, logout } = useAuth(); // Auth context
  const [openDialog, setOpenDialog] = useState(null); // Track which dialog is open

  const [form, setForm] = useState({
    fullName: userData?.fullName || "",
    email: userData?.email || "",
    username: userData?.username || "",
    location: userData?.location || "",
    profilePic: userData?.profilePic,
    description: userData?.description || "",
  });

  const fileInputRef = useRef(null);
  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const [loading, setLoading] = useState(false);

  const handleAction = async (action) => {
    setOpenDialog(null); // Close dialog before executing action
    setLoading(true);
    try {
      await action();
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle input change
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  // Save changes to Firebase Firestore
  const handleSave = async () => {
    if (!auth.currentUser) {
      console.error("User not authenticated");
      return;
    }

    setLoading(true);
    try {
      const userId = auth.currentUser.uid; // ✅ Get UID from Firebase Auth

      const userDocRef = doc(db, "users", userId);
      await updateDoc(userDocRef, {
        fullName: form.fullName,
        username: form.username,
        location: form.location,
        description: form.description,
        profilePicture: userData?.profilePicture || "/default-avatar.jpg",
      });

      // Update Firebase Auth Profile
      await updateProfile(auth.currentUser, { displayName: form.fullName });

      // Refresh UI with new user data
      onClose();
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const [imageUploading, setImageUploading] = useState(false);

  const resizeToSquare = (file, size) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          // Set canvas size
          canvas.width = size;
          canvas.height = size;

          // Get smaller side to center-crop
          const minSize = Math.min(img.width, img.height);
          const sx = (img.width - minSize) / 2;
          const sy = (img.height - minSize) / 2;

          // Draw cropped and resized image
          ctx.drawImage(img, sx, sy, minSize, minSize, 0, 0, size, size);

          // Convert canvas to blob
          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error("Canvas is empty"));
              return;
            }
            resolve(blob);
          }, "image/jpeg");
        };
        img.onerror = reject;
        img.src = event.target.result;
      };

      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImageUploading(true);
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    try {
      // Convert to square image
      const squareImageBlob = await resizeToSquare(file, 256); // 256x256 size

      // Upload to Firebase Storage
      const storageRef = ref(storage, `profilePictures/${userId}`);
      const uploadTask = uploadBytesResumable(storageRef, squareImageBlob);

      uploadTask.on(
        "state_changed",
        null,
        (error) => {
          console.error("Upload error:", error);
          setImageUploading(false);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

          // Update Firestore and Firebase Auth Profile
          const userDocRef = doc(db, "users", userId);
          await updateDoc(userDocRef, { profilePic: downloadURL });
          await updateProfile(auth.currentUser, { photoURL: downloadURL });

          setForm((prev) => ({ ...prev, profilePic: downloadURL }));
          setImageUploading(false);
        }
      );
    } catch (error) {
      console.error("Image processing error:", error);
      setImageUploading(false);
    }
  };

  // Handle user logout
  const handleLogout = async () => {
    await logout();
    onClose(); // Close popup after logout
  };

  const [errors, setErrors] = useState({ username: "" });

  const validateUsername = () => {
    if (!form.username.trim()) {
      setErrors((prev) => ({ ...prev, username: "Username is required" }));
    } else if (form.username.length < 3) {
      setErrors((prev) => ({
        ...prev,
        username: "Username must be at least 3 characters",
      }));
    } else if (!/^[a-zA-Z0-9_]+$/.test(form.username)) {
      setErrors((prev) => ({
        ...prev,
        username: "Username can only contain letters, numbers, and underscores",
      }));
    } else {
      setErrors((prev) => ({ ...prev, username: "" }));
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    if (!auth.currentUser) return;
    setLoading(true);

    try {
      const userId = auth.currentUser.uid;

      // Delete user's posts
      const postsQuery = query(
        collection(db, "posts"),
        where("userId", "==", userId)
      );
      const postsSnapshot = await getDocs(postsQuery);
      const postDeletePromises = postsSnapshot.docs.map((doc) =>
        deleteDoc(doc.ref)
      );

      // Delete user's notifications
      const notificationsQuery = query(
        collection(db, "notifications"),
        where("userId", "==", userId)
      );
      const notificationsSnapshot = await getDocs(notificationsQuery);
      const notificationDeletePromises = notificationsSnapshot.docs.map((doc) =>
        deleteDoc(doc.ref)
      );

      // Execute all delete operations
      await Promise.all([...postDeletePromises, ...notificationDeletePromises]);

      // Delete user document from Firestore
      await deleteDoc(doc(db, "users", userId));

      // Delete user from Firebase Authentication
      await deleteUser(auth.currentUser);

      // Ensure complete logout
      await logout();
    } catch (error) {
      console.error("Error deleting account:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-2xl shadow-lg w-[600px] max-w-full p-6 relative">
        {/* Close Button */}
        <button
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          <X size={24} />
        </button>

        {/* Header */}
        <h2 className="text-2xl font-semibold mb-4">Settings</h2>

        {/* User Profile Section */}
        <div className="flex flex-col items-center mb-6">
          <Avatar className="w-24 h-24">
            <AvatarImage src={form.profilePic} alt="Profile" />
            <AvatarFallback>
              {form.fullName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <h3 className="text-xl font-medium mt-2">{form.fullName}</h3>
          <p className="text-sm text-gray-500">{form.email}</p>

          <Label className="mt-2">
            <Input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImageUpload}
            />
            <Button
              variant="secondary"
              disabled={imageUploading}
              onClick={handleButtonClick}
            >
              {imageUploading ? "Uploading..." : "Change Picture"}
            </Button>
          </Label>
        </div>

        {/* Profile Information */}
        <div className="space-y-4">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={form.email} disabled />

          <Label htmlFor="username" className="mt-4">
            Username
          </Label>
          <Input
            id="username"
            type="text"
            name="username"
            value={form.username}
            placeholder="Enter username"
            onChange={handleChange}
            onBlur={validateUsername}
          />
          {errors.username && (
            <p className="text-red-500 text-sm">{errors.username}</p>
          )}

          <Label htmlFor="fullName" className="mt-4">
            Name
          </Label>
          <Input
            id="fullName"
            type="text"
            name="fullName"
            value={form.fullName}
            placeholder="Enter full name"
            onChange={handleChange}
          />

          <Label htmlFor="description" className="mt-4">
            Description
          </Label>
          <Input
            id="description"
            type="text"
            name="description"
            value={form.description}
            placeholder="Enter Description"
            onChange={handleChange}
          />

          <Label htmlFor="location" className="mt-4">
            Location
          </Label>
          <Input
            id="location"
            type="text"
            name="location"
            value={form.location}
            placeholder="Enter location"
            onChange={handleChange}
          />
        </div>

        {/* Account Actions */}
        <div className="mt-6 space-y-4">
          {/* Logout & Delete Account Group */}
          <div className="flex flex-row justify-between">
            {/* Logout */}
            <AlertDialog
              open={openDialog === "logout"}
              onOpenChange={(isOpen) => setOpenDialog(isOpen ? "logout" : null)}
            >
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  disabled={loading}
                  onClick={() => setOpenDialog("logout")}
                  className="w-32"
                >
                  Logout
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="z-[70]">
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will log you out of your account.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setOpenDialog(null)}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-red-500 text-white hover:bg-red-600"
                    onClick={() => handleAction(handleLogout)}
                  >
                    Yes, Logout
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Delete Account */}
            <AlertDialog
              open={openDialog === "deleteAccount"}
              onOpenChange={(isOpen) =>
                setOpenDialog(isOpen ? "deleteAccount" : null)
              }
            >
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  disabled={loading}
                  onClick={() => setOpenDialog("deleteAccount")}
                  className="w-36"
                >
                  Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="z-[70]">
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action is permanent and cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setOpenDialog(null)}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-red-500 text-white hover:bg-red-600"
                    onClick={() => handleAction(handleDeleteAccount)}
                  >
                    Yes, Delete Account
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {/* Save & Discard Changes Group */}
          <div className="flex justify-end gap-2">
            {/* Discard Changes */}
            <AlertDialog
              open={openDialog === "discard"}
              onOpenChange={(isOpen) => setOpenDialog(isOpen ? "discard" : null)}
            >
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  onClick={() => setOpenDialog("discard")}
                >
                  Discard Changes
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="z-[70]">
                <AlertDialogHeader>
                  <AlertDialogTitle>Discard changes?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Any unsaved changes will be lost.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setOpenDialog(null)}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction onClick={onClose}>Discard</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Save Changes */}
            <Button className="ml-2" onClick={handleSave} disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPopup;
