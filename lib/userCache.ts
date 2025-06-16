// Simple in-memory user cache for Firestore users collection
import { db } from "@/lib/firebase";
import { doc, getDoc, getDocs, collection, query, where } from "firebase/firestore";

const userCache: Record<string, any> = {};

export async function getUserCached(userId: string) {
  if (userCache[userId]) return userCache[userId];
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    userCache[userId] = { id: userSnap.id, ...userSnap.data() };
    return userCache[userId];
  }
  return null;
}

export async function getUsersBatch(userIds: string[]): Promise<any[]> {
  const uncachedIds = userIds.filter((id) => !userCache[id]);
  if (uncachedIds.length > 0) {
    // Firestore doesn't support 'in' queries with more than 10 elements
    const batches = [];
    for (let i = 0; i < uncachedIds.length; i += 10) {
      batches.push(uncachedIds.slice(i, i + 10));
    }
    for (const batch of batches) {
      const q = query(collection(db, "users"), where("id", "in", batch));
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((docSnap) => {
        userCache[docSnap.id] = { id: docSnap.id, ...docSnap.data() };
      });
    }
  }
  return userIds.map((id) => userCache[id] || null);
} 