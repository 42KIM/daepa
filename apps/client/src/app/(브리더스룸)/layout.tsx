export default function BrLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div id="br-page" className="mx-auto min-h-screen">
      {children}
    </div>
  );
}
