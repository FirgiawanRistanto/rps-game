import './globals.css';

export const metadata = {
  title: 'Gesture RPS Game',
  description: 'Play Rock Paper Scissors with hand gestures',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
