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

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    api
      .get("/clients")
      .then((res) => {
        if (mounted) setClients(Array.isArray(res.data) ? res.data : []);
      })
      .catch((err) => {
        console.error("Erreur lors du chargement des clients :", err);
        if (mounted) setError("Impossible de charger les clients.");
      })
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, []);

  const filtered = clients.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <Layout title="Mes clients">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-grey-600">{clients.length} clients au total</p>
        <button
          onClick={() => setShowModal(true)}
          className="bg-ink text-white text-sm px-4 py-2 rounded hover:bg-charcoal"
        >
          + Nouveau client
        </button>
      </div>

      <div className="flex gap-3 mb-4">
        <input
          type="text"
          placeholder="Rechercher un client..."
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
      </div>

      <div className="bg-white border border-grey-200 rounded-lg overflow-hidden">
        {error && <p className="p-4 text-sm text-grey-600">{error}</p>}

        {loading && <p className="p-4 text-sm text-grey-600">Chargement...</p>}

        {!loading && !error && filtered.length === 0 && (
          <p className="p-4 text-sm text-grey-600">Aucun client trouvé.</p>
        )}

        {!loading && filtered.length > 0 && (
          <table className="w-full text-sm text-left">
            <thead className="bg-grey-50 text-grey-600">
              <tr>
                <th className="px-4 py-2">Nom</th>
                <th className="px-4 py-2">Statut</th>
                <th className="px-4 py-2">Localisation</th>
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
                  <td className="px-4 py-2 font-medium text-ink">{client.name}</td>
                  <td className="px-4 py-2">
                    <span className="px-2 py-0.5 bg-grey-100 border border-grey-200 rounded text-xs text-grey-600">
                      {statusLabels[client.status] || client.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-grey-600">{client.location || "—"}</td>
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