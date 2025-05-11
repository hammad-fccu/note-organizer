import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Notematic",
  description: "Organize your notes with AI-powered tagging, linking, and summaries",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Inline script to set dark mode based on localStorage */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                let isDarkMode = localStorage.getItem('darkMode') === 'true' || 
                    (!('darkMode' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
                console.log('Initial dark mode:', isDarkMode);
                
                if (isDarkMode) {
                  document.documentElement.classList.add('dark');
                  document.documentElement.classList.remove('light');
                } else {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.classList.add('light');
                }
                
                // Debug: Log the HTML class after setting it
                console.log('HTML class after init:', document.documentElement.className);
                
                // Set up an observer to monitor class changes
                const observer = new MutationObserver((mutations) => {
                  mutations.forEach((mutation) => {
                    if (mutation.attributeName === 'class') {
                      console.log('Class changed to:', document.documentElement.className);
                    }
                  });
                });
                
                observer.observe(document.documentElement, { attributes: true });
              } catch(e) {
                console.error('Error accessing localStorage:', e);
              }
            `,
          }}
        />
      </head>
      <body
        className={`${montserrat.variable} font-sans antialiased`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
