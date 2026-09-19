import { useState, useEffect } from "react";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";

const statusOptions = [
  { value: "PROSPECT", label: "Prospect" },
  { value: "ACTIVE", label: "Actif" },
  { value: "INACTIVE", label: "Inactif" },
  { value: "TO_FOLLOW_UP", label: "À relancer" },
];

export default function ClientFormModal({ onClose, onCreated, onUpdated, existingClient }) {
  const [name, setName] = useState(existingClient?.name || "");
  const [phone, setPhone] = useState(existingClient?.phone || "");
  const [location, setLocation] = useState(existingClient?.location || "");
  const [type, setType] = useState(existingClient?.type || "");
  const [status, setStatus] = useState(existingClient?.status || "PROSPECT");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const [commercials, setCommercials] = useState([]);
  const [commercialId, setCommercialId] = useState(existingClient?.commercialId || "");

  useEffect(() => {
    if (user?.role === "ADMIN") {
      api.get("/users").then((res) => setCommercials(res.data)).catch(() => {});
    }
  }, [user]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Le nom du client est requis.");
      return;
    }

    setSaving(true);
    try {
      if (existingClient) {
        const { data } = await api.put(`/clients/${existingClient.id}`, {
          name, phone, location, type, status,
        });
        onUpdated(data);
      } else {
        const { data } = await api.post("/clients", {
          name, phone, location, type, status,
          ...(user?.role === "ADMIN" ? { commercialId } : {}),
        });
        onCreated(data);
      }
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
          <h2 className="text-base font-semibold text-ink">
            {existingClient ? "Modifier le client" : "+ Ajouter un client"}
          </h2>
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

            {user?.role === "ADMIN" && !existingClient && (
              <div className="col-span-2">
                <label className="block text-xs font-medium text-grey-600 mb-1">
                  Commercial responsable
                </label>
                <select
                  value={commercialId}
                  onChange={(e) => setCommercialId(e.target.value)}
                  className="w-full h-9 px-3 border border-grey-200 rounded text-sm bg-white"
                >
                  <option value="">Non assigné (moi-même)</option>
                  {commercials.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-grey-600 mb-1">Téléphone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="06 XX XX XX XX"
                className="w-full h-9 px-3 border border-grey-200 rounded text-sm focus:outline-none focus:border-ink"
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

            <div>
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
              {saving ? "Enregistrement..." : existingClient ? "✓ Enregistrer les modifications" : "✓ Enregistrer le client"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}