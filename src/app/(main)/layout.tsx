/**
 * 웹·앱 공통: 하단 탭은 `MainAppShell` 안에서 처리(지도·이력서 전환 시 전체 라우트 교체 없음).
 */
export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-dvh flex-col bg-zinc-100">
      <main className="min-h-0 flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
