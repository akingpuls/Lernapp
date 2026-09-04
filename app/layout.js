import "./globals.css";

export const metadata = {
  title: "Lern-App",
  description: "Private Lern-App für Aufgaben, Themen und Lernziele",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Lern-App",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2f5d62",
};

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <body>
        <div className="app-shell">{children}</div>
      </body>
    </html>
  );
}
