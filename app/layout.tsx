import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "VEXAUSE LABS | Custom 3D Printing",
  description: "Custom 3D printing and prototype parts. Share your requirements and request a quote from VEXAUSE LABS."
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
