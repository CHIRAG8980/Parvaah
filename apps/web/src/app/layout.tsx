import type { Metadata } from 'next';
import 'leaflet/dist/leaflet.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'Parvaah | AI-Based Early Warning & Landslide Risk Monitoring System (NER)',
  description: 'Real-time intelligence and landslide risk monitoring for State Disaster Management Authorities across North East India',
  icons: {
    icon: '/images/logo.png',
    apple: '/images/logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased min-h-screen bg-[#F4F8FC] text-[#0F1F3D] font-sans selection:bg-[#EAF3FF] selection:text-[#1769D2]">
        {children}
      </body>
    </html>
  );
}
