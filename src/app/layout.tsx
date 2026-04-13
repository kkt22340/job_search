import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "백구 — 백세까지 구인구직",
  description: "내 주변 일자리를 지도에서 찾아보세요.",
};

/** 모바일 웹·향후 앱(WebView) 공통 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f4f4f5",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="min-h-dvh text-[18px]">{children}</body>
    </html>
  );
}
