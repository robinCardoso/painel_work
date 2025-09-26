import React from 'react';
import { Link } from 'react-router-dom';

export default function AdminIndex(): JSX.Element {
  return (
    <main style={{ padding: 24 }}>
      <h1>Área do Admin</h1>
      <p>Página de administração (em branco).</p>
      <Link to="/">Voltar ao Login</Link>
    </main>
  );
}
