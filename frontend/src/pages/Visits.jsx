import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import VisitFormModal from "../components/VisitFormModal";
import api from "../lib/api";

export default function Visits() {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingVisit, setEditingVisit] = useState(null);

  useEffect(() => {
    loadVisits();
  }, []);

  function loadVisits() {
    setLoading(true);
    api
      .get("/visits")
      .then((res) => setVisits(Array.isArray(res.data) ? res.data : []))
      .catch(() => setError("Impossible de charger les visites."))
      .finally(() => setLoading(false));
  }

  const thisMonth = new Date().getMonth();
  const visitsThisMonth = visits.filter(
    (v) => new Date(v.date).getMonth() === thisMonth
  ).length;
  const ordersFromVisits = visits.filter((v) => v.orderPlaced).length;
  const upcomingFollowUps = visits.filter((v) => {
    if (!v.nextActionDate) return false;
    const diffDays = (new Date(v.nextActionDate) - new Date()) / 86400000;
    return diffDays >= 0 && diffDays <= 7;
  }).length;

  return (
    <Layout title="Mes visites">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-grey-600">{visits.length} visites au total</p>
        <button
          onClick={() => setShowModal(true)}
          className="bg-ink text-white text-sm px-4 py-2 rounded hover:bg-charcoal"
        >
          + Nouvelle visite
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-grey-200 rounded-lg p-4">
          <p className="text-2xl font-semibold text-ink">{visitsThisMonth}</p>
          <p className="text-sm text-grey-600">Visites ce mois</p>
        </div>
        <div className="bg-white border border-grey-200 rounded-lg p-4">
          <p className="text-2xl font-semibold text-ink">{ordersFromVisits}</p>
          <p className="text-sm text-grey-600">Commandes décrochées</p>
        </div>
        <div className="bg-white border border-grey-200 rounded-lg p-4">
          <p className="text-2xl font-semibold text-ink">{upcomingFollowUps}</p>
          <p className="text-sm text-grey-600">Relances cette semaine</p>
        </div>
      </div>

      <div className="bg-white border border-grey-200  overflow-hidden">
        {error && <p className="p-4 text-sm text-grey-600">{error}</p>}
        {loading && <p className="p-4 text-sm text-grey-600">Chargement...</p>}
        {!loading && !error && visits.length === 0 && (
          <p className="p-4 text-sm text-grey-600">Aucune visite enregistrée.</p>
        )}

        {!loading && visits.length > 0 && (
          <table className="w-full text-sm text-left">
            <thead className="bg-[#E7EEFE] text-grey-600">
              <tr>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Client</th>
                <th className="px-4 py-2">Résultat</th>
                <th className="px-4 py-2">Commentaire</th>
                <th className="px-4 py-2">Commande</th>
                <th className="px-4 py-2">Prochaine relance</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>


              {visits.map((v) => (
                <tr key={v.id} className="border-t border-grey-200 hover:bg-grey-50">
  <td className="px-4 py-2 text-grey-600 whitespace-nowrap">
    {new Date(v.date).toLocaleDateString("fr-FR")}
  </td>
  <td className="px-4 py-2 font-medium text-ink">
    {v.client?.name || "—"}
  </td>
  <td className="px-4 py-2 text-grey-600">{v.result}</td>
  <td className="px-4 py-2 text-grey-600 max-w-xs truncate">{v.comment || "—"}</td>
  <td className="px-4 py-2">
    <span
      className={`px-2 py-0.5 rounded text-xs font-semibold border ${
        v.orderPlaced
          ? "bg-green-50 text-green-700 border-green-200"
          : "bg-red-50 text-red-700 border-red-200"
      }`}
    >
      {v.orderPlaced ? "OUI" : "NON"}
    </span>
  </td>
  <td className="px-4 py-2 text-grey-600 whitespace-nowrap">
    {v.nextActionDate
      ? new Date(v.nextActionDate).toLocaleDateString("fr-FR")
      : "—"}
  </td>
  <td className="px-4 py-2 text-right">
    <button
      onClick={() => setEditingVisit(v)}
      className="text-xs px-2 py-1 border border-grey-200 rounded hover:bg-grey-100"
    >
      Modifier
    </button>
  </td>
</tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <VisitFormModal
          onClose={() => setShowModal(false)}
          onCreated={() => loadVisits()}
        />
      )}

      {editingVisit && (
        <VisitFormModal
          existingVisit={editingVisit}
          onClose={() => setEditingVisit(null)}
          onUpdated={() => {
            setEditingVisit(null);
            loadVisits();
          }}
        />
      )}
    </Layout>
  );
}