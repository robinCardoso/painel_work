import React from 'react';
import AdminLayout from './AdminLayout';
import { Link } from 'react-router-dom';

export default function Clientes(): JSX.Element {
  return (
    <AdminLayout>
      <section>
        <h1>Clientes</h1>
        <p>Página de clientes (placeholder).</p>
        <Link to="/admin/index">Voltar ao Dashboard</Link>
      </section>
    </AdminLayout>
  );
}
