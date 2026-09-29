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

function formatPeriodLabel(period) {
  const [year, month] = period.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

function lastMonths(count) {
  const months = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString("fr-FR", { month: "short" }),
      year: d.getFullYear(),
      month: d.getMonth(),
    });
  }
  return months;
}

export default function CommercialObjectives() {
  const [progress, setProgress] = useState(null);
  const [progressError, setProgressError] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api
        .get("/objectives/progress")
        .then((res) => {
          setProgress(res.data);
          setProgressError(null);
        })
        .catch((err) => {
          console.error("Erreur /objectives/progress:", err);
          setProgress(null);
          setProgressError(err?.response?.data?.error || "Impossible de charger vos objectifs.");
        }),
      api.get("/orders").then((res) => setOrders(res.data)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const contactsToday = progress?.contactsToday || { actual: 0, target: null };
  const ordersToday = progress?.ordersToday || { actual: 0, minimum: null };
  const revenueThisMonth = progress?.revenueThisMonth || { actual: 0, target: null };
  const tasks = progress?.tasks || [];
  const isDefaultObjective = Boolean(progress?.isDefaultObjective);
  const noObjectiveDefined = !progressError && progress && !progress.objective;

  const contactsPct =
    contactsToday.target != null && contactsToday.target > 0
      ? Math.min(100, Math.round((contactsToday.actual / contactsToday.target) * 100))
      : null;
  const ordersMet =
    ordersToday.minimum != null && ordersToday.minimum > 0
      ? ordersToday.actual >= ordersToday.minimum
      : null;
  const ordersPct =
    ordersToday.minimum != null && ordersToday.minimum > 0
      ? Math.min(100, Math.round((ordersToday.actual / ordersToday.minimum) * 100))
      : null;
  const revenuePct =
    revenueThisMonth.target != null && revenueThisMonth.target > 0
      ? Math.min(100, Math.round((revenueThisMonth.actual / revenueThisMonth.target) * 100))
      : null;
  const revenueRemaining =
    revenueThisMonth.target != null ? Math.max(0, revenueThisMonth.target - revenueThisMonth.actual) : null;

  const months = lastMonths(6);
  const monthlyRevenue = months.map((m) => {
    const total = orders
      .filter((o) => {
        const d = new Date(o.date);
        return d.getFullYear() === m.year && d.getMonth() === m.month;
      })
      .reduce((sum, o) => sum + o.total, 0);
    return { ...m, total };
  });
  const maxMonthly = Math.max(1, ...monthlyRevenue.map((m) => m.total));

  return (
    <Layout title="Mes objectifs">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <p className="text-sm text-grey-600">
          Suivi de vos objectifs commerciaux — {formatPeriodLabel(currentPeriod())}.
        </p>
        {progress?.objective && (
          <span
            className={`text-xs px-2 py-0.5 rounded border self-start sm:self-auto whitespace-nowrap ${
              isDefaultObjective
                ? "bg-grey-100 text-grey-600 border-grey-200"
                : "bg-[#F0F3FF] text-ink border-grey-200"
            }`}
          >
            {isDefaultObjective ? "Objectif par défaut" : "Objectif personnalisé"}
          </span>
        )}
      </div>

      {progressError && (
        <div className="mb-4 px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          Erreur lors du chargement de vos objectifs : {progressError}
        </div>
      )}

      {noObjectiveDefined && (
        <div className="mb-4 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
          Aucun objectif n'est enregistré pour vous sur la période en cours.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-grey-200 rounded-lg p-5">
          <p className="text-xs font-medium text-grey-500 uppercase tracking-wide mb-1">
            Indicateur 01
          </p>
          <h3 className="text-sm font-semibold text-ink mb-3">Visites aujourd'hui</h3>
          <div className="flex items-baseline gap-2 mb-2 flex-wrap">
            <span className="text-3xl font-bold text-ink">
              {contactsPct !== null ? `${contactsPct}%` : "—"}
            </span>
            <span className="text-xs text-grey-500">
              {contactsToday.actual} / {contactsToday.target ?? "—"} visites
            </span>
          </div>
          <div className="h-1.5 bg-grey-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-ink rounded-full"
              style={{ width: `${contactsPct ?? 0}%` }}
            />
          </div>
          <p className="text-xs text-grey-500 mt-2">
            {contactsToday.target != null
              ? `Cible : ${contactsToday.target} visites/jour`
              : "Aucune cible définie"}
          </p>
        </div>

        <div className="bg-white border border-grey-200 rounded-lg p-5">
          <p className="text-xs font-medium text-grey-500 uppercase tracking-wide mb-1">
            Indicateur 02
          </p>
          <h3 className="text-sm font-semibold text-ink mb-3">Commandes aujourd'hui</h3>
          <div className="flex items-baseline gap-2 mb-2 flex-wrap">
            <span className="text-3xl font-bold text-ink">
              {ordersPct !== null ? `${ordersPct}%` : "—"}
            </span>
            <span className="text-xs text-grey-500">
              {ordersToday.actual} / {ordersToday.minimum ?? "—"} commandes
            </span>
          </div>
          <div className="h-1.5 bg-grey-100 rounded-full overflow-hidden">
            <div className="h-full bg-ink rounded-full" style={{ width: `${ordersPct ?? 0}%` }} />
          </div>
          <p className="text-xs text-grey-500 mt-2">
            {ordersToday.minimum != null
              ? ordersMet
                ? "Minimum atteint aujourd'hui"
                : `Il manque ${ordersToday.minimum - ordersToday.actual} commande(s)`
              : "Aucun minimum défini"}
          </p>
        </div>

        <div className="bg-white border border-grey-200 rounded-lg p-5">
          <p className="text-xs font-medium text-grey-500 uppercase tracking-wide mb-1">
            Indicateur 03
          </p>
          <h3 className="text-sm font-semibold text-ink mb-3">Chiffre d'affaires réalisé</h3>
          <div className="flex items-baseline gap-2 mb-2 flex-wrap">
            <span className="text-3xl font-bold text-ink">
              {revenuePct !== null ? `${revenuePct}%` : "—"}
            </span>
            <span className="text-xs text-grey-500">{formatCurrency(revenueThisMonth.actual)}</span>
          </div>
          <div className="h-1.5 bg-grey-100 rounded-full overflow-hidden">
            <div className="h-full bg-ink rounded-full" style={{ width: `${revenuePct ?? 0}%` }} />
          </div>
          <p className="text-xs text-grey-500 mt-2">
            {revenueThisMonth.target != null
              ? `Reste ${formatCurrency(revenueRemaining)} avant la cible de ${formatCurrency(
                  revenueThisMonth.target
                )}`
              : "Aucune cible définie"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-grey-200 rounded-lg p-5">
          <h2 className="text-sm font-semibold text-ink mb-1">Historique CA</h2>
          <p className="text-xs text-grey-500 mb-4">
            Chiffre d'affaires réalisé sur les 6 derniers mois.
          </p>
          <div className="flex items-end justify-between gap-2 h-32">
            {monthlyRevenue.map((m) => {
              const isCurrent = m.key === currentPeriod();
              const heightPct = Math.max(4, Math.round((m.total / maxMonthly) * 100));
              return (
                <div key={m.key} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex items-end justify-center h-24">
                    <div
                      className={`w-6 sm:w-8 rounded-t ${isCurrent ? "bg-ink" : "bg-grey-200"}`}
                      style={{ height: `${heightPct}%` }}
                      title={formatCurrency(m.total)}
                    />
                  </div>
                  <span className={`text-[10px] sm:text-[11px] capitalize ${isCurrent ? "text-ink font-medium" : "text-grey-500"}`}>
                    {m.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

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
      </div>
    </Layout>
  );
}