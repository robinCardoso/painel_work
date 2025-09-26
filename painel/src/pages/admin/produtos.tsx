import React from 'react';
import AdminLayout from './AdminLayout';
import { Link } from 'react-router-dom';

export default function Produtos(): JSX.Element {
  return (
    <AdminLayout>
      <section>
        <h1>Produtos</h1>
        <p>Página de produtos (placeholder).</p>
        <Link to="/admin/index">Voltar ao Dashboard</Link>
      </section>
    </AdminLayout>
  );
}
