import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../lib/api";

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("visits");

  useEffect(() => {
    api
      .get(`/clients/${id}`)
      .then((res) => setClient(res.data))
      .catch(() => setError("Impossible de charger ce client."));
  }, [id]);

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
      <div className="bg-white border border-grey-200 rounded-lg p-5 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-ink">{client.name}</h2>
            <p className="text-sm text-grey-600">{client.location || "—"} · {client.status}</p>
          </div>
          <button className="text-sm px-3 py-1.5 border border-grey-200 rounded hover:bg-grey-50">
            Éditer
          </button>
        </div>
      </div>

      <div className="flex gap-1 mb-4">
        <button
          onClick={() => setTab("visits")}
          className={`px-4 py-2 text-sm rounded-t ${tab === "visits" ? "bg-white border border-grey-200 border-b-white font-medium" : "text-grey-600"}`}
        >
          Visites
        </button>
        <button
          onClick={() => setTab("orders")}
          className={`px-4 py-2 text-sm rounded-t ${tab === "orders" ? "bg-white border border-grey-200 border-b-white font-medium" : "text-grey-600"}`}
        >
          Commandes
        </button>
      </div>

      <div className="bg-white border border-grey-200 rounded-lg p-4 -mt-px">
        {tab === "visits" && (
          <>
            {(!client.visits || client.visits.length === 0) && (
              <p className="text-sm text-grey-600">Aucune visite enregistrée.</p>
            )}
            {client.visits?.map((v) => (
              <div key={v.id} className="text-sm py-2 border-t border-grey-100 first:border-t-0">
                {new Date(v.date).toLocaleDateString("fr-FR")} — {v.result}
              </div>
            ))}
          </>
        )}

        {tab === "orders" && (
          <>
            {(!client.orders || client.orders.length === 0) && (
              <p className="text-sm text-grey-600">Aucune commande enregistrée.</p>
            )}
            {client.orders?.map((o) => (
              <div key={o.id} className="text-sm py-2 border-t border-grey-100 first:border-t-0">
                {new Date(o.date).toLocaleDateString("fr-FR")} — {o.total} DA — {o.status}
              </div>
            ))}
          </>
        )}
      </div>
    </Layout>
  );
}