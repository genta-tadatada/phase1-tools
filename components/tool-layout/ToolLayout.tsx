import { ToolHeader } from "./ToolHeader";
import { AdBanner } from "./AdBanner";

interface ToolLayoutProps {
  title: string;
  children: React.ReactNode;
  adVisible?: boolean;
  adSlot?: string;
  adClient?: string;
}

export function ToolLayout({
  title,
  children,
  adVisible = true,
  adSlot,
  adClient,
}: ToolLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <ToolHeader title={title} />
      <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 md:px-8">
        <div className="max-w-2xl mx-auto w-full">{children}</div>
      </main>
      <AdBanner visible={adVisible} adSlot={adSlot} adClient={adClient} />
    </div>
  );
}
