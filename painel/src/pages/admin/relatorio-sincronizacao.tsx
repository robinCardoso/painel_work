import React from 'react';
import AdminLayout from './AdminLayout';
import { Link } from 'react-router-dom';

export default function RelatorioSincronizacao(): JSX.Element {
  return (
    <AdminLayout>
      <section>
        <h1>Relatório de Sincronização</h1>
        <p>Logs e status de sincronização (placeholder).</p>
        <Link to="/admin/index">Voltar ao Dashboard</Link>
      </section>
    </AdminLayout>
  );
}
