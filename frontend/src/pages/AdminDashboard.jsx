import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../lib/api";
export default function AdminDashboard() {
    return (
        <Layout title="Tableau de bord">
          <p className="text-sm text-grey-600 mb-4">
            Admin dashboard page.
          </p>
        </Layout>
    );
}