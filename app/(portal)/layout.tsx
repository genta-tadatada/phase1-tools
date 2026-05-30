import "./portal.css";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <div className="portal-page">{children}</div>;
}
