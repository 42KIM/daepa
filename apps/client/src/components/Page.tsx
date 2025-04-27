function Page({ children }: { children: React.ReactNode }) {
  return (
    <div id="page" className="mx-auto min-h-screen max-w-[640px] bg-amber-50">
      {children}
    </div>
  );
}

export default Page;
