"use client";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { ensureAnonAuth, db, serverTimestamp, auth } from "@/lib/firebase";
import { collection, doc, onSnapshot, orderBy, query, addDoc, getDoc } from "firebase/firestore";
import Message from "@/components/Message";
import ChatInput from "@/components/ChatInput";

export default function RoomPage() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [handle, setHandle] = useState("anon");
  const [messages, setMessages] = useState([]);
  const [roomMeta, setRoomMeta] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    (async () => {
      const u = await ensureAnonAuth();
      setUser(u);
      const userSnap = await getDoc(doc(db, "users", u.uid));
      setHandle(userSnap.exists() ? userSnap.data().handle : "anon");

      const roomRef = doc(db, "rooms", id);
      const unsubRoom = onSnapshot(roomRef, (snap) => {
        if (snap.exists()) {
          setRoomMeta(snap.data());
        } else {
          setRoomMeta({ title: id });
        }
      });
      const q = query(collection(db, "rooms", id, "messages"), orderBy("createdAt", "asc"));
      const unsubMessages = onSnapshot(q, (snap) => {
        setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setTimeout(()=>bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      });
      return () =>{
        unsubMessages();
        unsubRoom();
      }   
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

  return (
    <main className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{roomMeta?.title || `Room ${id}`}</h1>
        <span className="text-xs text-gray-400">Ephemeral • No signup</span>
      </div>
      <div className="card p-3 h-[60vh] overflow-y-auto">
        {messages.map(m => <Message key={m.id} m={m} self={user} />)}
        <div ref={bottomRef} />
      </div>
      <ChatInput onSend={send} />
      <div className="text-xs text-gray-400">By chatting, you agree to be nice. Spam & slurs auto-muted.</div>
    </main>
  );
}
