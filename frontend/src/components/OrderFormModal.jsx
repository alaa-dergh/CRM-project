import { useEffect, useState } from "react";
import api from "../lib/api";

const statusOptions = [
  { value: "PENDING", label: "En attente" },
  { value: "CONFIRMED", label: "Confirmée" },
  { value: "DELIVERED", label: "Livrée" },
  { value: "CANCELLED", label: "Annulée" },
];

function emptyItem() {
  return { product: "", quantity: 1, price: 0 };
}

export default function OrderFormModal({ onClose, onCreated, onUpdated, presetClientId, existingOrder }) {
  const [clients, setClients] = useState([]);
  const [clientId, setClientId] = useState(existingOrder?.clientId || presetClientId || "");
  const [status, setStatus] = useState(existingOrder?.status || "PENDING");
  const [items, setItems] = useState(
    existingOrder?.items?.length
      ? existingOrder.items.map((i) => ({ product: i.product, quantity: i.quantity, price: i.price }))
      : [emptyItem()]
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/clients").then((res) => setClients(res.data)).catch(() => {});
  }, []);

  function updateItem(index, field, value) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }

  function addItem() {
    setItems((prev) => [...prev, emptyItem()]);
  }

  function removeItem(index) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  const total = items.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.price) || 0),
    0
  );

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!clientId) {
      setError("Veuillez sélectionner un client.");
      return;
    }
    const validItems = items.filter((i) => i.product.trim() && i.quantity > 0);
    if (validItems.length === 0) {
      setError("Ajoutez au moins un produit valide.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        clientId: Number(clientId),
        status,
        items: validItems.map((i) => ({
          product: i.product,
          quantity: Number(i.quantity),
          price: Number(i.price),
        })),
      };

      if (existingOrder) {
        const { data } = await api.put(`/orders/${existingOrder.id}`, payload);
        onUpdated(data);
      } else {
        const { data } = await api.post("/orders", payload);
        onCreated(data);
      }
      onClose();
    } catch (err) {
      setError("Impossible d'enregistrer la commande. Réessayez.");
    } finally {
      setSaving(false);
    }
  }

  const lockClient = !!presetClientId || !!existingOrder;

  return (
    <div
      style={{ position: "fixed" }}
      className="inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg w-full max-w-2xl border border-grey-200 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-grey-200 sticky top-0 bg-white">
          <h2 className="text-base font-semibold text-ink">
            {existingOrder ? "Modifier la commande" : "+ Nouvelle commande"}
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
                disabled={lockClient}
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

          <div className="mb-2">
            <label className="block text-xs font-medium text-grey-600 mb-2">Produits *</label>

            <div className="border border-grey-200 rounded overflow-hidden">
              <div className="grid grid-cols-[1fr_90px_110px_100px_36px] gap-2 px-3 py-2 bg-grey-50 text-xs font-medium text-grey-600">
                <span>Produit</span>
                <span>Quantité</span>
                <span>Prix unitaire</span>
                <span className="text-right">Sous-total</span>
                <span></span>
              </div>

              {items.map((item, index) => (
                <div
                  key={index}
                  className="grid grid-cols-[1fr_90px_110px_100px_36px] gap-2 px-3 py-2 border-t border-grey-100 items-center"
                >
                  <input
                    type="text"
                    value={item.product}
                    onChange={(e) => updateItem(index, "product", e.target.value)}
                    placeholder="Nom du produit"
                    className="h-8 px-2 border border-grey-200 rounded text-sm"
                  />
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, "quantity", e.target.value)}
                    className="h-8 px-2 border border-grey-200 rounded text-sm"
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.price}
                    onChange={(e) => updateItem(index, "price", e.target.value)}
                    className="h-8 px-2 border border-grey-200 rounded text-sm"
                  />
                  <span className="text-sm text-grey-600 text-right">
                    {((Number(item.quantity) || 0) * (Number(item.price) || 0)).toFixed(2)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    disabled={items.length === 1}
                    className="text-grey-400 hover:text-charcoal disabled:opacity-30 text-sm"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <button type="button" onClick={addItem} className="mt-2 text-sm text-ink underline">
              + Ajouter une ligne
            </button>
          </div>

          <div className="flex items-center justify-between bg-grey-50 border border-grey-200 rounded px-3 py-2.5 my-4">
            <span className="text-sm font-medium text-ink">Total de la commande</span>
            <span className="text-base font-semibold text-ink">{total.toFixed(2)} DA</span>
          </div>

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
              {saving ? "Enregistrement..." : existingOrder ? "✓ Enregistrer les modifications" : "✓ Enregistrer la commande"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}