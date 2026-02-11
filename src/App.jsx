import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Control from "./pages/Control";
import Ajustes from "./pages/Ajustes";
import Cultivos from "./pages/Cultivos";
import Historial from "./pages/Historial";
import Automatico from "./pages/Automatico";

import { Routes, Route } from "react-router-dom";

export default function App() {
  return (
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
  );
}
