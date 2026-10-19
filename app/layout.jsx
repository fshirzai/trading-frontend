import Script from "next/script";
import "./globals.css";
export const metadata = {
  title: "Shirzai Trading | Trade with confidence",
  description:
    "Wholesale agricultural products, transparent orders and border delivery.",
  referrer: "no-referrer",
  robots: { index: false, follow: false },
};
export default function Layout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Script src="/theme-init.js" strategy="beforeInteractive" />
        {children}
      </body>
    </html>
  );
}
