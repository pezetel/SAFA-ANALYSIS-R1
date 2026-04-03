import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SAFA Trend Analysis Platform',
  description: 'Comprehensive analysis and reporting of aircraft findings',
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
