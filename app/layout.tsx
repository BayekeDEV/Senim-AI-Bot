import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Senim Consulting — AI Assistant",
  description: "MVP chat for Senim Consulting sales assistant",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className="bg-gray-100 text-gray-900">{children}</body>
    </html>
  );
}
