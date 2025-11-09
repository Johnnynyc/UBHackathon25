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
  const create = params.get("create") === "true";
  const [status, setStatus] = useState("Joining...");

  useEffect(() => {
    (async () => {
      const user = await ensureAnonAuth();
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()){
        await setDoc(userRef,{ 
          handle: randomHandle(), 
          createdAt: serverTimestamp(), 
          strikes: 0, 
          canPost: true 
        });
      }

      if (!room) { 
        setStatus("No room specified"); 
        return; 
      }

      const roomRef = doc(db, "rooms", room);
      const roomSnap = await getDoc(roomRef);

      if (!roomSnap.exists()) {
        if(create){
          setStatus("Creating room...");
          await setDoc(roomRef, {
            title: room,
            createdAt: serverTimestamp(),
            expiresAt: new Date(Date.now() + 60 * 60 * 1000), // expires in 1h (example)
        });
      }else{
        setStatus("Room does not exist");
        return;
      }
    }

      setStatus("Redirecting...");
      router.replace(`/room/${room}`);
    })();
  }, [room, create, router]);

  return <div className="card p-4">{status}</div>;
}
