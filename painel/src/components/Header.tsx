import React from 'react';
import { Link } from 'react-router-dom';

export default function Header(): JSX.Element {
  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 24px',
      background: 'transparent'
    }}>
      <h2 style={{ margin: 0, fontSize: 18, color: '#0f172a' }}>Painel</h2>
      <nav>
        <Link to="/" style={{ marginRight: 12, textDecoration: 'none', color: '#2563eb', fontWeight: 600 }}>Login</Link>
        <Link to="/admin/index" style={{ textDecoration: 'none', color: '#475569' }}>Admin</Link>
      </nav>
    </header>
  );
}
