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
  const [fromPeriod, setFromPeriod] = useState(currentPeriod());
  const [toPeriod, setToPeriod] = useState(currentPeriod());

  const [showModal, setShowModal] = useState(false);
  const [editingObjective, setEditingObjective] = useState(null);

  useEffect(() => {
    api.get("/users").then((res) => setCommerciaux(res.data)).catch(() => {});
    api.get("/orders").then((res) => setOrders(res.data)).catch(() => {});
  }, []);

  function loadObjectives() {
    setLoading(true);
    const params = new URLSearchParams();
    const [from, to] = fromPeriod <= toPeriod ? [fromPeriod, toPeriod] : [toPeriod, fromPeriod];
    params.set("from", from);
    params.set("to", to);
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
  }, [filterCommercial, fromPeriod, toPeriod]);

  function pctBadgeClass(pct) {
    if (pct === null) return "bg-grey-100 text-grey-500 border-grey-200";
    if (pct >= 90) return "bg-green-50 text-green-700 border-green-200";
    if (pct >= 75) return "bg-yellow-50 text-yellow-700 border-yellow-200";
    return "bg-red-50 text-red-700 border-red-200";
  }

  const commercialIdsWithOverride = new Set(
    objectives.filter((o) => o.commercialId != null).map((o) => o.commercialId)
  );

  const rows = objectives.map((o) => {
    let revenue;
    if (o.commercialId == null) {
      const coveredCommerciaux = commerciaux.filter((c) => !commercialIdsWithOverride.has(c.id));
      revenue = orders
        .filter(
          (ord) =>
            coveredCommerciaux.some((c) => c.id === ord.commercialId) && isInPeriod(ord.date, o.period)
        )
        .reduce((sum, ord) => sum + ord.total, 0);
    } else {
      revenue = orders
        .filter((ord) => ord.commercialId === o.commercialId && isInPeriod(ord.date, o.period))
        .reduce((sum, ord) => sum + ord.total, 0);
    }
    const pct = o.targetRevenue ? Math.round((revenue / o.targetRevenue) * 100) : null;
    return { ...o, revenue, pct };
  });

  return (
    <Layout title="Objectifs (Gestion)">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
        <p className="text-sm text-grey-600 sm:max-w-2xl">
          Attribution et suivi des quotas commerciaux par période. L'objectif "par défaut" s'applique
          à tout commercial sans objectif personnalisé.
        </p>
        <button
          onClick={() => {
            setEditingObjective(null);
            setShowModal(true);
          }}
          className="px-4 py-1.5 text-sm bg-black text-white rounded whitespace-nowrap self-start"
        >
          + Définir un objectif
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
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

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="month"
            value={fromPeriod}
            onChange={(e) => setFromPeriod(e.target.value)}
            className="border border-grey-200 rounded px-2 py-1.5 text-sm"
          />
          <span className="text-sm text-grey-500">à</span>
          <input
            type="month"
            value={toPeriod}
            onChange={(e) => setToPeriod(e.target.value)}
            className="border border-grey-200 rounded px-2 py-1.5 text-sm"
          />
        </div>
      </div>

      {fromPeriod !== toPeriod && (
        <p className="text-xs text-grey-500 -mt-3 mb-4">
          Affichage de {formatPeriod(fromPeriod <= toPeriod ? fromPeriod : toPeriod)} à{" "}
          {formatPeriod(fromPeriod <= toPeriod ? toPeriod : fromPeriod)}.
        </p>
      )}

      <div className="bg-white border border-grey-200 rounded-lg overflow-hidden">
        {!loading && rows.length === 0 && (
          <p className="text-sm text-grey-600 px-4 py-4">
            Aucun objectif défini pour cette période (ou cette plage de périodes).
          </p>
        )}

        {rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left min-w-[900px]">
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
                {rows.map((o) => {
                  const isDefault = o.commercialId == null;
                  return (
                    <tr key={o.id} className="border-t border-grey-100">
                      <td className="px-4 py-2 font-medium text-ink">
                        {isDefault ? (
                          <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                            Tous les commerciaux
                            <span className="text-[10px] px-1.5 py-0.5 bg-grey-800 text-white rounded uppercase tracking-wide">
                              Défaut
                            </span>
                          </span>
                        ) : (
                          o.commercial?.name || commerciaux.find((c) => c.id === o.commercialId)?.name || "—"
                        )}
                      </td>
                      <td className="px-4 py-2 text-grey-600 capitalize whitespace-nowrap">{formatPeriod(o.period)}</td>
                      <td className="px-4 py-2 text-grey-600">{o.targetVisitsPerDay || "—"}</td>
                      <td className="px-4 py-2 text-grey-600">{o.minOrdersPerDay || "—"}</td>
                      <td className="px-4 py-2 text-grey-600 whitespace-nowrap">
                        {formatCurrency(o.revenue)} / {formatCurrency(o.targetRevenue)}
                      </td>
                      <td className="px-4 py-2">
                        <span className={`text-xs px-2 py-0.5 rounded border whitespace-nowrap ${pctBadgeClass(o.pct)}`}>
                          {o.pct !== null ? `${o.pct}%` : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <button
                          onClick={() => {
                            setEditingObjective(o);
                            setShowModal(true);
                          }}
                          className="text-xs text-grey-600 underline hover:text-ink whitespace-nowrap"
                        >
                          Modifier
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <ObjectiveFormModal
          existing={editingObjective}
          commerciaux={commerciaux}
          defaultCommercialId={filterCommercial !== "all" ? filterCommercial : ""}
          defaultPeriod={toPeriod}
          onClose={() => setShowModal(false)}
          onCreated={loadObjectives}
          onUpdated={loadObjectives}
        />
      )}
    </Layout>
  );
}