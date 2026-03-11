import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Personal Finance App',
  description: 'Gestiona tus finanzas personales de forma inteligente.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-[#F8FAFC] antialiased">{children}</body>
    </html>
  );
}
