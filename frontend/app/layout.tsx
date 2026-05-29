import type { Metadata } from "next";
import "./globals.css";
import UnhandledRejectionSuppressor from "@/components/UnhandledRejectionSuppressor";

export const metadata: Metadata = {
  title: "Interviewa — AI Interview Practice",
  description: "Practice technical interviews with AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <UnhandledRejectionSuppressor />
        {children}
      </body>
    </html>
  );
}
