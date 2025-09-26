import React from 'react';
import { Link } from 'react-router-dom';

export default function AssociadoIndex(): JSX.Element {
  return (
    <main style={{ padding: 24 }}>
      <h1>Área do Associado</h1>
      <p>Página do associado (em branco).</p>
      <Link to="/">Voltar ao Login</Link>
    </main>
  );
}
