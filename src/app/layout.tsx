import type { Metadata } from "next";
import "./globals.css";
import LiveEnvironmentSystem from "@/components/LiveEnvironmentSystem";
import { AudioProvider } from "@/context/AudioContext";
import SoundToggle from "@/components/SoundToggle";

export const metadata: Metadata = {
  title: "WORTHLESS | SILENT PRESSURE",
  description: "A brutalist digital experience for the elite. Luxury minimalism and cinematic aesthetics.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AudioProvider>
          <LiveEnvironmentSystem />
          {children}
          <SoundToggle />
        </AudioProvider>
      </body>
    </html>
  );
}

