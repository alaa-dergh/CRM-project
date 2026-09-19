import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import CommercialFormModal from "../components/CommercialFormModal";
import api from "../lib/api";

export default function Commerciaux() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  function loadUsers() {
    setLoading(true);
    api
      .get("/users")
      .then((res) => setUsers(Array.isArray(res.data) ? res.data : []))
      .catch(() => setError("Impossible de charger les commerciaux."))
      .finally(() => setLoading(false));
  }

  async function toggleStatus(user) {
    try {
      const { data } = await api.put(`/users/${user.id}`, { isActive: !user.isActive });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, ...data } : u)));
    } catch {
      setError("Impossible de changer le statut de ce compte.");
    }
  }

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = users.filter((u) => u.isActive).length;
  const inactiveCount = users.length - activeCount;
  const totalClients = users.reduce((sum, u) => sum + (u._count?.clients || 0), 0);

  return (
    <Layout title="Équipe commerciale">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-grey-600">
          {users.length} commerciaux enregistrés dans la console de gestion centrale.
        </p>
        <button
          onClick={() => setShowModal(true)}
          className="bg-ink text-white text-sm px-4 py-2 rounded hover:bg-charcoal"
        >
          + Ajouter un commercial
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-grey-200 rounded-lg p-4">
          <p className="text-2xl font-semibold text-ink">{activeCount}</p>
          <p className="text-sm text-grey-600">Commerciaux actifs</p>
        </div>
        <div className="bg-white border border-grey-200 rounded-lg p-4">
          <p className="text-2xl font-semibold text-ink">{totalClients}</p>
          <p className="text-sm text-grey-600">Portefeuille clients total</p>
        </div>
        <div className="bg-white border border-grey-200 rounded-lg p-4">
          <p className="text-2xl font-semibold text-ink">{inactiveCount}</p>
          <p className="text-sm text-grey-600">Comptes inactifs</p>
        </div>
      </div>

      <input
        type="text"
        placeholder="Rechercher un commercial..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full h-9 px-3 border border-grey-200 rounded text-sm mb-4 focus:outline-none focus:border-ink"
      />

      <div className="bg-white border border-grey-200 rounded-lg overflow-hidden">
        {error && <p className="p-4 text-sm text-grey-600">{error}</p>}
        {loading && <p className="p-4 text-sm text-grey-600">Chargement...</p>}
        {!loading && !error && filtered.length === 0 && (
          <p className="p-4 text-sm text-grey-600">Aucun commercial trouvé.</p>
        )}

        {!loading && filtered.length > 0 && (
          <table className="w-full text-sm text-left">
            <thead className="bg-grey-50 text-grey-600">
              <tr>
                <th className="px-4 py-2">Nom</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Région</th>
                <th className="px-4 py-2">Clients</th>
                <th className="px-4 py-2">Statut</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-t border-grey-200 hover:bg-grey-50">
                  <td className="px-4 py-2 font-medium text-ink">{u.name}</td>
                  <td className="px-4 py-2 text-grey-600">{u.email}</td>
                  <td className="px-4 py-2 text-grey-600">{u.region || "—"}</td>
                  <td className="px-4 py-2 text-grey-600">{u._count?.clients ?? 0}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        u.isActive
                          ? "bg-ink text-white"
                          : "bg-grey-100 text-grey-600 border border-grey-200"
                      }`}
                    >
                      {u.isActive ? "Actif" : "Inactif"}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right whitespace-nowrap">
                    <button
                      onClick={() => setEditingUser(u)}
                      className="text-xs px-2 py-1 border border-grey-200 rounded hover:bg-grey-100 mr-1"
                    >
                      Éditer
                    </button>
                    <button
                      onClick={() => toggleStatus(u)}
                      className="text-xs px-2 py-1 border border-grey-200 rounded hover:bg-grey-100"
                    >
                      {u.isActive ? "Désactiver" : "Activer"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <CommercialFormModal
          onClose={() => setShowModal(false)}
          onCreated={() => loadUsers()}
        />
      )}

      {editingUser && (
        <CommercialFormModal
          existingUser={editingUser}
          onClose={() => setEditingUser(null)}
          onUpdated={(updated) => {
            setEditingUser(null);
            setUsers((prev) => prev.map((u) => (u.id === updated.id ? { ...u, ...updated } : u)));
          }}
        />
      )}
    </Layout>
  );
}