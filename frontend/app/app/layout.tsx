import { AuthGuard } from "../../components/auth/AuthGuard";
import { Sidebar } from "../../components/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex h-screen bg-[#F5F3FF]">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-5xl px-8 py-8 lg:px-12 lg:py-10">
            {children}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
