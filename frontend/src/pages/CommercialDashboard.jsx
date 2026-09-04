import { useEffect, useState } from "react";
import api from "../lib/api";

export default function CommercialDashboard() {
  const [clients, setClients] = useState([]);

  useEffect(() => {
    api.get("/clients").then((res) => setClients(res.data));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-lg font-semibold mb-4">My clients</h1>
      <div className="border border-grey-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-grey-50 text-grey-600">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Location</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr key={c.id} className="border-t border-grey-200">
                <td className="px-4 py-2">{c.name}</td>
                <td className="px-4 py-2">{c.status}</td>
                <td className="px-4 py-2">{c.location || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
