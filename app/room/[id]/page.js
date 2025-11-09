"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { ensureAnonAuth, db, serverTimestamp, auth } from "@/lib/firebase";
import { collection, doc, onSnapshot, orderBy, query, addDoc, getDoc } from "firebase/firestore";
import Message from "@/components/Message";
import ChatInput from "@/components/ChatInput";

export default function RoomPage() {
  const params = useParams();
  const id = useMemo(() => decodeURIComponent(params?.id || ""), [params?.id]);
  const [user, setUser] = useState(null);
  const [handle, setHandle] = useState("anon");
  const [messages, setMessages] = useState([]);
  const [roomMeta, setRoomMeta] = useState(null);
  const handleCacheRef = useRef({});
  const [handleMap, setHandleMap] = useState({});
  const [summary, setSummary] = useState("");
  const [summarizing, setSummarizing] = useState(false);
  const [aiStatus, setAiStatus] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    (async () => {
      const u = await ensureAnonAuth();
      setUser(u);
      const userSnap = await getDoc(doc(db, "users", u.uid));
      setHandle(userSnap.exists() ? userSnap.data().handle : "anon");

      const roomSnap = await getDoc(doc(db, "rooms", id));
      setRoomMeta(roomSnap.exists() ? roomSnap.data() : { title: id });
      const q = query(collection(db, "rooms", id, "messages"), orderBy("createdAt", "asc"));
      const unsub = onSnapshot(q, (snap) => {
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setMessages(docs);
        hydrateHandles(docs);
        setTimeout(()=>bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      });
      return () => unsub();
    })();
  }, [id]);

  async function send(text) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const u = auth.currentUser;
    const askMatch = trimmed.match(/^\\(ask|mr\.?\s*monopoly)\s*(.*)$/i);
    const isAsk = Boolean(askMatch);
    const question = askMatch ? askMatch[2].trim() : "";

    const outgoingText = isAsk ? (question || trimmed) : trimmed;
    if (isAsk && !question.length) {
      setAiStatus("Add a question after \\ask to query Mr. Monopoly.");
      return;
    }

    await addDoc(collection(db, "rooms", id, "messages"), {
      uid: u.uid,
      handle,
      text: outgoingText,
      createdAt: serverTimestamp(),
      type: "user"
    });

    if (isAsk) {
      await handleAsk(question);
    }
  }

  async function hydrateHandles(msgs) {
    const missing = [
      ...new Set(
        msgs
          .map(m => m.uid)
          .filter(uid => uid && !handleCacheRef.current[uid])
      )
    ];
    if (!missing.length) return;
    const updates = {};
    await Promise.all(
      missing.map(async (uid) => {
        const snap = await getDoc(doc(db, "users", uid));
        if (snap.exists()) {
          const data = snap.data();
          if (data?.handle) updates[uid] = data.handle;
        }
      })
    );
    if (Object.keys(updates).length) {
      handleCacheRef.current = { ...handleCacheRef.current, ...updates };
      setHandleMap({ ...handleCacheRef.current });
    }
  }

  async function summarizeRoom() {
    try {
      setSummarizing(true);
      setSummary("");
      const res = await fetch("/api/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId: id, mode: "summary" })
      });
      if (!res.ok) {
        let errMsg = "Failed to summarize";
        try {
          const errBody = await res.json();
          errMsg = errBody.details || errBody.error || errMsg;
        } catch (_) {}
        throw new Error(errMsg);
      }
      const data = await res.json();
      setSummary(data.text);
    } catch (err) {
      setSummary(err.message);
    } finally {
      setSummarizing(false);
    }
  }

  async function handleAsk(question) {
    try {
      setAiStatus("Asking Gemini…");
      const res = await fetch("/api/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId: id, mode: "qa", question })
      });
      if (!res.ok) {
        let errMsg = "Gemini request failed";
        try {
          const err = await res.json();
          errMsg = err.details || err.error || errMsg;
        } catch (_) {}
        throw new Error(errMsg);
      }
      const data = await res.json();
      const answer = data.text || "No response.";
      await addDoc(collection(db, "rooms", id, "messages"), {
        uid: "Mr. Monopoly",
        handle: "Mr. Monopoly",
        text: answer,
        type: "Your guide",
        createdAt: serverTimestamp()
      });
      setAiStatus("");
    } catch (err) {
      setAiStatus(err.message);
    }
  }

  return (
    <main className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{roomMeta?.title || `Room ${id}`}</h1>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <button
            onClick={summarizeRoom}
            disabled={summarizing}
            className="px-3 py-1 rounded bg-slate-800 text-white text-xs disabled:opacity-60"
          >
            {summarizing ? "Summarizing..." : "Summarize"}
          </button>
          
        </div>
      </div>
      <div className="card p-3 h-[60vh] overflow-y-auto">
        {messages.map(m => (
          <Message
            key={m.id}
            m={m}
            self={user}
            displayHandle={handleMap[m.uid] || m.handle}
          />
        ))}
        <div ref={bottomRef} />
      </div>
      <ChatInput onSend={send} />
      {aiStatus && <div className="text-sm text-amber-300">{aiStatus}</div>}
      {summary && (
        <div className="card p-3 bg-slate-900/70">
          <p className="text-sm font-semibold">Summary</p>
          <p className="text-sm text-gray-200 whitespace-pre-line mt-1">{summary}</p>
        </div>
      )}
      <div className="text-xs text-gray-400">By chatting, you agree to be nice. Spam & slurs auto-muted.</div>
    </main>
  );
}
