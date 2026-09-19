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
      <aside className="w-56 bg-[#121C28] text-white flex flex-col shrink-0">
        <div className="h-16 flex items-center px-5 border-b border-white/10 bg-black">
          <span className="font-semibold tracking-wide text-sm ">APEX CRM</span>
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
          <h1 className="text-base text-xl font-semibold text-ink">{title}</h1>
          <div className="flex items-center gap-3">
            <span className="text-md text-grey-600 px-2 py-0.5">{user?.name}</span>
            <span className="text-xs px-2 py-0.5 bg-[#E2E8F8] border border-grey-200 rounded text-grey-600">
              {user?.role}
            </span>
            <button
              onClick={handleLogout}
              className="text-xs text-white px-2 py-0.5 bg-black border  rounded text-grey-600"
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