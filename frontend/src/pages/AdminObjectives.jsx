import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../lib/api";
import ObjectiveFormModal from "../components/ObjectiveFormModal";

function currentPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function formatCurrency(amount) {
  return `${Math.round(amount || 0).toLocaleString("fr-FR")} DA`;
}

function formatPeriod(period) {
  if (!period) return "—";
  const [year, month] = period.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

// Un order.date tombe-t-il dans la période "YYYY-MM" ?
function isInPeriod(dateStr, period) {
  if (!period) return false;
  const [year, month] = period.split("-").map(Number);
  const d = new Date(dateStr);
  return d.getFullYear() === year && d.getMonth() + 1 === month;
}

export default function AdminObjectives() {
  const [commerciaux, setCommerciaux] = useState([]);
  const [orders, setOrders] = useState([]);
  const [objectives, setObjectives] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filterCommercial, setFilterCommercial] = useState("all");
  const [filterPeriod, setFilterPeriod] = useState(currentPeriod());

  const [showModal, setShowModal] = useState(false);
  const [editingObjective, setEditingObjective] = useState(null);

  useEffect(() => {
    api.get("/users").then((res) => setCommerciaux(res.data.filter((u) => u.role !== "ADMIN"))).catch(() => {});
    api.get("/orders").then((res) => setOrders(res.data)).catch(() => {});
  }, []);

  function loadObjectives() {
    setLoading(true);
    const params = new URLSearchParams({ period: filterPeriod });
    if (filterCommercial !== "all") params.set("commercialId", filterCommercial);

    api
      .get(`/objectives?${params.toString()}`)
      .then((res) => setObjectives(res.data))
      .catch(() => setObjectives([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadObjectives();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterCommercial, filterPeriod]);

  function pctBadgeClass(pct) {
    if (pct === null) return "bg-grey-100 text-grey-500 border-grey-200";
    if (pct >= 90) return "bg-green-50 text-green-700 border-green-200";
    if (pct >= 75) return "bg-yellow-50 text-yellow-700 border-yellow-200";
    return "bg-red-50 text-red-700 border-red-200";
  }

  const rows = objectives.map((o) => {
    const revenue = orders
      .filter((ord) => ord.commercialId === o.commercialId && isInPeriod(ord.date, o.period))
      .reduce((sum, ord) => sum + ord.total, 0);
    const pct = o.targetRevenue ? Math.round((revenue / o.targetRevenue) * 100) : null;
    return { ...o, revenue, pct };
  });

  return (
    <Layout title="Objectifs (Gestion)">
      <div className="flex items-start justify-between mb-4">
        <p className="text-sm text-grey-600">
          Attribution et suivi des quotas commerciaux par période.
        </p>
        <button
          onClick={() => {
            setEditingObjective(null);
            setShowModal(true);
          }}
          className="px-4 py-1.5 text-sm bg-black text-white rounded"
        >
          + Définir un objectif
        </button>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <select
          value={filterCommercial}
          onChange={(e) => setFilterCommercial(e.target.value)}
          className="border border-grey-200 rounded px-2 py-1.5 text-sm"
        >
          <option value="all">Tous les commerciaux</option>
          {commerciaux.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <input
          type="month"
          value={filterPeriod}
          onChange={(e) => setFilterPeriod(e.target.value)}
          className="border border-grey-200 rounded px-2 py-1.5 text-sm"
        />
      </div>

      <div className="bg-white border border-grey-200 rounded-lg overflow-hidden">
        {!loading && rows.length === 0 && (
          <p className="text-sm text-grey-600 px-4 py-4">
            Aucun objectif défini pour cette période.
          </p>
        )}

        {rows.length > 0 && (
          <table className="w-full text-sm text-left">
            <thead className="bg-[#F0F3FF] text-grey-600">
              <tr>
                <th className="px-4 py-2">Commercial</th>
                <th className="px-4 py-2">Période</th>
                <th className="px-4 py-2">Cible visites/jour</th>
                <th className="px-4 py-2">Min. commandes/jour</th>
                <th className="px-4 py-2">CA réalisé / cible</th>
                <th className="px-4 py-2">Taux (%)</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => (
                <tr key={o.id} className="border-t border-grey-100">
                  <td className="px-4 py-2 font-medium text-ink">
                    {o.commercial?.name || commerciaux.find((c) => c.id === o.commercialId)?.name || "—"}
                  </td>
                  <td className="px-4 py-2 text-grey-600 capitalize">{formatPeriod(o.period)}</td>
                  <td className="px-4 py-2 text-grey-600">{o.targetVisitsPerDay || "—"}</td>
                  <td className="px-4 py-2 text-grey-600">{o.minOrdersPerDay || "—"}</td>
                  <td className="px-4 py-2 text-grey-600">
                    {formatCurrency(o.revenue)} / {formatCurrency(o.targetRevenue)}
                  </td>
                  <td className="px-4 py-2">
                    <span className={`text-xs px-2 py-0.5 rounded border ${pctBadgeClass(o.pct)}`}>
                      {o.pct !== null ? `${o.pct}%` : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => {
                        setEditingObjective(o);
                        setShowModal(true);
                      }}
                      className="text-xs text-grey-600 underline hover:text-ink"
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
        <ObjectiveFormModal
          existing={editingObjective}
          commerciaux={commerciaux}
          defaultCommercialId={filterCommercial !== "all" ? filterCommercial : ""}
          defaultPeriod={filterPeriod}
          onClose={() => setShowModal(false)}
          onCreated={loadObjectives}
          onUpdated={loadObjectives}
        />
      )}
    </Layout>
  );
}