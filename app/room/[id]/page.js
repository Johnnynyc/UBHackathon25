"use client";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { ensureAnonAuth, db, serverTimestamp, auth } from "@/lib/firebase";
import { collection, doc, onSnapshot, orderBy, query, addDoc, getDoc } from "firebase/firestore";
import Message from "@/components/Message";
import ChatInput from "@/components/ChatInput";
import QRCode from "qrcode";

export default function RoomPage() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [handle, setHandle] = useState("anon");
  const [messages, setMessages] = useState([]);
  const [roomMeta, setRoomMeta] = useState(null);
  const [qrUrl, setQrUrl] = useState(null); // <-- store QR code URL
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
        setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
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

  async function generateQR() {
    const baseUrl = window.location.origin; // current site
    const url = `${baseUrl}/join?room=${encodeURIComponent(id)}`;
    try {
      const dataUrl = await QRCode.toDataURL(url, { width: 256 });
      setQrUrl(dataUrl);
    } catch (err) {
      console.error("QR generation error:", err);
    }
  }

  return (
    <main className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{`Room: ${id}`}</h1>
        <button
          onClick={generateQR}
          className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-500"
        >
          Generate QR
        </button>
      </div>

      {qrUrl && (
        <div className="p-2 bg-slate-800 rounded inline-block">
          <img src={qrUrl} alt={`QR for room ${id}`} className="w-32 h-32" />
        </div>
      )}

      <div className="card p-3 h-[60vh] overflow-y-auto">
        {messages.map(m => <Message key={m.id} m={m} self={user} />)}
        <div ref={bottomRef} />
      </div>

      <ChatInput onSend={send} />
      <div className="text-xs text-gray-400">
        By chatting, you agree to be nice. Spam & slurs auto-muted.
      </div>
    </main>
  );
}
