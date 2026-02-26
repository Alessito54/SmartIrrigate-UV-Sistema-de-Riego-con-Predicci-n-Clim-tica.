import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Control from "./pages/Control";
import Ajustes from "./pages/Ajustes";
import Cultivos from "./pages/Cultivos";
import Historial from "./pages/Historial";
import Automatico from "./pages/Automatico";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />

        {/* Protected */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/control" element={<Control />} />
                  <Route path="/ajustes" element={<Ajustes />} />
                  <Route path="/cultivos" element={<Cultivos />} />
                  <Route path="/historial" element={<Historial />} />
                  <Route path="/automatico" element={<Automatico />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  );
}
