
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import ClientFormModal from "../components/ClientFormModal";
import VisitFormModal from "../components/VisitFormModal";
import OrderFormModal from "../components/OrderFormModal";
import api from "../lib/api";
import OrderDetailModal from "../components/OrderDetailModal";
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

  return (
    <Layout title={client.name}>
      <button onClick={() => navigate("/clients")} className="text-sm text-grey-600 hover:text-ink mb-3">
        ← Mes clients
      </button>

      <div className="bg-white border border-grey-200 rounded-lg p-5 mb-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
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
            className="text-sm px-3 py-1.5 border border-grey-200 rounded hover:bg-grey-50"
          >
            Éditer la fiche
          </button>
        </div>
      </div>

      <div className="flex gap-1 mb-4">
        <button
          onClick={() => setTab("visits")}
          className={`px-4 py-2 text-sm rounded-t ${tab === "visits" ? "bg-white border border-grey-200 border-b-white font-medium" : "text-grey-600"}`}
        >
          Visites {client.visits?.length ? `(${client.visits.length})` : ""}
        </button>
        <button
          onClick={() => setTab("orders")}
          className={`px-4 py-2 text-sm rounded-t ${tab === "orders" ? "bg-white border border-grey-200 border-b-white font-medium" : "text-grey-600"}`}
        >
          Commandes {client.orders?.length ? `(${client.orders.length})` : ""}
        </button>
      </div>

      <div className="bg-white border border-grey-200 rounded-lg -mt-px overflow-hidden">
        {tab === "visits" && (
          <>
            <div className="flex items-center justify-between px-4 py-3 border-b border-grey-200">
              <p className="text-sm text-ink">Journal chronologique des visites</p>
              <button
                onClick={() => setShowVisitModal(true)}
                className="bg-ink text-white text-xs px-3 py-1.5 rounded hover:bg-charcoal"
              >
                + Nouvelle visite
              </button>
            </div>

            {(!client.visits || client.visits.length === 0) && (
              <p className="p-4 text-sm text-grey-600">Aucune visite enregistrée.</p>
            )}

            {client.visits?.length > 0 && (
              <table className="w-full text-sm text-left">
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
                  {client.visits.map((v) => (
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
          </>
        )}

        {tab === "orders" && (
          <>
            <div className="flex items-center justify-between px-4 py-3 border-b border-grey-200">
              <p className="text-sm text-ink">Historique des commandes</p>
              <button
                onClick={() => setShowOrderModal(true)}
                className="bg-ink text-white text-xs px-3 py-1.5 rounded hover:bg-charcoal"
              >
                + Nouvelle commande
              </button>
            </div>

            {(!client.orders || client.orders.length === 0) && (
              <p className="p-4 text-sm text-grey-600">Aucune commande enregistrée.</p>
            )}

            {client.orders?.length > 0 && (
              <table className="w-full text-sm text-left">
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
                  {client.orders.map((o) => (
                    <tr key={o.id} className="border-t border-grey-200">
                      <td className="px-4 py-2 text-grey-600 whitespace-nowrap">{formatDate(o.date)}</td>
                      <td className="px-4 py-2 text-grey-600">
                        {o.items?.length || 0} produit{(o.items?.length || 0) > 1 ? "s" : ""}
                      </td>
                      <td className="px-4 py-2 text-right font-medium text-ink">{o.total.toFixed(2)} DA</td>
                      <td className="px-4 py-2">
                        <span className="px-2 py-0.5 bg-grey-100 border border-grey-200 rounded text-xs text-grey-600">
                          {orderStatusLabels[o.status] || o.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right">
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