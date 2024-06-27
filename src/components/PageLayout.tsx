export function PageLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={"page-layout"}>
      <div className={"page-content"}>{children}</div>
    </div>
  );
}
