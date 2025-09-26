import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminIndex from './pages/admin';
import AssociadoIndex from './pages/associado';
import Pedidos from './pages/admin/pedidos';
import Clientes from './pages/admin/clientes';
import Produtos from './pages/admin/produtos';
import Pagamentos from './pages/admin/pagamentos';
import RelatorioSincronizacao from './pages/admin/relatorio-sincronizacao';
import Configuracoes from './pages/admin/configuracoes';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <Routes>
        {/* página de login principal */}
        <Route path="/" element={<Login />} />

        {/* alias seguro: aceitar /login e redirecionar para "/" */}
        <Route path="/login" element={<Navigate to="/" replace />} />

        {/* rotas do admin */}
        <Route path="/admin/index" element={<AdminIndex />} />
        <Route path="/admin/vendas/pedidos" element={<Pedidos />} />
        <Route path="/admin/vendas/clientes" element={<Clientes />} />
        <Route path="/admin/vendas/produtos" element={<Produtos />} />
        <Route path="/admin/vendas/pagamentos" element={<Pagamentos />} />
        <Route path="/admin/relatorio-sincronizacao" element={<RelatorioSincronizacao />} />
        <Route path="/admin/configuracoes" element={<Configuracoes />} />

        <Route path="/associado/index" element={<AssociadoIndex />} />

        {/* fallback: evita "No routes matched location" */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  </React.StrictMode>
);