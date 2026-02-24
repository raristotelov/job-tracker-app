import type { Metadata } from "next";
import "./globals.scss";

export const metadata: Metadata = {
  title: "Job Tracker App",
  description: "Track your job applications",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
