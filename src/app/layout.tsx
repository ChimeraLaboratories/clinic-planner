import "./globals.css";

export const metadata = {
    title: "Clinic Planner",
    description: "Clinic Planning System",
    icons: {
        icon: "/favicon.ico",
        apple: "/icon-192.png",
    },
};

const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem('theme'); // 'dark' | 'light' | null
    var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    var shouldDark = stored ? stored === 'dark' : prefersDark;
    var el = document.documentElement;
    if (shouldDark) el.classList.add('dark');
    else el.classList.remove('dark');
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
        <head>
            <meta name="color-scheme" content="light dark" />
            <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        </head>
        <body className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        {children}
        </body>
        </html>
    );
}