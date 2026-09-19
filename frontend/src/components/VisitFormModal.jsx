import { useEffect, useState } from "react";
import api from "../lib/api";

const resultOptions = [
  "Commande signée",
  "Devis envoyé",
  "En négociation",
  "Relance nécessaire",
  "Refus",
];

export default function VisitFormModal({ onClose, onCreated, presetClientId }) {
  const [clients, setClients] = useState([]);
  const [clientId, setClientId] = useState(presetClientId || "");
  const [date, setDate] = useState("");
  const [result, setResult] = useState(resultOptions[0]);
  const [nextActionDate, setNextActionDate] = useState("");
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/clients").then((res) => setClients(res.data)).catch(() => {});
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!clientId || !date || !result) {
      setError("Client, date et résultat sont obligatoires.");
      return;
    }

    setSaving(true);
    try {
      const { data } = await api.post("/visits", {
        clientId: Number(clientId),
        date,
        result,
        comment,
        orderPlaced,
        nextActionDate: nextActionDate || null,
      });
      onCreated(data);
      onClose();
    } catch (err) {
      setError("Impossible d'enregistrer la visite. Réessayez.");
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
      <div
        className="bg-white rounded-lg w-full max-w-xl border border-grey-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-grey-200 bg-[#E7EEFE]">
          <h2 className="text-base font-semibold text-ink ">
            + Enregistrer une nouvelle visite
          </h2>
          <button onClick={onClose} className="text-grey-400 hover:text-ink text-lg leading-none">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4">
          {error && (
            <p className="text-sm text-charcoal bg-grey-100 border border-grey-200 rounded px-3 py-2 mb-4">
              {error}
            </p>
          )}

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-grey-600 mb-1">Client *</label>
              <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              disabled={!!presetClientId}
              className="w-full h-9 px-3 border border-grey-200 rounded text-sm bg-white disabled:bg-grey-50"
              required
              >
             <option value="">Sélectionner...</option>
               {clients.map((c) => (
             <option key={c.id} value={c.id}>{c.name}</option>
              ))}
             </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-grey-600 mb-1">
                Date du rendez-vous *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-9 px-3 border border-grey-200 rounded text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-grey-600 mb-1">
                Résultat du contact *
              </label>
              <select
                value={result}
                onChange={(e) => setResult(e.target.value)}
                className="w-full h-9 px-3 border border-grey-200 rounded text-sm bg-white"
                required
              >
                {resultOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-grey-600 mb-1">
                Date de la prochaine relance
              </label>
              <input
                type="date"
                value={nextActionDate}
                onChange={(e) => setNextActionDate(e.target.value)}
                className="w-full h-9 px-3 border border-grey-200 rounded text-sm"
              />
            </div>
          </div>

          <div className="flex items-center justify-between bg-grey-50 border border-grey-200 rounded px-3 py-2.5 mb-4 bg-[#E7EEFE]">
            <div>
              <p className="text-xs font-medium text-ink">Commande obtenue</p>
              <p className="text-xs text-grey-600">
                Activer si un devis ou bon d'achat a été signé pendant la visite
              </p>
            </div>
            <div className="flex border border-grey-200 rounded overflow-hidden shrink-0 ml-3">
              <button
                type="button"
                onClick={() => setOrderPlaced(false)}
                className={`px-3 py-1 text-xs ${!orderPlaced ? "bg-ink text-white font-medium" : "bg-white text-grey-600"}`}
              >
                NON
              </button>
              <button
                type="button"
                onClick={() => setOrderPlaced(true)}
                className={`px-3 py-1 text-xs ${orderPlaced ? "bg-ink text-white font-medium" : "bg-white text-grey-600"}`}
              >
                OUI
              </button>
            </div>
          </div>

          <div className="mb-1">
            <label className="block text-xs font-medium text-grey-600 mb-1">
              Commentaire & synthèse de visite
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value.slice(0, 500))}
              rows={4}
              className="w-full px-3 py-2 border border-grey-200 rounded text-sm resize-none"
            />
          </div>
          <p className="text-xs text-grey-400 text-right mb-4">
            {comment.length} / 500 caractères
          </p>

          <div className="flex justify-end gap-2 pt-3 border-t border-grey-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border border-grey-200 rounded hover:bg-grey-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm bg-ink text-white rounded hover:bg-charcoal disabled:opacity-50"
            >
              {saving ? "Enregistrement..." : "✓ Enregistrer la visite"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}