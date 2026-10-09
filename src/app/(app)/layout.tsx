import { RealSidebar } from "@/components/RealSidebar";
import { WhatsAppButton } from "@/components/WhatsAppButton";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div id="app" className="app">
      <RealSidebar />
      <main className="content">
        <div className="content-inner" id="content">
          {children}
        </div>
      </main>
      <WhatsAppButton />
    </div>
  );
}
