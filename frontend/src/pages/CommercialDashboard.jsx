import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../lib/api";

function currentPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function formatCurrency(amount) {
  return `${Math.round(amount || 0).toLocaleString("fr-FR")} DA`;
}

export default function CommercialDashboard() {
  const [clients, setClients] = useState([]);
  const [visits, setVisits] = useState([]);
  const [orders, setOrders] = useState([]);
  const [objective, setObjective] = useState(null);

  useEffect(() => {
    api.get("/clients").then((res) => setClients(res.data)).catch(() => {});
    api.get("/visits").then((res) => setVisits(res.data)).catch(() => {});
    api.get("/orders").then((res) => setOrders(res.data)).catch(() => {});
    api
      .get(`/objectives?period=${currentPeriod()}`)
      .then((res) => setObjective(res.data?.[0] || null))
      .catch(() => setObjective(null));
  }, []);

  const now = new Date();
  const isThisMonth = (dateStr) => {
    const d = new Date(dateStr);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  };

  // --- Clients ---
  const totalClients = clients.length;
  const newClientsThisMonth = clients.filter((c) => isThisMonth(c.createdAt)).length;
  const activeClients = clients.filter((c) => c.status === "ACTIVE").length;
  const retentionRate = totalClients ? Math.round((activeClients / totalClients) * 100) : 0;

  // --- Visites ---
  const visitsThisMonth = visits.filter((v) => isThisMonth(v.date));
  const visitsCount = visitsThisMonth.length;
  const visitTarget = objective?.targetVisits || null;
  const visitPct = visitTarget ? Math.round((visitsCount / visitTarget) * 100) : null;

  // --- Commandes ---
  const ordersThisMonth = orders.filter((o) => isThisMonth(o.date));
  const ordersCount = ordersThisMonth.length;
  const revenueThisMonth = ordersThisMonth.reduce((sum, o) => sum + o.total, 0);
  const avgBasket = ordersCount ? revenueThisMonth / ordersCount : 0;
  const conversionRate = visitsCount
    ? Math.round((visitsThisMonth.filter((v) => v.orderPlaced).length / visitsCount) * 100)
    : 0;

  // --- CA ---
  const revenueTarget = objective?.targetRevenue || null;
  const revenuePct = revenueTarget ? Math.round((revenueThisMonth / revenueTarget) * 100) : null;

  const toFollowUp = clients.filter((c) => c.status === "TO_FOLLOW_UP");

  return (
    <Layout title="Tableau de bord">
      <p className="text-sm text-grey-600 mb-4">
        Aperçu de votre activité commerciale et relances prioritaires.
      </p>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {/* Mes clients */}
        <div className="bg-white border border-grey-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-grey-600 uppercase tracking-wide">
              Mes clients
            </span>
            {newClientsThisMonth > 0 && (
              <span className="text-xs px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded">
                +{newClientsThisMonth} ce mois
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-ink">{totalClients}</span>
            <span className="text-xs text-grey-500">Comptes actifs : {activeClients}</span>
          </div>
          <div className="flex justify-between text-xs text-grey-600 mt-3 pt-2 border-t border-grey-100">
            <span>Taux de rétention</span>
            <span className="font-medium text-ink">{retentionRate}%</span>
          </div>
        </div>

        {/* Visites ce mois */}
        <div className="bg-white border border-grey-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-grey-600 uppercase tracking-wide">
              Visites ce mois
            </span>
            <span className="text-xs px-2 py-0.5 bg-grey-100 text-grey-600 border border-grey-200 rounded">
              {visitTarget ? `Obj: ${visitTarget}` : "Objectif non défini"}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-ink">{visitsCount}</span>
          </div>
          <div className="flex justify-between text-xs text-grey-600 mt-3 pt-2 border-t border-grey-100">
            <span>Atteint</span>
            <span className="font-medium text-ink">{visitPct !== null ? `${visitPct}%` : "—"}</span>
          </div>
        </div>

        {/* Commandes ce mois */}
        <div className="bg-white border border-grey-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-grey-600 uppercase tracking-wide">
              Commandes ce mois
            </span>
            <span className="text-xs px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded">
              {conversionRate}% conv.
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-ink">{ordersCount}</span>
            <span className="text-xs text-grey-500">Sur {visitsCount} rdv</span>
          </div>
          <div className="flex justify-between text-xs text-grey-600 mt-3 pt-2 border-t border-grey-100">
            <span>Panier moyen</span>
            <span className="font-medium text-ink">{formatCurrency(avgBasket)}</span>
          </div>
        </div>

        {/* CA ce mois */}
        <div className="bg-white border border-grey-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-grey-600 uppercase tracking-wide">
              CA ce mois
            </span>
            <span className="text-xs px-2 py-0.5 bg-grey-100 text-grey-600 border border-grey-200 rounded">
              {revenueTarget ? `Obj: ${formatCurrency(revenueTarget)}` : "Objectif non défini"}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-ink">{formatCurrency(revenueThisMonth)}</span>
          </div>
          <div className="flex justify-between text-xs text-grey-600 mt-3 pt-2 border-t border-grey-100">
            <span>Progression</span>
            <span className="font-medium text-ink">{revenuePct !== null ? `${revenuePct}%` : "—"}</span>
          </div>
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