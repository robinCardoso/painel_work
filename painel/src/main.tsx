import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';      // <--- usar pages para rotas
import Home from './pages/Home';
import AdminIndex from './pages/admin';
import AssociadoIndex from './pages/associado';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/admin/index" element={<AdminIndex />} />
        <Route path="/associado/index" element={<AssociadoIndex />} />
      </Routes>
    </HashRouter>
  </React.StrictMode>
);
