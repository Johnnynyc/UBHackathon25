"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ensureAnonAuth, db } from "@/lib/firebase";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { randomHandle } from "@/lib/handle";

export default function Join() {
  const router = useRouter();
  const params = useSearchParams();
  const room = params.get("room");
  const [status, setStatus] = useState("Joining...");
  useEffect(() => {
    (async () => {
      const user = await ensureAnonAuth();
      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        await setDoc(userRef, { handle: randomHandle(), createdAt: serverTimestamp(), strikes: 0, canPost: true });
      }
      if (!room) { setStatus("No room specified"); return; }
      setStatus("Redirecting...");
      router.replace(`/room/${encodeURIComponent(room)}`);
    })();
  }, [room, router]);
  return <div className="card p-4">{status}</div>;
}
