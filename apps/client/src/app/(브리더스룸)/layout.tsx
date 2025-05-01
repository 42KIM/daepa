export default function BrLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  <div id="br-page" className="mx-auto min-h-screen bg-blue-50">
    {children}
  </div>;
}
