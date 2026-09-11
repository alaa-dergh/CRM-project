import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import CommercialDashboard from "./pages/CommercialDashboard";
import Clients from "./pages/Clients";
import ClientDetail from "./pages/ClientDetail";
import AdminDashboard from "./pages/AdminDashboard";

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
            <ProtectedRoute roles={["COMMERCIAL"]}><ClientDetail /></ProtectedRoute>
          } />

          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={["ADMIN"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
  }