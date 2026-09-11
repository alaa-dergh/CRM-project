import { useState } from "react";
import api from "../lib/api";

const statusOptions = [
  { value: "PROSPECT", label: "Prospect" },
  { value: "ACTIVE", label: "Actif" },
  { value: "INACTIVE", label: "Inactif" },
  { value: "TO_FOLLOW_UP", label: "À relancer" },
];

export default function ClientFormModal({ onClose, onCreated }) {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("PROSPECT");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Le nom du client est requis.");
      return;
    }

    setSaving(true);
    try {
      const { data } = await api.post("/clients", { name, location, type, status });
      onCreated(data);
      onClose();
    } catch (err) {
      setError("Impossible d'enregistrer le client. Réessayez.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{ position: "fixed" }}
      className="inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div className="bg-white rounded-lg w-full max-w-lg border border-grey-200" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-grey-200">
          <h2 className="text-base font-semibold text-ink">+ Ajouter un client</h2>
          <button onClick={onClose} className="text-grey-400 hover:text-ink text-lg leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4">
          {error && (
            <p className="text-sm text-charcoal bg-grey-100 border border-grey-200 rounded px-3 py-2 mb-4">
              {error}
            </p>
          )}

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-grey-600 mb-1">Nom du client *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-9 px-3 border border-grey-200 rounded text-sm focus:outline-none focus:border-ink"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-grey-600 mb-1">Localisation</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ville"
                className="w-full h-9 px-3 border border-grey-200 rounded text-sm focus:outline-none focus:border-ink"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-grey-600 mb-1">Type de client</label>
              <input
                type="text"
                value={type}
                onChange={(e) => setType(e.target.value)}
                placeholder="Restaurant, boutique..."
                className="w-full h-9 px-3 border border-grey-200 rounded text-sm focus:outline-none focus:border-ink"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-medium text-grey-600 mb-1">Statut</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full h-9 px-3 border border-grey-200 rounded text-sm bg-white"
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-grey-200">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-grey-200 rounded hover:bg-grey-50">
              Annuler
            </button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-ink text-white rounded hover:bg-charcoal disabled:opacity-50">
              {saving ? "Enregistrement..." : "✓ Enregistrer le client"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}