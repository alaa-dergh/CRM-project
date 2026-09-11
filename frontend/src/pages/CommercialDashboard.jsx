import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../lib/api";

export default function CommercialDashboard() {
  const [clients, setClients] = useState([]);

  useEffect(() => {
    api.get("/clients").then((res) => setClients(res.data)).catch(() => {});
  }, []);

  const toFollowUp = clients.filter((c) => c.status === "TO_FOLLOW_UP");

  return (
    <Layout title="Tableau de bord">
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-grey-200 rounded-lg p-4">
          <p className="text-2xl font-semibold text-ink">{clients.length}</p>
          <p className="text-sm text-grey-600">Mes clients</p>
        </div>
        <div className="bg-white border border-grey-200 rounded-lg p-4">
          <p className="text-2xl font-semibold text-ink">{toFollowUp.length}</p>
          <p className="text-sm text-grey-600">À relancer</p>
        </div>
        <div className="bg-white border border-grey-200 rounded-lg p-4">
          <p className="text-2xl font-semibold text-ink">—</p>
          <p className="text-sm text-grey-600">Visites ce mois</p>
        </div>
      </div>

      <div className="bg-white border border-grey-200 rounded-lg p-4">
        <h2 className="text-sm font-semibold text-ink mb-3">Clients à relancer</h2>
        {toFollowUp.length === 0 && (
          <p className="text-sm text-grey-600">Aucun client à relancer pour le moment.</p>
        )}
        {toFollowUp.map((c) => (
          <div key={c.id} className="text-sm py-2 border-t border-grey-100 first:border-t-0">
            {c.name}
          </div>
        ))}
      </div>
    </Layout>
  );
}