import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import ClientFormModal from "../components/ClientFormModal";
import VisitFormModal from "../components/VisitFormModal";
import OrderFormModal from "../components/OrderFormModal";
import api from "../lib/api";
import OrderDetailModal from "../components/OrderDetailModal";
import { downloadCsv } from "../lib/ExportCsv";

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
const orderStatusLabels = {
  PENDING: "En attente",
  CONFIRMED: "Confirmée",
  DELIVERED: "Livrée",
  CANCELLED: "Annulée",
};

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("fr-FR");
}

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("visits");
  const [showEdit, setShowEdit] = useState(false);
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [editingVisit, setEditingVisit] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);
  const [viewingOrder, setViewingOrder] = useState(null);

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => {
    loadClient();
  }, [id]);

  function loadClient() {
    api
      .get(`/clients/${id}`)
      .then((res) => setClient(res.data))
      .catch(() => setError("Impossible de charger ce client."));
  }

  if (error) {
    return (
      <Layout title="Client introuvable">
        <p className="text-sm text-grey-600">{error}</p>
        <button onClick={() => navigate("/clients")} className="text-sm text-ink underline mt-2">
          Retour à la liste
        </button>
      </Layout>
    );
  }

  if (!client) {
    return (
      <Layout title="Chargement...">
        <p className="text-sm text-grey-600">Chargement...</p>
      </Layout>
    );
  }

  function inRange(dateStr) {
    if (!from && !to) return true;
    const d = new Date(dateStr);
    if (from && d < new Date(from)) return false;
    if (to && d > new Date(`${to}T23:59:59`)) return false;
    return true;
  }

  const filteredVisits = (client.visits || []).filter((v) => inRange(v.date));
  const filteredOrders = (client.orders || []).filter((o) => inRange(o.date));

  function exportClientHistory() {
    const combined = [
      ...filteredVisits.map((v) => ({ ...v, entryType: "visit" })),
      ...filteredOrders.map((o) => ({ ...o, entryType: "order" })),
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    const headers = ["Date", "Type", "Détails", "Commande / Statut", "Montant (DA)"];
    const rows = combined.map((entry) =>
      entry.entryType === "visit"
        ? [
            formatDate(entry.date),
            "Visite",
            entry.result + (entry.comment ? ` — ${entry.comment}` : ""),
            entry.orderPlaced ? "Commande signée" : "Pas de commande",
            "",
          ]
        : [
            formatDate(entry.date),
            "Commande",
            `${entry.items?.length || 0} produit(s)`,
            orderStatusLabels[entry.status] || entry.status,
            entry.total.toFixed(2),
          ]
    );

    const namePart = client.name.replace(/\s+/g, "_");
    const rangePart = `${from || "debut"}_a_${to || "fin"}`;
    downloadCsv(`historique_${namePart}_${rangePart}.csv`, headers, rows);
  }

  return (
    <Layout title={client.name}>
      <button onClick={() => navigate("/clients")} className="text-sm text-grey-600 hover:text-ink mb-3">
        ← Mes clients
      </button>

      <div className="bg-white border border-grey-200 rounded-lg p-5 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h2 className="text-lg font-semibold text-ink">{client.name}</h2>
              <span className={`px-2 py-0.5 rounded text-xs font-medium border ${statusStyles[client.status] || "bg-grey-100 text-grey-600 border-grey-200"}`}>
                {statusLabels[client.status] || client.status}
              </span>
            </div>
            <p className="text-sm text-grey-600">{client.location || "—"}</p>
            <p className="text-sm text-grey-600">{client.phone || "Aucun numéro enregistré"}</p>
          </div>
          <button
            onClick={() => setShowEdit(true)}
            className="text-sm px-3 py-1.5 border border-grey-200 rounded hover:bg-grey-50 self-start"
          >
            Éditer la fiche
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3 mb-4">
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
        {(from || to) && (
          <button
            onClick={() => {
              setFrom("");
              setTo("");
            }}
            className="h-9 px-3 border border-grey-200 text-sm rounded hover:bg-grey-50"
          >
            Réinitialiser
          </button>
        )}
        <button
          onClick={exportClientHistory}
          disabled={filteredVisits.length === 0 && filteredOrders.length === 0}
          className="h-9 px-4 border border-grey-200 text-sm rounded hover:bg-grey-50 disabled:opacity-40 sm:ml-auto"
        >
          ⤓ Exporter (CSV)
        </button>
      </div>

      <div className="flex gap-1 mb-4 overflow-x-auto">
        <button
          onClick={() => setTab("visits")}
          className={`px-4 py-2 text-sm rounded-t whitespace-nowrap ${tab === "visits" ? "bg-white border border-grey-200 border-b-white font-medium" : "text-grey-600"}`}
        >
          Visites {filteredVisits.length ? `(${filteredVisits.length})` : ""}
        </button>
        <button
          onClick={() => setTab("orders")}
          className={`px-4 py-2 text-sm rounded-t whitespace-nowrap ${tab === "orders" ? "bg-white border border-grey-200 border-b-white font-medium" : "text-grey-600"}`}
        >
          Commandes {filteredOrders.length ? `(${filteredOrders.length})` : ""}
        </button>
      </div>

      <div className="bg-white border border-grey-200 rounded-lg -mt-px overflow-hidden">
        {tab === "visits" && (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 py-3 border-b border-grey-200">
              <p className="text-sm text-ink">Journal chronologique des visites</p>
              <button
                onClick={() => setShowVisitModal(true)}
                className="bg-ink text-white text-xs px-3 py-1.5 rounded hover:bg-charcoal self-start sm:self-auto"
              >
                + Nouvelle visite
              </button>
            </div>

            {filteredVisits.length === 0 && (
              <p className="p-4 text-sm text-grey-600">
                {client.visits?.length ? "Aucune visite sur cette période." : "Aucune visite enregistrée."}
              </p>
            )}

            {filteredVisits.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left min-w-[800px]">
                  <thead className="bg-[#F9F9FF] text-grey-600">
                    <tr>
                      <th className="px-4 py-2">Date</th>
                      <th className="px-4 py-2">Résultat</th>
                      <th className="px-4 py-2">Commentaire</th>
                      <th className="px-4 py-2">Commande</th>
                      <th className="px-4 py-2">Prochaine relance</th>
                      <th className="px-4 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVisits.map((v) => (
                      <tr key={v.id} className="border-t border-grey-200">
                        <td className="px-4 py-2 text-grey-600 whitespace-nowrap">{formatDate(v.date)}</td>
                        <td className="px-4 py-2 text-ink">{v.result}</td>
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
                          {formatDate(v.nextActionDate)}
                        </td>
                        <td className="px-4 py-2 text-right whitespace-nowrap">
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
              </div>
            )}
          </>
        )}

        {tab === "orders" && (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 py-3 border-b border-grey-200">
              <p className="text-sm text-ink">Historique des commandes</p>
              <button
                onClick={() => setShowOrderModal(true)}
                className="bg-ink text-white text-xs px-3 py-1.5 rounded hover:bg-charcoal self-start sm:self-auto"
              >
                + Nouvelle commande
              </button>
            </div>

            {filteredOrders.length === 0 && (
              <p className="p-4 text-sm text-grey-600">
                {client.orders?.length ? "Aucune commande sur cette période." : "Aucune commande enregistrée."}
              </p>
            )}

            {filteredOrders.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left min-w-[600px]">
                  <thead className="bg-[#F9F9FF] text-grey-600">
                    <tr>
                      <th className="px-4 py-2">Date</th>
                      <th className="px-4 py-2">Produits</th>
                      <th className="px-4 py-2 text-right">Total</th>
                      <th className="px-4 py-2">Statut</th>
                      <th className="px-4 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((o) => (
                      <tr key={o.id} className="border-t border-grey-200">
                        <td className="px-4 py-2 text-grey-600 whitespace-nowrap">{formatDate(o.date)}</td>
                        <td className="px-4 py-2 text-grey-600">
                          {o.items?.length || 0} produit{(o.items?.length || 0) > 1 ? "s" : ""}
                        </td>
                        <td className="px-4 py-2 text-right font-medium text-ink whitespace-nowrap">{o.total.toFixed(2)} DA</td>
                        <td className="px-4 py-2">
                          <span className="px-2 py-0.5 bg-grey-100 border border-grey-200 rounded text-xs text-grey-600 whitespace-nowrap">
                            {orderStatusLabels[o.status] || o.status}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right">
                          <button
                            onClick={() => setEditingOrder(o)}
                            className="text-xs px-2 py-1 border border-grey-200 rounded hover:bg-grey-100 whitespace-nowrap"
                          >
                            Modifier
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {showEdit && (
        <ClientFormModal
          existingClient={client}
          onClose={() => setShowEdit(false)}
          onUpdated={(updated) => setClient({ ...client, ...updated })}
        />
      )}

      {showVisitModal && (
        <VisitFormModal
          presetClientId={client.id}
          onClose={() => setShowVisitModal(false)}
          onCreated={() => {
            setShowVisitModal(false);
            loadClient();
          }}
        />
      )}

      {showOrderModal && (
        <OrderFormModal
          presetClientId={client.id}
          onClose={() => setShowOrderModal(false)}
          onCreated={() => {
            setShowOrderModal(false);
            loadClient();
          }}
        />
      )}

      {editingVisit && (
        <VisitFormModal
          existingVisit={editingVisit}
          onClose={() => setEditingVisit(null)}
          onUpdated={() => {
            setEditingVisit(null);
            loadClient();
          }}
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
            loadClient();
          }}
        />
      )}
    </Layout>
  );
}