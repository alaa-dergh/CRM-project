import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import CommercialDashboard from "./pages/CommercialDashboard";
import Clients from "./pages/Clients";
import ClientDetail from "./pages/ClientDetail";
import AdminDashboard from "./pages/AdminDashboard";
import Visits from "./pages/Visits";
import Orders from "./pages/Orders";
import Commerciaux from "./pages/Commerciaux";
import AdminClients from "./pages/AdminClients";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/dashboard" element={
            <ProtectedRoute roles={["COMMERCIAL"]}><CommercialDashboard /></ProtectedRoute>
          } />

          <Route path="/clients" element={
            <ProtectedRoute roles={["COMMERCIAL"]}><Clients /></ProtectedRoute>
          } />

          <Route path="/clients/:id" element={
          <ProtectedRoute roles={["COMMERCIAL", "ADMIN"]}><ClientDetail /></ProtectedRoute>
          } />

          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={["ADMIN"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/admin/clients" element={
          <ProtectedRoute roles={["ADMIN"]}><AdminClients /></ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/login" replace />} />

          <Route path="/visits" element={
            <ProtectedRoute roles={["COMMERCIAL"]}><Visits /></ProtectedRoute>
          } />

          <Route path="/orders" element={
            <ProtectedRoute roles={["COMMERCIAL"]}><Orders /></ProtectedRoute>
          } />

          <Route path="/admin/reps" element={
          <ProtectedRoute roles={["ADMIN"]}><Commerciaux /></ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
  }