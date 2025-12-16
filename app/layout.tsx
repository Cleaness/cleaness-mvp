import "./globals.css";
import React from "react";

export const metadata = {
  title: "Cleaness MVP",
  description: "Kalender + Kundenstamm + Online-Beratung",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>
        <div className="container">{children}</div>
      </body>
    </html>
  );
}
