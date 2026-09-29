import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../lib/api";

function formatCurrency(amount) {
  return `${Math.round(amount || 0).toLocaleString("fr-FR")} DA`;
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("fr-FR");
}

export default function CommercialDashboard() {
  const [clients, setClients] = useState([]);
  const [visits, setVisits] = useState([]);
  const [orders, setOrders] = useState([]);
  const [progress, setProgress] = useState(null);
  const [progressError, setProgressError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get("/clients").then((res) => setClients(res.data)).catch(() => {}),
      api.get("/visits").then((res) => setVisits(res.data)).catch(() => {}),
      api.get("/orders").then((res) => setOrders(res.data)).catch(() => {}),
      api
        .get("/objectives/progress")
        .then((res) => {
          setProgress(res.data);
          setProgressError(null);
        })
        .catch((err) => {
          console.error("Erreur /objectives/progress:", err);
          setProgress(null);
          setProgressError(
            err?.response?.data?.error ||
              err?.message ||
              "Impossible de charger les objectifs."
          );
        }),
    ]).finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const isThisMonth = (dateStr) => {
    const d = new Date(dateStr);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  };

  const totalClients = clients.length;
  const newClientsThisMonth = clients.filter((c) => isThisMonth(c.createdAt)).length;
  const activeClients = clients.filter((c) => c.status === "ACTIVE").length;
  const retentionRate = totalClients ? Math.round((activeClients / totalClients) * 100) : 0;

  const visitsThisMonth = visits.filter((v) => isThisMonth(v.date));
  const visitsCountThisMonth = visitsThisMonth.length;

  const ordersThisMonth = orders.filter((o) => isThisMonth(o.date));
  const ordersCountThisMonth = ordersThisMonth.length;
  const revenueFromOrdersList = ordersThisMonth.reduce((sum, o) => sum + o.total, 0);
  const avgBasket = ordersCountThisMonth ? revenueFromOrdersList / ordersCountThisMonth : 0;
  const conversionRate = visitsCountThisMonth
    ? Math.round(
        (visitsThisMonth.filter((v) => v.orderPlaced).length / visitsCountThisMonth) * 100
      )
    : 0;

  const contactsToday = progress?.contactsToday || { actual: 0, target: null };
  const ordersToday = progress?.ordersToday || { actual: 0, minimum: null };
  const revenueThisMonth = progress?.revenueThisMonth || { actual: 0, target: null };
  const tasks = progress?.tasks || [];

  const contactsPct =
    contactsToday.target != null && contactsToday.target > 0
      ? Math.round((contactsToday.actual / contactsToday.target) * 100)
      : null;
  const revenuePct =
    revenueThisMonth.target != null && revenueThisMonth.target > 0
      ? Math.round((revenueThisMonth.actual / revenueThisMonth.target) * 100)
      : null;
  const ordersOk =
    ordersToday.minimum != null && ordersToday.minimum > 0
      ? ordersToday.actual >= ordersToday.minimum
      : null;

  const noObjectiveDefined = !progressError && progress && !progress.objective;

  const toFollowUp = clients.filter((c) => c.status === "TO_FOLLOW_UP");

  return (
    <Layout title="Tableau de bord">
      <p className="text-sm text-grey-600 mb-4">
        Aperçu de votre activité commerciale et relances prioritaires.
      </p>

      {progressError && (
        <div className="mb-4 px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          Erreur lors du chargement des objectifs : {progressError}
        </div>
      )}

      {noObjectiveDefined && (
        <div className="mb-4 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
          Aucun objectif n'est enregistré pour vous sur la période en cours. Demandez à
          l'administrateur d'en définir un dans "Objectifs (Gestion)".
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-grey-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2 gap-2">
            <span className="text-xs font-medium text-grey-600 uppercase tracking-wide">
              Mes clients
            </span>
            {newClientsThisMonth > 0 && (
              <span className="text-xs px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded whitespace-nowrap">
                +{newClientsThisMonth} ce mois
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-2xl font-semibold text-ink">{totalClients}</span>
            <span className="text-xs text-grey-500">Comptes actifs : {activeClients}</span>
          </div>
          <div className="flex justify-between text-xs text-grey-600 mt-3 pt-2 border-t border-grey-100">
            <span>Taux de rétention</span>
            <span className="font-medium text-ink">{retentionRate}%</span>
          </div>
        </div>

        <div className="bg-white border border-grey-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2 gap-2">
            <span className="text-xs font-medium text-grey-600 uppercase tracking-wide">
              Visites aujourd'hui
            </span>
            <span className="text-xs px-2 py-0.5 bg-grey-100 text-grey-600 border border-grey-200 rounded whitespace-nowrap">
              {contactsToday.target != null ? `Obj: ${contactsToday.target}/jour` : "Objectif non défini"}
            </span>
          </div>
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-2xl font-semibold text-ink">{contactsToday.actual}</span>
            <span className="text-xs text-grey-500">Ce mois : {visitsCountThisMonth}</span>
          </div>
          <div className="flex justify-between text-xs text-grey-600 mt-3 pt-2 border-t border-grey-100">
            <span>Atteint</span>
            <span className="font-medium text-ink">
              {contactsPct !== null ? `${contactsPct}%` : "—"}
            </span>
          </div>
        </div>

        <div className="bg-white border border-grey-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2 gap-2">
            <span className="text-xs font-medium text-grey-600 uppercase tracking-wide">
              Commandes aujourd'hui
            </span>
            <span className="text-xs px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded whitespace-nowrap">
              {conversionRate}% conv.
            </span>
          </div>
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-2xl font-semibold text-ink">{ordersToday.actual}</span>
            <span className="text-xs text-grey-500">
              {ordersToday.minimum != null ? `Min: ${ordersToday.minimum}/jour` : "Minimum non défini"}
            </span>
          </div>
          <div className="flex justify-between text-xs text-grey-600 mt-3 pt-2 border-t border-grey-100">
            <span>Panier moyen (mois)</span>
            <span className="font-medium text-ink">{formatCurrency(avgBasket)}</span>
          </div>
        </div>

        <div className="bg-white border border-grey-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2 gap-2">
            <span className="text-xs font-medium text-grey-600 uppercase tracking-wide">
              CA ce mois
            </span>
            <span className="text-xs px-2 py-0.5 bg-grey-100 text-grey-600 border border-grey-200 rounded whitespace-nowrap">
              {revenueThisMonth.target != null
                ? `Obj: ${formatCurrency(revenueThisMonth.target)}`
                : "Objectif non défini"}
            </span>
          </div>
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-2xl font-semibold text-ink">
              {formatCurrency(revenueThisMonth.actual)}
            </span>
          </div>
          <div className="flex justify-between text-xs text-grey-600 mt-3 pt-2 border-t border-grey-100">
            <span>Progression</span>
            <span className="font-medium text-ink">
              {revenuePct !== null ? `${revenuePct}%` : "—"}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-grey-200 rounded-lg overflow-hidden">
          <h2 className="text-sm font-semibold text-ink px-4 pt-4 pb-2">Mes tâches</h2>
          {!loading && tasks.length === 0 && (
            <p className="text-sm text-grey-600 px-4 pb-4">Aucune tâche assignée.</p>
          )}
          {tasks.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left min-w-[420px]">
                <thead className="bg-[#F0F3FF] text-grey-600">
                  <tr>
                    <th className="px-4 py-2">Client</th>
                    <th className="px-4 py-2">Visites ce mois</th>
                    <th className="px-4 py-2">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((t) => (
                    <tr key={t.id} className="border-t border-grey-100">
                      <td className="px-4 py-2 font-medium text-ink">{t.client?.name || "—"}</td>
                      <td className="px-4 py-2 text-grey-600">
                        {t.done} / {t.timesPerMonth}
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`text-xs px-2 py-0.5 rounded border whitespace-nowrap ${
                            t.completed
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-yellow-50 text-yellow-700 border-yellow-200"
                          }`}
                        >
                          {t.completed ? "Objectif atteint" : "En cours"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white border border-grey-200 rounded-lg overflow-hidden">
          <h2 className="text-sm font-semibold text-ink px-4 pt-4 pb-2">Clients à relancer</h2>
          {toFollowUp.length === 0 && (
            <p className="text-sm text-grey-600 px-4 pb-4">Aucun client à relancer pour le moment.</p>
          )}
          {toFollowUp.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left min-w-[420px]">
                <thead className="bg-[#F0F3FF] text-grey-600">
                  <tr>
                    <th className="px-4 py-2">Nom</th>
                    <th className="px-4 py-2">Contact</th>
                    <th className="px-4 py-2">Dernière interaction</th>
                  </tr>
                </thead>
                <tbody>
                  {toFollowUp.map((c) => (
                    <tr key={c.id} className="border-t border-grey-100">
                      <td className="px-4 py-2 font-medium text-ink">{c.name}</td>
                      <td className="px-4 py-2 text-grey-600">{c.phone || "—"}</td>
                      <td className="px-4 py-2 text-grey-600 whitespace-nowrap">{formatDate(c.lastInteractionDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}