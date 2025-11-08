export const metadata = { 
  title: "Ice Breaker", 
  description: "QR → ephemeral in-store chats",
};
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <div className="max-w-2xl mx-auto p-4">{children}</div>
      </body>
    </html>
  );
}
