function BrPage({ children }: { children: React.ReactNode }) {
  return (
    <div id="br-page" className="mx-auto min-h-screen bg-blue-50">
      {children}
    </div>
  );
}

export default BrPage;
