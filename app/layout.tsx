import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./provider";
import { Toaster } from "@/components/ui/sonner";
import AnnouncementPopup from "./components/AnnouncementPopup";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"], // Add desired font weights
});

export const metadata: Metadata = {
  title: "iHere",
  description: "Social App",
  icons: {
    icon: "/favicon.ico", // Correct way to set the favicon
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${manrope.variable} antialiased`}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
