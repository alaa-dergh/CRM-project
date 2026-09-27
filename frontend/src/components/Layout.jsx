import { useState } from "react";
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const links = user?.role === "ADMIN" ? adminLinks : commercialLinks;

  function handleLogout() {
    logout();
    navigate("/login");
  }

  function handleNavigate(path) {
    navigate(path);
    setSidebarOpen(false); // referme le drawer après un clic sur mobile
  }

  return (
    <div className="min-h-screen flex bg-white">
      {/* Backdrop mobile : ferme le drawer au clic en dehors */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 md:w-56 bg-[#121C28] text-white flex flex-col shrink-0 transform transition-transform duration-200 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        <div className="h-16 flex items-center justify-between px-5 border-b border-white/10 bg-black shrink-0">
          <span className="font-semibold tracking-wide text-sm">APEX CRM</span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-white/70 hover:text-white text-lg leading-none"
            aria-label="Fermer le menu"
          >
            ✕
          </button>
        </div>
        <nav className="flex-1 py-4 overflow-y-auto">
          {links.map((link) => {
            const active =
              link.path === "/dashboard" || link.path === "/admin"
                ? location.pathname === link.path
                : location.pathname.startsWith(link.path);
            return (
              <a
                key={link.path}
                href={link.path}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavigate(link.path);
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

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-grey-200 flex items-center justify-between px-4 md:px-6 bg-white shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden text-ink text-xl leading-none shrink-0"
              aria-label="Ouvrir le menu"
            >
              ☰
            </button>
            <h1 className="text-lg md:text-xl font-semibold text-ink truncate">{title}</h1>
          </div>
          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            <span className="hidden sm:inline text-sm md:text-md text-grey-600 px-2 py-0.5 truncate max-w-[140px]">
              {user?.name}
            </span>
            <span className="text-xs px-2 py-0.5 bg-[#E2E8F8] border border-grey-200 rounded text-grey-600">
              {user?.role}
            </span>
            <button
              onClick={handleLogout}
              className="text-xs text-white px-2 py-0.5 bg-black border rounded text-grey-600 whitespace-nowrap"
            >
              Déconnexion
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 bg-grey-50 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}