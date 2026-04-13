export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-zinc-100">
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 py-8">
        {children}
      </div>
    </div>
  );
}
