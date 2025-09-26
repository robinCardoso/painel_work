import React from 'react';
import AdminLayout from './AdminLayout';
import { Link } from 'react-router-dom';

export default function Configuracoes(): JSX.Element {
  return (
    <AdminLayout>
      <section>
        <h1>Configurações</h1>
        <p>Opções de configuração do sistema (placeholder).</p>
        <Link to="/admin/index">Voltar ao Dashboard</Link>
      </section>
    </AdminLayout>
  );
}
