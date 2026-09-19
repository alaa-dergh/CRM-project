import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import OrderFormModal from "../components/OrderFormModal";
import api from "../lib/api";
import OrderDetailModal from "../components/OrderDetailModal";

const statusLabels = {
  PENDING: "En attente",
  CONFIRMED: "Confirmée",
  DELIVERED: "Livrée",
  CANCELLED: "Annulée",
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [viewingOrder, setViewingOrder] = useState(null);

  useEffect(() => {
    loadOrders();
  }, []);

  function loadOrders() {
    setLoading(true);
    api
      .get("/orders")
      .then((res) => setOrders(Array.isArray(res.data) ? res.data : []))
      .catch(() => setError("Impossible de charger les commandes."))
      .finally(() => setLoading(false));
  }

  const filtered = orders.filter((o) => !statusFilter || o.status === statusFilter);
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const thisMonthOrders = orders.filter(
    (o) => new Date(o.date).getMonth() === new Date().getMonth()
  ).length;

  return (
    <Layout title="Mes commandes">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-grey-600">{orders.length} commandes au total</p>
        <button
          onClick={() => setShowModal(true)}
          className="bg-ink text-white text-sm px-4 py-2 rounded hover:bg-charcoal"
        >
          + Nouvelle commande
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-grey-200 rounded-lg p-4">
          <p className="text-2xl font-semibold text-ink">{thisMonthOrders}</p>
          <p className="text-sm text-grey-600">Commandes ce mois</p>
        </div>
        <div className="bg-white border border-grey-200 rounded-lg p-4">
          <p className="text-2xl font-semibold text-ink">{totalRevenue.toFixed(0)} DA</p>
          <p className="text-sm text-grey-600">Chiffre d'affaires total</p>
        </div>
        <div className="bg-white border border-grey-200 rounded-lg p-4">
          <p className="text-2xl font-semibold text-ink">
            {orders.filter((o) => o.status === "PENDING").length}
          </p>
          <p className="text-sm text-grey-600">En attente</p>
        </div>
      </div>

      <div className="flex gap-3 mb-4">
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

      <div className="bg-white border border-grey-200  overflow-hidden">
        {error && <p className="p-4 text-sm text-grey-600">{error}</p>}
        {loading && <p className="p-4 text-sm text-grey-600">Chargement...</p>}
        {!loading && !error && filtered.length === 0 && (
          <p className="p-4 text-sm text-grey-600">Aucune commande trouvée.</p>
        )}

        {!loading && filtered.length > 0 && (
          <table className="w-full text-sm text-left">
            <thead className="bg-[#E7EEFE] text-grey-600">
              <tr>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Client</th>
                <th className="px-4 py-2">Produits</th>
                <th className="px-4 py-2 text-right">Total</th>
                <th className="px-4 py-2">Statut</th>
                <th className="px-4 py-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id} className="border-t border-grey-200 hover:bg-grey-50">
                  <td className="px-4 py-2 text-grey-600 whitespace-nowrap">
                    {new Date(o.date).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-4 py-2 font-medium text-ink">
                    {o.client?.name || "—"}
                  </td>
                  <td
                   className="px-4 py-2 text-grey-600 cursor-pointer hover:underline"
                   onClick={() => setViewingOrder(o)}
                   >
                  {o.items?.length || 0} produit{(o.items?.length || 0) > 1 ? "s" : ""}
                  </td>
                  <td className="px-4 py-2 text-right font-medium text-ink">
                    {o.total.toFixed(2)} DA
                  </td>
                  <td className="px-4 py-2">
                    <span className="px-2 py-0.5 bg-grey-100 border border-grey-200 rounded text-xs text-grey-600">
                      {statusLabels[o.status] || o.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right whitespace-nowrap">
                 <button
                    onClick={() => setViewingOrder(o)}
                    className="text-xs px-2 py-1 border border-grey-200 rounded hover:bg-grey-100 mr-1"
                 >
                  Voir détails
                 </button>
                 <button
                  onClick={() => setEditingOrder(o)}
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
        <OrderFormModal
          onClose={() => setShowModal(false)}
          onCreated={() => loadOrders()}
        />
      )}
      {viewingOrder && (
       <OrderDetailModal order={viewingOrder} onClose={() => setViewingOrder(null)} />
      )}

      {editingOrder && (
        <OrderFormModal
          existingOrder={editingOrder}
          onClose={() => setEditingOrder(null)}
          onUpdated={() => {
            setEditingOrder(null);
            loadOrders();
          }}
        />
      )}
    </Layout>
  );
}