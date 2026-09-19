const statusLabels = {
  PENDING: "En attente",
  CONFIRMED: "Confirmée",
  DELIVERED: "Livrée",
  CANCELLED: "Annulée",
};

export default function OrderDetailModal({ order, onClose }) {
  return (
    <div
      style={{ position: "fixed" }}
      className="inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg w-full max-w-lg border border-grey-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-grey-200">
          <h2 className="text-base font-semibold text-ink">Détails de la commande</h2>
          <button onClick={onClose} className="text-grey-400 hover:text-ink text-lg leading-none">
            ×
          </button>
        </div>

        <div className="px-5 py-4">
          <div className="flex items-center justify-between mb-4 text-sm">
            <div>
              <p className="text-grey-600">Client</p>
              <p className="font-medium text-ink">{order.client?.name || "—"}</p>
            </div>
            <div className="text-right">
              <p className="text-grey-600">Date</p>
              <p className="font-medium text-ink">
                {new Date(order.date).toLocaleDateString("fr-FR")}
              </p>
            </div>
          </div>

          <div className="border border-grey-200 rounded overflow-hidden mb-4">
            <table className="w-full text-sm text-left">
              <thead className="bg-grey-50 text-grey-600">
                <tr>
                  <th className="px-3 py-2">Produit</th>
                  <th className="px-3 py-2 text-right">Quantité</th>
                  <th className="px-3 py-2 text-right">Prix unitaire</th>
                  <th className="px-3 py-2 text-right">Sous-total</th>
                </tr>
              </thead>
              <tbody>
                {order.items?.map((item) => (
                  <tr key={item.id} className="border-t border-grey-100">
                    <td className="px-3 py-2 text-ink">{item.product}</td>
                    <td className="px-3 py-2 text-right text-grey-600">{item.quantity}</td>
                    <td className="px-3 py-2 text-right text-grey-600">
                      {item.price.toFixed(2)} DA
                    </td>
                    <td className="px-3 py-2 text-right font-medium text-ink">
                      {(item.quantity * item.price).toFixed(2)} DA
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between bg-grey-50 border border-grey-200 rounded px-3 py-2.5 mb-4">
            <span className="text-sm font-medium text-ink">Total de la commande</span>
            <span className="text-base font-semibold text-ink">{order.total.toFixed(2)} DA</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-grey-600">Statut</span>
            <span className="px-2 py-0.5 bg-grey-100 border border-grey-200 rounded text-xs text-grey-600">
              {statusLabels[order.status] || order.status}
            </span>
          </div>
        </div>

        <div className="flex justify-end px-5 py-4 border-t border-grey-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-grey-200 rounded hover:bg-grey-50"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}