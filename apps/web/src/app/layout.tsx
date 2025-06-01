import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { FirebaseAuthProvider } from "@/components/providers/FirebaseAuthProvider";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Open Canvas",
  description: "Open Canvas Chat UX by LangChain",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-screen" suppressHydrationWarning>
      <body className={`min-h-full ${inter.className}`}>
        <SessionProvider>
          <FirebaseAuthProvider>
            {children}
          </FirebaseAuthProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
