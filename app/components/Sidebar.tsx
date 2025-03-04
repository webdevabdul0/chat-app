"use client";

import Link from "next/link";
import { useAuth } from "@/app/provider";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export default function Sidebar({ isFixed }: { isFixed: boolean }) {
  const { userData, logout } = useAuth();
  const pathname = usePathname();

  const links = [
    { href: "/home", label: "Home", icon: "/icons/home.svg" },
    {
      href: "/notifications",
      label: "Notifications",
      icon: "/icons/notification.svg",
    },
    { href: "/messages", label: "Messages", icon: "/icons/chat.svg" },
  ];

  return (
    <aside
      className={`w-64 px-8 pb-8 pt-[70px] h-screen bg-secondary hidden xl:flex flex-col ${
        isFixed ? "fixed top-0 left-0" : "relative"
      }`}
    >
      {userData && (
        <div className="bg-white px-2 py-2 border border-gray-200 rounded-xl shadow-sm flex items-center space-x-3 mb-6">
          <Avatar className="w-12 h-12">
            {userData.profilePicture ? (
              <AvatarImage src={userData.profilePicture} alt="User Avatar" />
            ) : (
              <AvatarFallback className="bg-primary text-white">
                {userData.fullName.charAt(0).toUpperCase()}
              </AvatarFallback>
            )}
          </Avatar>
          <div>
            <p className="text-black font-semibold text-base">
              {userData.fullName}
            </p>
          </div>
        </div>
      )}

      <nav className="flex flex-col text-black/60 gap-3">
        {links.map(({ href, label, icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 p-3 rounded-xl text-base font-medium transition ${
              pathname === href
                ? "bg-primary/10 border border-primary/50 text-[#450EA7]"
                : "hover:bg-primary/10"
            }`}
          >
            <Image
              src={icon}
              alt={label}
              width={24}
              height={24}
              className="w-6 h-6"
            />
            {label}
          </Link>
        ))}

        <Link
          href="/create-post"
          className="flex items-center gap-3 p-3 rounded-xl text-base font-medium transition bg-primary text-white hover:bg-primary/90"
        >
          <Image
            src="/icons/create-post.svg"
            alt="Create Post"
            width={24}
            height={24}
            className="w-6 h-6"
          />
          Create Post
        </Link>
      </nav>

      <div className="mt-auto">
        {userData && (
          <button
            onClick={logout}
            className="w-full p-3 flex items-center justify-center gap-2 bg-red-500 text-white rounded-xl hover:bg-red-600"
          >
            <Image
              src="/icons/logout.svg"
              alt="Logout"
              width={24}
              height={24}
              className="w-6 h-6"
            />
            Logout
          </button>
        )}
      </div>
    </aside>
  );
}
