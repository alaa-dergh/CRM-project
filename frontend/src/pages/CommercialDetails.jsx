import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import OrderDetailModal from "../components/OrderDetailModal";
import api from "../lib/api";

const orderStatusLabels = {
  PENDING: "En attente",
  CONFIRMED: "Confirmée",
  DELIVERED: "Livrée",
  CANCELLED: "Annulée",
};

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("fr-FR");
}

export default function CommercialDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [commercial, setCommercial] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [viewingOrder, setViewingOrder] = useState(null);

  useEffect(() => {
    api.get(`/users/${id}`).then((res) => setCommercial(res.data)).catch(() => {});
    loadHistory();
  }, [id]);

  function loadHistory() {
    setLoading(true);
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);

    api
      .get(`/users/${id}/history?${params.toString()}`)
      .then((res) => setHistory(Array.isArray(res.data) ? res.data : []))
      .catch(() => setError("Impossible de charger l'historique."))
      .finally(() => setLoading(false));
  }

  const visitsCount = history.filter((h) => h.entryType === "visit").length;
  const ordersCount = history.filter((h) => h.entryType === "order").length;
  const totalRevenue = history
    .filter((h) => h.entryType === "order")
    .reduce((sum, o) => sum + o.total, 0);

  return (
    <Layout title={commercial ? commercial.name : "Chargement..."}>
      <button onClick={() => navigate("/admin/reps")} className="text-sm text-grey-600 hover:text-ink mb-3">
        ← Commerciaux
      </button>

      {commercial && (
        <div className="bg-white border border-grey-200 rounded-lg p-5 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-ink">{commercial.name}</h2>
              <p className="text-sm text-grey-600">{commercial.email}</p>
              <p className="text-sm text-grey-600">{commercial.region || "Région non assignée"}</p>
            </div>
            <span
              className={`px-2 py-0.5 rounded text-xs font-medium ${
                commercial.isActive
                  ? "bg-ink text-white"
                  : "bg-grey-100 text-grey-600 border border-grey-200"
              }`}
            >
              {commercial.isActive ? "Actif" : "Inactif"}
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-white border border-grey-200 rounded-lg p-4">
          <p className="text-2xl font-semibold text-ink">{visitsCount}</p>
          <p className="text-sm text-grey-600">Visites (période)</p>
        </div>
        <div className="bg-white border border-grey-200 rounded-lg p-4">
          <p className="text-2xl font-semibold text-ink">{ordersCount}</p>
          <p className="text-sm text-grey-600">Commandes (période)</p>
        </div>
        <div className="bg-white border border-grey-200 rounded-lg p-4">
          <p className="text-2xl font-semibold text-ink">{totalRevenue.toFixed(0)} DA</p>
          <p className="text-sm text-grey-600">CA (période)</p>
        </div>
      </div>

      <div className="flex items-end gap-3 mb-4">
        <div>
          <label className="block text-xs font-medium text-grey-600 mb-1">Du</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="h-9 px-3 border border-grey-200 rounded text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-grey-600 mb-1">Au</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="h-9 px-3 border border-grey-200 rounded text-sm"
          />
        </div>
        <button
          onClick={loadHistory}
          className="h-9 px-4 bg-ink text-white text-sm rounded hover:bg-charcoal"
        >
          Filtrer
        </button>
        {(from || to) && (
          <button
            onClick={() => {
              setFrom("");
              setTo("");
              setTimeout(loadHistory, 0);
            }}
            className="h-9 px-3 border border-grey-200 text-sm rounded hover:bg-grey-50"
          >
            Réinitialiser
          </button>
        )}
      </div>

      <div className="bg-white border border-grey-200 rounded-lg overflow-hidden">
        {error && <p className="p-4 text-sm text-grey-600">{error}</p>}
        {loading && <p className="p-4 text-sm text-grey-600">Chargement...</p>}
        {!loading && !error && history.length === 0 && (
          <p className="p-4 text-sm text-grey-600">Aucune activité pour cette période.</p>
        )}

        {!loading && history.length > 0 && (
          <table className="w-full text-sm text-left">
            <thead className="bg-grey-50 text-grey-600">
              <tr>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2">Client</th>
                <th className="px-4 py-2">Détails</th>
                <th className="px-4 py-2">Commande / Statut</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {history.map((entry) => (
                <tr key={`${entry.entryType}-${entry.id}`} className="border-t border-grey-200 hover:bg-grey-50">
                  <td className="px-4 py-2 text-grey-600 whitespace-nowrap">
                    {formatDate(entry.date)}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium border ${
                        entry.entryType === "visit"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {entry.entryType === "visit" ? "Visite" : "Commande"}
                    </span>
                  </td>
                  <td className="px-4 py-2 font-medium text-ink">{entry.client?.name || "—"}</td>

                  {entry.entryType === "visit" ? (
                    <>
                      <td className="px-4 py-2 text-grey-600">
                        <span className="text-ink">{entry.result}</span>
                        {entry.comment && (
                          <span className="text-grey-500"> — {entry.comment}</span>
                        )}
                        {entry.nextActionDate && (
                          <span className="block text-xs text-grey-400">
                            Relance : {formatDate(entry.nextActionDate)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-semibold border ${
                            entry.orderPlaced
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-red-50 text-red-700 border-red-200"
                          }`}
                        >
                          {entry.orderPlaced ? "OUI" : "NON"}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right text-grey-400">—</td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-2 text-grey-600">
                        {entry.items?.length || 0} produit{(entry.items?.length || 0) > 1 ? "s" : ""}
                        {" — "}
                        <span className="font-medium text-ink">{entry.total.toFixed(2)} DA</span>
                      </td>
                      <td className="px-4 py-2">
                        <span className="px-2 py-0.5 bg-grey-100 border border-grey-200 rounded text-xs text-grey-600">
                          {orderStatusLabels[entry.status] || entry.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <button
                          onClick={() => setViewingOrder(entry)}
                          className="text-xs px-2 py-1 border border-grey-200 rounded hover:bg-grey-100"
                        >
                          Voir détail
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {viewingOrder && (
        <OrderDetailModal order={viewingOrder} onClose={() => setViewingOrder(null)} />
      )}
    </Layout>
  );
}