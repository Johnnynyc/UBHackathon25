"use client";
import { useState } from "react";
import QRCode from "qrcode";

export default function RoomQRButton({ roomId }) {
  const [qrData, setQrData] = useState(null);

  const generateQR = async () => {
    try {
      const url = `${window.location.origin}/join?room=${encodeURIComponent(roomId)}`;
      const dataUrl = await QRCode.toDataURL(url, { width: 512 });
      setQrData(dataUrl);
    } catch (err) {
      console.error("QR generation failed:", err);
    }
  };

  return (
    <div className="space-y-2 mt-2">
      <button
        onClick={generateQR}
        className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white"
      >
        Generate QR Code
      </button>

      {qrData && (
        <div className="mt-2">
          <img src={qrData} alt={`QR code for ${roomId}`} className="border rounded" />
          <p className="text-xs text-gray-300 mt-1 break-all">{`${window.location.origin}/join?room=${roomId}`}</p>
        </div>
      )}
    </div>
  );
}
