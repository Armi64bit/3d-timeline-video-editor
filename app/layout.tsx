import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "3D Timeline Video Editor",
  description: "Real-time 3D timeline / ghost-depth video effect editor",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
