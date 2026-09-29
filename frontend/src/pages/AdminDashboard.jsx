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

export default function AdminDashboard() {
  const [commerciaux, setCommerciaux] = useState([]);
  const [clients, setClients] = useState([]);
  const [visits, setVisits] = useState([]);
  const [orders, setOrders] = useState([]);
  const [objectives, setObjectives] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get("/users").then((res) => setCommerciaux(res.data)).catch(() => {}),
      api.get("/clients").then((res) => setClients(res.data)).catch(() => {}),
      api.get("/visits").then((res) => setVisits(res.data)).catch(() => {}),
      api.get("/orders").then((res) => setOrders(res.data)).catch(() => {}),
      api
        .get(`/objectives?period=${currentPeriod()}`)
        .then((res) => setObjectives(res.data))
        .catch(() => setObjectives([])),
    ]).finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const isToday = (dateStr) => {
    const d = new Date(dateStr);
    return d.toDateString() === now.toDateString();
  };
  const isThisMonth = (dateStr) => {
    const d = new Date(dateStr);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  };

  const defaultObjective = objectives.find((o) => o.commercialId == null) || null;
  function effectiveObjectiveFor(commercialId) {
    return objectives.find((o) => o.commercialId === commercialId) || defaultObjective;
  }

  const totalClients = clients.length;
  const newClientsThisMonth = clients.filter((c) => isThisMonth(c.createdAt)).length;
  const totalProspects = clients.filter((c) => c.status === "PROSPECT").length;

  const visitsToday = visits.filter((v) => isToday(v.date)).length;
  const visitsTargetToday = commerciaux.reduce(
    (sum, c) => sum + (effectiveObjectiveFor(c.id)?.targetVisitsPerDay || 0),
    0
  );

  const visitsThisMonth = visits.filter((v) => isThisMonth(v.date));
  const ordersThisMonth = orders.filter((o) => isThisMonth(o.date));
  const conversionRate = visitsThisMonth.length
    ? Math.round((visitsThisMonth.filter((v) => v.orderPlaced).length / visitsThisMonth.length) * 100)
    : 0;

  const revenueThisMonth = ordersThisMonth.reduce((sum, o) => sum + o.total, 0);
  const revenueTarget = commerciaux.reduce(
    (sum, c) => sum + (effectiveObjectiveFor(c.id)?.targetRevenue || 0),
    0
  );
  const revenuePct = revenueTarget ? Math.round((revenueThisMonth / revenueTarget) * 100) : null;

  const performance = commerciaux.map((c) => {
    const cVisits = visitsThisMonth.filter((v) => v.commercialId === c.id).length;
    const cNewClients = clients.filter((cl) => cl.commercialId === c.id && isThisMonth(cl.createdAt)).length;
    const cOrders = ordersThisMonth.filter((o) => o.commercialId === c.id);
    const cRevenue = cOrders.reduce((sum, o) => sum + o.total, 0);
    const objective = effectiveObjectiveFor(c.id);
    const target = objective?.targetRevenue || null;
    const pct = target ? Math.round((cRevenue / target) * 100) : null;

    return {
      id: c.id,
      name: c.name,
      visits: cVisits,
      newClients: cNewClients,
      orders: cOrders.length,
      revenue: cRevenue,
      target,
      isDefaultTarget: objective ? objective.commercialId == null : false,
      pct,
    };
  }).sort((a, b) => (b.pct ?? -1) - (a.pct ?? -1));

  const totals = performance.reduce(
    (acc, p) => ({
      visits: acc.visits + p.visits,
      newClients: acc.newClients + p.newClients,
      orders: acc.orders + p.orders,
      revenue: acc.revenue + p.revenue,
      target: acc.target + (p.target || 0),
    }),
    { visits: 0, newClients: 0, orders: 0, revenue: 0, target: 0 }
  );
  const totalPct = totals.target ? Math.round((totals.revenue / totals.target) * 100) : null;

  function pctBadgeClass(pct) {
    if (pct === null) return "bg-grey-100 text-grey-500 border-grey-200";
    if (pct >= 90) return "bg-green-50 text-green-700 border-green-200";
    if (pct >= 75) return "bg-yellow-50 text-yellow-700 border-yellow-200";
    return "bg-red-50 text-red-700 border-red-200";
  }

  return (
    <Layout title="Tableau de bord (Admin)">
      <p className="text-sm text-grey-600 mb-4">
        Supervision globale des équipes commerciales et du chiffre d'affaires consolidé.
      </p>

      {!loading && !defaultObjective && objectives.length === 0 && (
        <div className="mb-4 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
          Aucun objectif par défaut n'est défini pour la période en cours. Les commerciaux sans
          objectif personnalisé n'auront aucune cible affichée.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
        <div className="bg-white border border-grey-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2 gap-2">
            <span className="text-xs font-medium text-grey-600 uppercase tracking-wide">
              Total clients
            </span>
            {newClientsThisMonth > 0 && (
              <span className="text-xs px-2 py-0.5 bg-[#348133] text-white border border-green-200 rounded whitespace-nowrap">
                +{newClientsThisMonth}
              </span>
            )}
          </div>
          <span className="text-2xl font-semibold text-ink">{totalClients}</span>
        </div>

        <div className="bg-white border border-grey-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-grey-600 uppercase tracking-wide">
              Total prospects
            </span>
          </div>
          <span className="text-2xl font-semibold text-ink">{totalProspects}</span>
        </div>

        <div className="bg-white border border-grey-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2 gap-2">
            <span className="text-xs font-medium text-grey-600 uppercase tracking-wide">
              Visites aujourd'hui
            </span>
            <span className="text-xs px-2 py-0.5 bg-grey-100 text-grey-600 border border-grey-200 rounded whitespace-nowrap">
              {visitsTargetToday ? `Obj: ${visitsTargetToday}` : "Objectif non défini"}
            </span>
          </div>
          <span className="text-2xl font-semibold text-ink">{visitsToday}</span>
        </div>

        <div className="bg-white border border-grey-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2 gap-2">
            <span className="text-xs font-medium text-grey-600 uppercase tracking-wide">
              Commandes ce mois
            </span>
            <span className="text-xs px-2 py-0.5 bg-[#348133] text-white border border-green-200 rounded whitespace-nowrap">
              {conversionRate}% conv.
            </span>
          </div>
          <span className="text-2xl font-semibold text-ink">{ordersThisMonth.length}</span>
        </div>

        <div className="bg-white border border-grey-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2 gap-2">
            <span className="text-xs font-medium text-grey-600 uppercase tracking-wide">
              CA ce mois
            </span>
            <span className="text-xs px-2 py-0.5 bg-grey-100 text-grey-600 border border-grey-200 rounded whitespace-nowrap">
              {revenueTarget ? `Obj: ${formatCurrency(revenueTarget)}` : "Objectif non défini"}
            </span>
          </div>
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-2xl font-semibold text-ink">{formatCurrency(revenueThisMonth)}</span>
            {revenuePct !== null && (
              <span className="text-xs text-grey-500">{revenuePct}%</span>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white border border-grey-200 rounded overflow-hidden">
        <div className="px-4 pt-4 pb-2">
          <h2 className="text-sm font-semibold text-ink">Performance par commercial</h2>
          <p className="text-xs text-grey-500">
            Indicateurs du mois en cours, triés par taux d'atteinte du CA décroissant.
          </p>
        </div>

        {!loading && performance.length === 0 && (
          <p className="text-sm text-grey-600 px-4 pb-4">Aucun commercial trouvé.</p>
        )}

        {performance.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left min-w-[720px]">
              <thead className="bg-[#F0F3FF] text-grey-600">
                <tr>
                  <th className="px-4 py-2">Commercial</th>
                  <th className="px-4 py-2">Visites</th>
                  <th className="px-4 py-2">Nouveaux clients</th>
                  <th className="px-4 py-2">Commandes</th>
                  <th className="px-4 py-2">CA réalisé</th>
                  <th className="px-4 py-2">Objectif CA</th>
                  <th className="px-4 py-2">Taux (%)</th>
                </tr>
              </thead>
              <tbody>
                {performance.map((p) => (
                  <tr key={p.id} className="border-t border-grey-100">
                    <td className="px-4 py-2 font-medium text-ink whitespace-nowrap">{p.name}</td>
                    <td className="px-4 py-2 text-grey-600">{p.visits}</td>
                    <td className="px-4 py-2 text-grey-600">{p.newClients}</td>
                    <td className="px-4 py-2 text-grey-600">{p.orders}</td>
                    <td className="px-4 py-2 text-grey-600 whitespace-nowrap">{formatCurrency(p.revenue)}</td>
                    <td className="px-4 py-2 text-grey-600 whitespace-nowrap">
                      {p.target ? (
                        <span className="inline-flex items-center gap-1">
                          {formatCurrency(p.target)}
                          {p.isDefaultTarget && (
                            <span className="text-[10px] px-1 py-0.5 bg-grey-100 text-grey-500 rounded uppercase">
                              défaut
                            </span>
                          )}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <span className={`text-xs px-2 py-0.5 rounded border whitespace-nowrap ${pctBadgeClass(p.pct)}`}>
                        {p.pct !== null ? `${p.pct}%` : "—"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-grey-200 bg-grey-200 font-medium">
                  <td className="px-4 py-2 text-ink whitespace-nowrap">Total consolidation</td>
                  <td className="px-4 py-2 text-ink">{totals.visits}</td>
                  <td className="px-4 py-2 text-ink">{totals.newClients}</td>
                  <td className="px-4 py-2 text-ink">{totals.orders}</td>
                  <td className="px-4 py-2 text-ink whitespace-nowrap">{formatCurrency(totals.revenue)}</td>
                  <td className="px-4 py-2 text-ink whitespace-nowrap">{totals.target ? formatCurrency(totals.target) : "—"}</td>
                  <td className="px-4 py-2">
                    <span className={`text-xs px-2 py-0.5 rounded border whitespace-nowrap ${pctBadgeClass(totalPct)}`}>
                      {totalPct !== null ? `${totalPct}%` : "—"}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}