"use client";

import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import UserCard from "./UserCard";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";

// Add User type for state
interface User {
  id: string;
  fullName: string;
  username: string;
  profilePic?: string;
}

export default function RightPanel() {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  // Fetch users with debounce
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      const fetchUsers = async () => {
        try {
          let q = query(collection(db, "users"), orderBy("fullName"));
          const querySnapshot = await getDocs(q);
          let usersData = querySnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              fullName: data.fullName || '',
              username: data.username || '',
              profilePic: data.profilePic || undefined,
            };
          });

          if (search.trim()) {
            usersData = usersData.filter(
              (user) =>
                user.fullName.toLowerCase().includes(search.toLowerCase()) ||
                user.username.toLowerCase().includes(search.toLowerCase())
            );
          }

          setUsers(usersData.slice(0, 3));
        } catch (error) {
          console.error("Error fetching users:", error);
        }
      };
      fetchUsers();
    }, 400); // 400ms debounce
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [search]);

  return (
    <div className="relative">
      {/* Search Icon for Small Screens */}

      <button
        className="xl:hidden fixed  top-4 right-4 p-2 z-40 bg-secondary rounded-xl shadow-md "
        onClick={() => {
          setIsOpen(true);
          console.log("Sidebar Open:", isOpen);
        }}
      >
        <Search className="w-7 h-7 text-primary" />
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 right-0 w-full sm:w-80 h-screen bg-secondary p-4 pb-8 pt-8 xl:pt-[70px] transition-transform ${
          isOpen ? "translate-x-0" : "translate-x-full"
        } z-40 shadow-lg xl:translate-x-0 `}
      >
        {/* Close Button (Only on Small Screens) */}

        <button
          className="xl:hidden absolute top-4 right-4 p-2 bg-gray-200 rounded-full"
          onClick={() => setIsOpen(false)}
        >
          <X className="w-6 h-6 text-black" />
        </button>

        <div className="mb-4 font-bold text-xl text-black/80">Search Users</div>

        {/* Search Bar */}
        <div className="mb-10">
          <div className="relative w-full">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={18}
            />
            <Input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
            />
          </div>
        </div>

        <div className="mb-4 font-bold text-xl text-black/80">
          Discover More Profiles
        </div>

        {/* User List */}
        <div className="flex flex-col gap-3 overflow-y-auto">
          {users.length > 0 ? (
            users.map((user) => <UserCard key={user.id} user={user} />)
          ) : (
            <p className="text-gray-500 text-center">No users found.</p>
          )}
        </div>
      </aside>
    </div>
  );
}
