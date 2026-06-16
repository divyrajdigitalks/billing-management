import React from 'react';
import type { Metadata } from 'next';
import '../styles/globals.css';
import { Providers } from '../components/Providers';
import LayoutShell from '../components/LayoutShell';
import { AuthGuard } from '../components/AuthGuard';

export const metadata: Metadata = {
  title: 'Billing Management System',
  description: 'Production-ready Full-Stack Billing Management System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin: 0, padding: 0 }}>
        <Providers>
          <AuthGuard>
            <LayoutShell>{children}</LayoutShell>
          </AuthGuard>
        </Providers>
      </body>
    </html>
  );
}
