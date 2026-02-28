import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Ajustes from "./pages/Ajustes";
import Cultivos from "./pages/Cultivos";
import Historial from "./pages/Historial";
import Landing from "./pages/Landing";
import Invernaderos from "./pages/Invernaderos";
import Vinculacion from "./pages/Vinculacion";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />

        {/* Protected */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/ajustes" element={<Ajustes />} />
                  <Route path="/cultivos" element={<Cultivos />} />
                  <Route path="/historial" element={<Historial />} />
                  <Route path="/invernaderos" element={<Invernaderos />} />
                  <Route path="/vinculacion" element={<Vinculacion />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  );
}
