import React from 'react';
import AdminLayout from './AdminLayout';
import { Link } from 'react-router-dom';

export default function Pedidos(): JSX.Element {
  return (
    <AdminLayout>
      <section>
        <h1>Pedidos</h1>
        <p>Página de pedidos (placeholder).</p>
        <Link to="/admin/index">Voltar ao Dashboard</Link>
      </section>
    </AdminLayout>
  );
}
