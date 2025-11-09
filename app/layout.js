export const metadata = { title: "ShopChat", description: "QR → ephemeral in-store chats" };
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div>{children}</div>
      </body>
    </html>
  );
}
