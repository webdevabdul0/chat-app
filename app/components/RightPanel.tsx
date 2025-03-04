"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase"; // Adjust the import based on your Firebase setup
import { collection, query, where, getDocs } from "firebase/firestore";
import Image from "next/image";

export default function RightPanel() {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!search.trim()) {
        setUsers([]);
        return;
      }
      const q = query(collection(db, "users"), where("fullName", ">=", search));
      const querySnapshot = await getDocs(q);
      setUsers(
        querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );
    };

    fetchUsers();
  }, [search]);

  return (
    <aside className=" h-screen  bg-secondary p-4 flex flex-col fixed top-0 right-0">
      {/* Search Bar */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full p-2 rounded-lg border border-gray-300 focus:outline-none focus:border-primary"
        />
      </div>

      {/* User List */}
      <div className="flex flex-col gap-3 overflow-y-auto">
        {users.map((user) => (
          <div
            key={user.id}
            className="flex items-center gap-3 p-2 bg-white rounded-lg shadow"
          >
            <Image
              src={user.avatarUrl || "/default-avatar.png"}
              alt={user.fullName}
              width={40}
              height={40}
              className="w-10 h-10 rounded-full object-cover"
            />
            <span className="text-base font-semibold">{user.fullName}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}
