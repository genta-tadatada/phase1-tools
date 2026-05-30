import "./portal.css";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="portal-page" style={{ colorScheme: "light", backgroundColor: "#ffffff" }}>
      {children}
    </div>
  );
}
