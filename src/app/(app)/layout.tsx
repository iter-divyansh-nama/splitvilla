import { BottomNav } from "@/components/BottomNav";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative mx-auto min-h-screen max-w-lg bg-cloud pb-24">
      {children}
      <BottomNav />
    </div>
  );
}
