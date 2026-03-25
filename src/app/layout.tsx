import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

export const metadata: Metadata = {
  title: "ClustR AI — AI-Powered Photo Delivery for Studios",
  description: "White-label face-bucketed photo delivery platform. Upload thousands of photos, automatically sort by faces, and deliver personalized galleries to your clients.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
