import "./globals.css";
import { Providers } from "./providers";

export const metadata = {
  title: " Employee Attendance & Leave Management",
  description:
    "Modern attendance and leave management system for organizations",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
