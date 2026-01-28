import "./globals.css";

export const metadata = {
  title: " Employee Attendance & Leave Management",
  description: "Modern attendance and leave management system for organizations",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}