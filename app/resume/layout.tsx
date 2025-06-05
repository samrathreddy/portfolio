import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Samrath Reddy - Resume',
  description: 'View and download Samrath Reddy\'s resume',
};

export default function ResumeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 