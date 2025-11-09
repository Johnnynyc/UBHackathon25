import { NextResponse } from "next/server";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, query, orderBy, limit, getDocs, doc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);

function buildPrompt(mode, history, question) {
  if (mode === "qa" && question) {
    return `You are Mr. Monopoly, a social media ai assistant. Use ONLY the conversation below to answer the question at the end. Always refer to people by their @handle exactly as shown.\n\nConversation:\n${history}\n\nQuestion: ${question}\nAnswer:`;
  }
  return `You are Mr. Monopoly, a social media ai assistant. Summarize the following conversation into 3 concise bullet points. Quote each participant by their @handle exactly as shown.\n\nConversation:\n${history}\n\nSummary:`;
}

const MODEL_ID = process.env.GEMINI_MODEL || "gemini-1.5-flash-latest";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_ID}:generateContent`;

export async function POST(req) {
  try {
    const body = await req.json();
    const { roomId, mode = "summary", question = "" } = body || {};
    if (!roomId) {
      return NextResponse.json({ error: "roomId is required" }, { status: 400 });
    }
    if (mode === "qa" && !question) {
      return NextResponse.json({ error: "question is required for qa mode" }, { status: 400 });
    }
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
    }

    const messagesSnap = await getDocs(
      query(
        collection(db, "rooms", roomId, "messages"),
        orderBy("createdAt", "desc"),
        limit(40)
      )
    );

    const messages = messagesSnap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));

    const missingHandleUids = [
      ...new Set(
        messages
          .filter((msg) => !msg.handle && typeof msg.uid === "string")
          .map((msg) => msg.uid)
      )
    ];

    const handleMap = {};
    await Promise.all(
      missingHandleUids.map(async (uid) => {
        const userSnap = await getDoc(doc(db, "users", uid));
        if (userSnap.exists()) {
          const data = userSnap.data();
          if (data?.handle) handleMap[uid] = data.handle;
        }
      })
    );

    const history = messages
      .filter((msg) => typeof msg?.text === "string" && msg.text.trim().length)
      .reverse()
      .map((msg) => `${msg.handle || handleMap[msg.uid] || msg.uid || "guest"}: ${msg.text}`)
      .join("\n");

    if (!history) {
      return NextResponse.json({ error: "No conversation found." }, { status: 404 });
    }

    const prompt = buildPrompt(mode, history, question);
    const geminiRes = await fetch(`${GEMINI_ENDPOINT}?key=${process.env.GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      return NextResponse.json({ error: "Gemini request failed", details: errText }, { status: 502 });
    }

    const geminiJson = await geminiRes.json();
    const text = geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!text) {
      return NextResponse.json({ error: "No response from Gemini." }, { status: 502 });
    }

    return NextResponse.json({ text });
  } catch (err) {
    console.error("assist API error", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
