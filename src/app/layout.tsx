import type { Metadata } from "next";
import "./globals.css";
import DustParticles from "@/components/DustParticles";
import InvisibleDepthSystem from "@/components/InvisibleDepthSystem";

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
        <InvisibleDepthSystem />
        <DustParticles />
        {children}
      </body>
    </html>
  );
}
