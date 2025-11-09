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

  // Helper to create user if not exists
  const createUserIfNotExists = async (uid) => {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      await setDoc(userRef, {
        handle: randomHandle(),
        createdAt: serverTimestamp(),
        strikes: 0,
        canPost: true,
      });
    }
  };

  // Helper to create room if not exists
  const createRoomIfNotExists = async (roomName) => {
    const roomRef = doc(db, "rooms", roomName);
    const roomSnap = await getDoc(roomRef);

    if (!roomSnap.exists()) {
      await setDoc(roomRef, {
        title: roomName,
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      });
    }
  };

  useEffect(() => {
    const joinRoom = async () => {
      try {
        const user = await ensureAnonAuth();

        // Make sure user exists in DB
        await createUserIfNotExists(user.uid);

        if (!room) {
          setStatus("No room specified.");
          return;
        }

        const roomRef = doc(db, "rooms", room);
        const roomSnap = await getDoc(roomRef);

        if (!roomSnap.exists()) {
          if (create) {
            await createRoomIfNotExists(room);
            setStatus("Creating room...");
          } else {
            setStatus("Room does not exist.");
            return;
          }
        } else {
          setStatus("Joining room...");
        }

        // Delay
        setTimeout(() => {
          router.replace(`/room/${room}`);
        }, 700);
      } catch (err) {
        console.error(err);
        setStatus("Something went wrong.");
      }
    };

    joinRoom();
  }, [room, create, router]);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-[#CAE8E0] p-4">
      <div className="bg-white shadow-lg rounded-xl p-6 w-full max-w-sm text-center">
        <h2 className="text-xl font-bold mb-2">{room || "..."}</h2>
        <p className="text-gray-600">{status}</p>
        {status.includes("Joining") || status.includes("Creating") ? (
          <div className="mt-4 flex justify-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
