import "./globals.css";
import type { ReactNode } from "react";

export const metadata = { title: "Text-to-SQL Assistant", description: "Ask a shop database questions in plain English." };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (<html lang="en"><body>{children}</body></html>);
}
