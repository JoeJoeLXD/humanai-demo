export const metadata = { title: "HumanAI Demo", description: "RAG demo" };
import "./globals.css";

export default function RootLayout({ children }:{ children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
