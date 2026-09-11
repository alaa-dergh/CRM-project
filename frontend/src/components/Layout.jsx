import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";

const commercialLinks = [
  { path: "/dashboard", label: "Tableau de bord" },
  { path: "/clients", label: "Mes clients" },
  { path: "/visits", label: "Mes visites" },
  { path: "/orders", label: "Mes commandes" },
  { path: "/objectives", label: "Mes objectifs" },
];

const adminLinks = [
  { path: "/admin", label: "Tableau de bord" },
  { path: "/admin/clients", label: "Clients" },
  { path: "/admin/reps", label: "Commerciaux" },
  { path: "/admin/objectives", label: "Objectifs" },
];

export default function Layout({ children, title }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const links = user?.role === "ADMIN" ? adminLinks : commercialLinks;

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen flex bg-white">
      <aside className="w-56 bg-ink text-white flex flex-col shrink-0">
        <div className="h-16 flex items-center px-5 border-b border-white/10">
          <span className="font-semibold tracking-wide text-sm">SALES CRM</span>
        </div>
        <nav className="flex-1 py-4">
          {links.map((link) => {
           const active = link.path === "/dashboard" || link.path === "/admin"
           ? location.pathname === link.path
           : location.pathname.startsWith(link.path);
            return (
              <a
                key={link.path}
                href={link.path}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(link.path);
                }}
                className={`block px-5 py-2.5 text-sm ${
                  active
                    ? "bg-white/10 text-white border-l-2 border-white"
                    : "text-grey-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {link.label}
              </a>
            );
          })}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="h-16 border-b border-grey-200 flex items-center justify-between px-6 bg-white">
          <h1 className="text-base font-semibold text-ink">{title}</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-grey-600">{user?.name}</span>
            <span className="text-xs px-2 py-0.5 bg-grey-100 border border-grey-200 rounded text-grey-600">
              {user?.role}
            </span>
            <button
              onClick={handleLogout}
              className="text-sm text-grey-600 hover:text-ink"
            >
              Déconnexion
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 bg-grey-50">{children}</main>
      </div>
    </div>
  );
}