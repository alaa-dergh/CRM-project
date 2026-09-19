import { useState } from "react";
import api from "../lib/api";

export default function CommercialFormModal({ onClose, onCreated, onUpdated, existingUser }) {
  const [name, setName] = useState(existingUser?.name || "");
  const [email, setEmail] = useState(existingUser?.email || "");
  const [region, setRegion] = useState(existingUser?.region || "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!name.trim() || !email.trim()) {
      setError("Nom et email sont obligatoires.");
      return;
    }
    if (!existingUser && (!password || password.length < 8)) {
      setError("Le mot de passe temporaire doit contenir au moins 8 caractères.");
      return;
    }

    setSaving(true);
    try {
      if (existingUser) {
        const { data } = await api.put(`/users/${existingUser.id}`, {
          name, email, region, ...(password ? { password } : {}),
        });
        onUpdated(data);
      } else {
        const { data } = await api.post("/auth/register", {
          name, email, password, role: "COMMERCIAL", region,
        });
        onCreated(data);
      }
      onClose();
    } catch (err) {
      setError("Impossible d'enregistrer le compte. Vérifiez que l'email n'est pas déjà utilisé.");
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
      <div className="bg-white rounded-lg w-full max-w-md border border-grey-200" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-grey-200 flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold text-ink">
              {existingUser ? "Modifier le commercial" : "Ajouter un commercial"}
            </h2>
            <p className="text-xs text-grey-500 mt-0.5">
              {existingUser ? "Mise à jour du compte d'accès" : "Création de compte d'accès commercial"}
            </p>
          </div>
          <button onClick={onClose} className="text-grey-400 hover:text-ink text-lg leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4">
          {error && (
            <p className="text-sm text-charcoal bg-grey-100 border border-grey-200 rounded px-3 py-2 mb-4">
              {error}
            </p>
          )}

          <div className="mb-3">
            <label className="block text-xs font-medium text-grey-600 mb-1">Nom complet *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-9 px-3 border border-grey-200 rounded text-sm focus:outline-none focus:border-ink"
              required
            />
          </div>

          <div className="mb-3">
            <label className="block text-xs font-medium text-grey-600 mb-1">Adresse e-mail *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-9 px-3 border border-grey-200 rounded text-sm focus:outline-none focus:border-ink"
              required
            />
          </div>

          <div className="mb-3">
            <label className="block text-xs font-medium text-grey-600 mb-1">
              {existingUser ? "Nouveau mot de passe (optionnel)" : "Mot de passe temporaire *"}
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={existingUser ? "Laisser vide pour ne pas changer" : "Min. 8 caractères"}
                className="w-full h-9 px-3 pr-9 border border-grey-200 rounded text-sm focus:outline-none focus:border-ink"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-grey-400 text-xs"
              >
                {showPassword ? "🙈" : "👁"}
              </button>
            </div>
            {!existingUser && (
              <p className="text-xs text-grey-500 mt-1">
                L'utilisateur sera invité à modifier ce mot de passe à la première connexion.
              </p>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-xs font-medium text-grey-600 mb-1">Région d'affectation</label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full h-9 px-3 border border-grey-200 rounded text-sm bg-white"
            >
              <option value="">Non assignée</option>
              <option value="Alger">Alger</option>
              <option value="Sétif">Sétif</option>
              <option value="Oran">Oran</option>
              <option value="Constantine">Constantine</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-grey-200">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-grey-200 rounded hover:bg-grey-50">
              Annuler
            </button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-ink text-white rounded hover:bg-charcoal disabled:opacity-50">
              {saving ? "Enregistrement..." : existingUser ? "✓ Enregistrer" : "Créer le compte"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}