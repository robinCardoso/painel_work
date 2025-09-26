import React from 'react';
import AdminLayout from './AdminLayout';
import { Link } from 'react-router-dom';

export default function Pagamentos(): JSX.Element {
  return (
    <AdminLayout>
      <section>
        <h1>Pagamentos</h1>
        <p>Página de pagamentos (placeholder).</p>
        <Link to="/admin/index">Voltar ao Dashboard</Link>
      </section>
    </AdminLayout>
  );
}
