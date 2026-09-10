import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Evolve | Gestão de Estúdio de Pilates",
  description: "Sistema de gestão para o estúdio de pilates Evolve.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
