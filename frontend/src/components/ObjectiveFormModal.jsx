import { useState } from "react";
import api from "../lib/api";

export default function ObjectiveFormModal({ existing, commerciaux, defaultCommercialId, defaultPeriod, onClose, onCreated, onUpdated }) {
  const isEdit = Boolean(existing);

  const [commercialId, setCommercialId] = useState(existing?.commercialId || defaultCommercialId || "");
  const [period, setPeriod] = useState(existing?.period || defaultPeriod || "");
  const [targetVisitsPerDay, setTargetVisitsPerDay] = useState(existing?.targetVisitsPerDay ?? "");
  const [minOrdersPerDay, setMinOrdersPerDay] = useState(existing?.minOrdersPerDay ?? "");
  const [targetRevenue, setTargetRevenue] = useState(existing?.targetRevenue ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!isEdit && (!commercialId || !period)) {
      setError("Le commercial et la période sont obligatoires.");
      return;
    }

    const payload = {
      targetVisitsPerDay: Number(targetVisitsPerDay) || 0,
      minOrdersPerDay: Number(minOrdersPerDay) || 0,
      targetRevenue: Number(targetRevenue) || 0,
    };

    setSaving(true);
    try {
      if (isEdit) {
        const res = await api.put(`/objectives/${existing.id}`, payload);
        onUpdated?.(res.data);
      } else {
        const res = await api.post("/objectives", {
          ...payload,
          commercialId: Number(commercialId),
          period,
        });
        onCreated?.(res.data);
      }
      onClose();
    } catch (err) {
      setError(err?.response?.data?.error || "Une erreur est survenue.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-[480px] p-6">
        <h2 className="text-lg font-semibold text-ink mb-1">
          {isEdit ? "Modifier l'objectif" : "Définir un objectif"}
        </h2>
        <p className="text-sm text-grey-500 mb-4">
          Attribution et suivi des quotas commerciaux par période.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-grey-600 mb-1">Commercial</label>
              <select
                value={commercialId}
                onChange={(e) => setCommercialId(e.target.value)}
                disabled={isEdit}
                className="w-full border border-grey-200 rounded px-2 py-1.5 text-sm disabled:bg-grey-50 disabled:text-grey-500"
              >
                <option value="">Sélectionner…</option>
                {commerciaux.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-grey-600 mb-1">Période</label>
              <input
                type="month"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                disabled={isEdit}
                className="w-full border border-grey-200 rounded px-2 py-1.5 text-sm disabled:bg-grey-50 disabled:text-grey-500"
              />
            </div>
          </div>

          <div className="border-t border-grey-100 pt-4">
            <p className="text-xs font-medium text-grey-500 uppercase tracking-wide mb-3">
              Cibles quantitatives
            </p>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-grey-600 mb-1">
                  Cible visites/jour
                </label>
                <input
                  type="number"
                  min="0"
                  value={targetVisitsPerDay}
                  onChange={(e) => setTargetVisitsPerDay(e.target.value)}
                  className="w-full border border-grey-200 rounded px-2 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-grey-600 mb-1">
                  Min. commandes/jour
                </label>
                <input
                  type="number"
                  min="0"
                  value={minOrdersPerDay}
                  onChange={(e) => setMinOrdersPerDay(e.target.value)}
                  className="w-full border border-grey-200 rounded px-2 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-grey-600 mb-1">
                  Cible CA mensuel (DA)
                </label>
                <input
                  type="number"
                  min="0"
                  value={targetRevenue}
                  onChange={(e) => setTargetRevenue(e.target.value)}
                  className="w-full border border-grey-200 rounded px-2 py-1.5 text-sm"
                />
              </div>
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-sm border border-grey-200 rounded text-grey-600 hover:bg-grey-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-1.5 text-sm bg-black text-white rounded disabled:opacity-50"
            >
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}