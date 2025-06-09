import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { FirebaseAuthProvider } from "@/components/providers/FirebaseAuthProvider";

export const metadata: Metadata = {
  title: "Canvas – Create, Design, Collaborate",
  description: "A powerful creative platform for designers and developers",
  keywords: "canvas, design, collaboration, creative platform",
  authors: [{ name: "LangChain" }],
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className="h-full bg-background antialiased">
        <SessionProvider>
          <FirebaseAuthProvider>
            <div className="min-h-full">
              {children}
            </div>
          </FirebaseAuthProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
