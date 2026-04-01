import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agentic Composition Diagnostic | CMPRSSN",
  description: "Measure where your human-agent composition sits relative to other operators. A 10-question diagnostic instrument from the CMPRSSN research team.",
  openGraph: {
    title: "Agentic Composition Diagnostic",
    description: "10 questions. 5 dimensions. Where does your agent composition stand?",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="orb orb-teal" />
        <div className="orb orb-blue" />
        <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh' }}>
          {children}
        </div>
      </body>
    </html>
  );
}
