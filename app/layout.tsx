import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./design-system.css";

export const metadata: Metadata = {
  title: {
    default: "VEXAUSE LABS | Custom 3D Printing",
    template: "%s | VEXAUSE LABS",
  },
  description:
    "Custom 3D printing and prototype parts. Share your requirements and request a quote from VEXAUSE LABS.",
  applicationName: "VEXAUSE LABS",
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#102f26",
  colorScheme: "light",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
