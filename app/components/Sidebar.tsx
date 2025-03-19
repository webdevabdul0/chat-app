import Link from "next/link";
import { useAuth } from "@/app/provider";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import SettingsPopup from "./SettingsPopup";

import {
  Home,
  Bell,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  X,
  User,
  Book,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Sidebar({ isFixed }: { isFixed: boolean }) {
  const { userData, logout } = useAuth();
  const { user } = useAuth();
  const pathname = usePathname();
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <>
      {/* Hamburger Icon on Mobile */}
      {!isSidebarOpen && (
        <button
          className="xl:hidden fixed top-4 left-4 z-50 p-2 bg-secondary rounded-xl shadow-md"
          onClick={() => setIsSidebarOpen(true)}
        >
          <Menu className="w-7 h-7 text-primary" />
        </button>
      )}

      {/* Sidebar */}
      <aside
        className={`w-64 px-8 pb-8 pt-[70px] h-screen bg-secondary z-20 flex flex-col 
  transition-transform transform shadow-lg 
  ${isFixed ? "fixed top-0 left-0" : "fixed top-0 left-0 xl:relative"} 
  ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} 
  xl:translate-x-0 xl:flex ${isFixed ? "xl:fixed" : "xl:relative"}`}
      >
        {/* Close Button on Mobile */}
        <button
          className="xl:hidden absolute top-4 right-4 p-2 bg-gray-200 rounded-full"
          onClick={() => setIsSidebarOpen(false)}
        >
          <X className="w-6 h-6 text-black" />
        </button>

        {/* If user is NOT authenticated, show only login button */}
        {!user ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Link href="/auth/login">
              <Button>Login</Button>
            </Link>
          </div>
        ) : (
          <>
            {/* User Info */}
            <div className="bg-white px-2 py-2 border border-gray-200 rounded-xl shadow-sm flex items-center space-x-3 mb-6">
              <Avatar className="w-12 h-12">
                {userData?.profilePic ? (
                  <AvatarImage src={userData.profilePic} alt="User Avatar" />
                ) : (
                  <AvatarFallback className="bg-primary text-white">
                    {userData?.fullName?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
              <div>
                <p className="text-black font-semibold text-base">
                  {userData?.fullName}
                </p>
              </div>
            </div>

            {/* Sidebar Links */}
            <nav className="flex flex-col text-black/60 gap-3">
              {[
                { href: "/home", label: "Home", icon: Home },
                { href: "/notifications", label: "Notifications", icon: Bell },
                { href: "/messages", label: "Messages", icon: MessageSquare },
                { href: "/my-booking", label: "Booking", icon: Book },
              ].map(({ href, label, icon: Icon }) => {
                const isSelected = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`flex items-center gap-3 p-3 rounded-xl text-base font-medium transition border 
                      ${
                        isSelected
                          ? "bg-primary/10 border-primary text-primary"
                          : "border-transparent text-black/40 hover:bg-primary/10"
                      }`}
                  >
                    <Icon
                      className={`w-6 h-6 ${
                        isSelected ? "text-primary" : "text-black/40"
                      }`}
                    />
                    {label}
                  </Link>
                );
              })}

              {/* Profile Link */}
              <Link
                href={`/profile/${user?.uid}`}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 p-3 rounded-xl text-base font-medium transition border 
                  ${
                    pathname === `/profile/${user?.uid}`
                      ? "bg-primary/10 border-primary text-primary"
                      : "border-transparent text-black/40 hover:bg-primary/10"
                  }`}
              >
                <User
                  className={`w-6 h-6 ${
                    pathname === `/profile/${user?.uid}`
                      ? "text-primary"
                      : "text-black/40"
                  }`}
                />
                Profile
              </Link>

              {/* Settings Button */}
              <button
                onClick={() => {
                  setIsPopupOpen(true);
                  setIsSidebarOpen(false);
                }}
                className="flex items-center gap-3 p-3 rounded-xl text-base font-medium transition border border-transparent text-black/40 hover:bg-primary/10"
              >
                <Settings className="w-6 h-6 text-black/40" />
                Settings
              </button>
            </nav>

            {/* Logout Button */}
            <div className="mt-auto">
              <button
                onClick={logout}
                className="w-full p-3 flex items-center justify-center gap-2 bg-red-500 text-white rounded-xl hover:bg-red-600"
              >
                Logout
                <LogOut className="w-6 h-6 text-white" />
              </button>
            </div>
          </>
        )}
      </aside>

      {/* Settings Popup */}
      {isPopupOpen && <SettingsPopup onClose={() => setIsPopupOpen(false)} />}
    </>
  );
}
