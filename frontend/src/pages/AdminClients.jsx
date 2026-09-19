import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import ClientFormModal from "../components/ClientFormModal";
import api from "../lib/api";

const statusLabels = {
  PROSPECT: "Prospect",
  ACTIVE: "Actif",
  INACTIVE: "Inactif",
  TO_FOLLOW_UP: "À relancer",
};

const statusStyles = {
  PROSPECT: "bg-[#F7F02C] text-black border-yellow-200",
  ACTIVE: "bg-[#25931D] text-white border-green-200",
  INACTIVE: "bg-[#CC1A17] text-white border-red-200",
  TO_FOLLOW_UP: "bg-ink text-white border-ink",
};

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("fr-FR");
}

function formatCurrency(amount) {
  return `${(amount || 0).toLocaleString("fr-FR")} DA`;
}

export default function AdminClients() {
  const [clients, setClients] = useState([]);
  const [commercials, setCommercials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [commercialFilter, setCommercialFilter] = useState("");
  const [selected, setSelected] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    Promise.all([api.get("/clients"), api.get("/users")])
      .then(([clientsRes, usersRes]) => {
        setClients(Array.isArray(clientsRes.data) ? clientsRes.data : []);
        setCommercials(Array.isArray(usersRes.data) ? usersRes.data : []);
      })
      .catch(() => setError("Impossible de charger les clients."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = clients.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || c.status === statusFilter;
    const matchesCommercial = !commercialFilter || c.commercialId === Number(commercialFilter);
    return matchesSearch && matchesStatus && matchesCommercial;
  });

  function toggleSelect(id) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function toggleSelectAll() {
    setSelected(selected.length === filtered.length ? [] : filtered.map((c) => c.id));
  }

  function resetFilters() {
    setSearch("");
    setStatusFilter("");
    setCommercialFilter("");
  }

  function exportSelection() {
    const rows = clients.filter((c) => selected.includes(c.id));
    const header = "Nom,Statut,Commercial,Localisation,Derniere visite,CA\n";
    const body = rows
      .map((c) =>
        [
          c.name,
          statusLabels[c.status] || c.status,
          c.commercial?.name || "",
          c.location || "",
          formatDate(c.lastVisitDate),
          c.totalRevenue || 0,
        ].join(",")
      )
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "clients_export.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Layout title="Clients (Global)">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-0.5 bg-grey-100 border border-grey-200 rounded font-medium text-grey-600">
            ADMIN
          </span>
          <p className="text-sm text-grey-600">
            {clients.length} clients enregistrés au catalogue national
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportSelection}
            disabled={selected.length === 0}
            className="text-sm px-4 py-2 border border-grey-200 rounded hover:bg-grey-50 disabled:opacity-40"
          >
            ⤓ Exporter la sélection
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="bg-ink text-white text-sm px-4 py-2 rounded hover:bg-charcoal"
          >
            + Nouveau client
          </button>
        </div>
      </div>

      <div className="flex gap-3 mb-4">
        <input
          type="text"
          placeholder="Rechercher par raison sociale, ville..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 h-9 px-3 border border-grey-200 rounded text-sm focus:outline-none focus:border-ink"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 px-3 border border-grey-200 rounded text-sm bg-white"
        >
          <option value="">Tous les statuts</option>
          {Object.entries(statusLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <select
          value={commercialFilter}
          onChange={(e) => setCommercialFilter(e.target.value)}
          className="h-9 px-3 border border-grey-200 rounded text-sm bg-white"
        >
          <option value="">Tous les commerciaux</option>
          {commercials.map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
        <button
          onClick={resetFilters}
          title="Réinitialiser les filtres"
          className="h-9 px-3 border border-grey-200 rounded hover:bg-grey-50 text-grey-600 text-sm"
        >
          ✕
        </button>
      </div>

      <div className="bg-white border border-grey-200 rounded-lg overflow-hidden">
        {error && <p className="p-4 text-sm text-grey-600">{error}</p>}
        {loading && <p className="p-4 text-sm text-grey-600">Chargement...</p>}
        {!loading && !error && filtered.length === 0 && (
          <p className="p-4 text-sm text-grey-600">Aucun client trouvé.</p>
        )}

        {!loading && filtered.length > 0 && (
          <table className="w-full text-sm text-left">
            <thead className="bg-[#E7EEFE] text-grey-600">
              <tr>
                <th className="px-4 py-2 w-10">
                  <input
                    type="checkbox"
                    checked={selected.length === filtered.length}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="px-4 py-2">Nom</th>
                <th className="px-4 py-2">Statut</th>
                <th className="px-4 py-2">Commercial responsable</th>
                <th className="px-4 py-2">Localisation</th>
                <th className="px-4 py-2">Dernière visite</th>
                <th className="px-4 py-2 text-right">CA global</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((client) => (
                <tr
                  key={client.id}
                  onClick={() => navigate(`/clients/${client.id}`)}
                  className="border-t border-grey-200 hover:bg-grey-50 cursor-pointer"
                >
                  <td className="px-4 py-2" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selected.includes(client.id)}
                      onChange={() => toggleSelect(client.id)}
                    />
                  </td>
                  <td className="px-4 py-2 font-medium text-ink">{client.name}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium border ${
                        statusStyles[client.status] || "bg-grey-100 text-grey-600 border-grey-200"
                      }`}
                    >
                      {statusLabels[client.status] || client.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-grey-600">{client.commercial?.name || "—"}</td>
                  <td className="px-4 py-2 text-grey-600">{client.location || "—"}</td>
                  <td className="px-4 py-2 text-grey-600 whitespace-nowrap">
                    {formatDate(client.lastVisitDate)}
                  </td>
                  <td className="px-4 py-2 text-right font-medium text-ink whitespace-nowrap">
                    {formatCurrency(client.totalRevenue)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/clients/${client.id}`);
                      }}
                      className="text-xs px-2 py-1 border border-grey-200 rounded hover:bg-grey-100"
                    >
                      Voir fiche
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="px-4 py-2 border-t border-grey-100 bg-grey-50 text-xs text-grey-500">
          Cliquer sur une ligne ouvre la fiche client complète (visites, commandes, historique complet partagé avec le commercial).
        </div>
      </div>

      {showModal && (
        <ClientFormModal
          onClose={() => setShowModal(false)}
          onCreated={(newClient) => setClients((prev) => [newClient, ...prev])}
        />
      )}
    </Layout>
  );
}