import "./portal.css";
import { ForceLight } from "@/components/portal/ForceLight";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="portal-page">
      <ForceLight />
      {children}
    </div>
  );
}
