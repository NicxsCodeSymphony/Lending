import { Sidebar } from "../components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 p-4 md:p-6 md:ml-16">
        <div className="w-full">
          {children}
        </div>
      </main>
    </div>
  );
}