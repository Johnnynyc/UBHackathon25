"use client";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { ensureAnonAuth, db, serverTimestamp, auth } from "@/lib/firebase";
import { collection, doc, onSnapshot, orderBy, query, addDoc, getDoc } from "firebase/firestore";
import Message from "@/components/Message";
import ChatInput from "@/components/ChatInput";
import './chatRoom.css';


export default function RoomPage() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [handle, setHandle] = useState("anon");
  const [messages, setMessages] = useState([]);
  const [roomMeta, setRoomMeta] = useState(null);
  const handleCacheRef = useRef({});
  const [handleMap, setHandleMap] = useState({});
  const [summary, setSummary] = useState("");
  const [summarizing, setSummarizing] = useState(false);
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
    const u = auth.currentUser;
    await addDoc(collection(db, "rooms", id, "messages"), {
      uid: u.uid,
      handle,
      text,
      createdAt: serverTimestamp(),
      type: "user"
    });
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






  return (
    <main>
      

      <div>
        <h1 className="roomTitle">{roomMeta?.title || `Room ${id}`}</h1>
        


        
        <div className="ai-button">
          <button
            onClick={summarizeRoom}
            disabled={summarizing}
          >
            {summarizing ? "Summarizing..." : "Summarize Now"}
          </button>
        </div>
      </div>

      <div className="text-chat-box">
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
      {summary && (
        <div className="ai-card">
          <p className="ai-summary-header">Summary</p>
          <p className="ai-data">{summary}</p>
        </div>
      )}




      <div className="disclaimer">By chatting, you agree to be nice. Spam & slurs auto-muted.</div>

    
    </main>
  );
}
