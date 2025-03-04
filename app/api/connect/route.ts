import { NextResponse } from "next/server";
import { StreamChat } from "stream-chat";

const apiKey = process.env.STREAM_API_KEY!;
const secretKey = process.env.STREAM_SECRET_KEY!;
const chatClient = StreamChat.getInstance(apiKey, secretKey);

export async function POST(req: Request) {
  try {
    const { userId, username, displayName } = await req.json();
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    console.log("🔹 Generating token for:", userId);
    const token = chatClient.createToken(userId);

    // ✅ Ensure user exists in Stream
    await chatClient.upsertUser({
      id: userId,
      name: displayName || username || "User",
    });

    return NextResponse.json({ token });
  } catch (error) {
    console.error("❌ Error in /api/userconnect:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
