import "~/styles/globals.css";
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter'; // For Next.js App Router
// ThemeProvider and CssBaseline will be handled by MainLayout
// import { ThemeProvider } from '@mui/material/styles';
// import CssBaseline from '@mui/material/CssBaseline';
// import theme from './theme'; // Path will be handled by MainLayout

import { type Metadata } from "next";
import { Geist } from "next/font/google";
// import { Provider } from "~/components/ui/provider"; // Removed Chakra Provider import

import { TRPCReactProvider } from "~/trpc/react";
import MainLayout from '~/components/layout/MainLayout'; // Import the new MainLayout

export const metadata: Metadata = {
  title: "Armory Operations", // Updated title
  description: "Armory Operations Management Plaform", // Updated description
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // pageTitle prop can be dynamically set per page later if needed
  // For now, we can pass a default or leave it to MainLayout's default
  // const pageTitle = "My Application"; 

  return (
    <html lang="en" className={geist.variable} /* suppressHydrationWarning might be needed if issues arise */ >
      <body>
        <AppRouterCacheProvider options={{ enableCssLayer: true }}>
          {/* MainLayout now wraps TRPCReactProvider and children, and includes ThemeProvider/CssBaseline */}
          <TRPCReactProvider>
            <MainLayout pageTitle="Armory Operations"> {/* Pass a default title */}
              {children}
            </MainLayout>
          </TRPCReactProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
