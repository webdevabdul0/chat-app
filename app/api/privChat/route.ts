import { NextResponse } from "next/server";
import { StreamChat } from "stream-chat";

const apiKey = process.env.STREAM_API_KEY!;
const secretKey = process.env.STREAM_SECRET_KEY!;

const chatClient = StreamChat.getInstance(apiKey, secretKey);

export async function POST(req: Request) {
  try {
    const { userId, username, displayName, recipientId, recipientName } =
      await req.json();

    if (!userId || !recipientId) {
      return NextResponse.json(
        { error: "User ID and Recipient ID are required" },
        { status: 400 }
      );
    }

    console.log("🔹 Generating token for:", userId);
    const token = chatClient.createToken(userId);

    // ✅ Ensure both users exist
    await chatClient.upsertUsers([
      { id: userId, name: displayName || username || "User" },
      { id: recipientId, name: recipientName || "User" }, // Name will be updated dynamically
    ]);

    // ✅ Create/Get a unique private channel
    const channelId = [userId, recipientId].sort().join("_"); // Unique ID for 1-on-1 chat
    const channel = chatClient.channel("messaging", channelId, {
      name: "Private Chat",
      created_by_id: userId, // 🔥 Ensuring the sender creates the channel
    });

    try {
      await channel.create();
      console.log("✅ Private channel created:", channel.id);
    } catch (err) {
      console.log("⚠️ Channel might already exist:", err.message);
    }

    // ✅ Ensure both users are members
    await channel.addMembers([userId, recipientId]);

    return NextResponse.json({ token, channelId: channel.id });
  } catch (error) {
    console.error("❌ Backend API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
