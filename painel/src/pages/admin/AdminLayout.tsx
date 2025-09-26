import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import './admin.css';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [openVendas, setOpenVendas] = useState(true);

  return (
    <div className={`admin-root ${collapsed ? 'collapsed' : ''}`}>
      <aside className="admin-sidebar">
        <div className="sidebar-top">
          <div className="brand">{!collapsed ? 'Painel' : 'P'}</div>
          <button className="collapse-btn" onClick={() => setCollapsed(s => !s)} aria-label="Toggle sidebar">
            {collapsed ? '➤' : '⬅'}
          </button>
        </div>

        <nav className="sidebar-nav">
          <ul>
            <li><NavLink to="/admin/index">🏠 <span className="label">Dashboard</span></NavLink></li>
            <li>
              <button className="submenu-toggle" onClick={() => setOpenVendas(s => !s)}>
                🛒 <span className="label">Vendas</span>
                <span className="chev">{openVendas ? '▾' : '▸'}</span>
              </button>
              {openVendas && (
                <ul className="submenu">
                  <li><NavLink to="/admin/vendas/pedidos">Pedidos</NavLink></li>
                  <li><NavLink to="/admin/vendas/clientes">Clientes</NavLink></li>
                  <li><NavLink to="/admin/vendas/produtos">Produtos</NavLink></li>
                  <li><NavLink to="/admin/vendas/pagamentos">Pagamentos</NavLink></li>
                </ul>
              )}
            </li>

            <li><NavLink to="/admin/relatorio-sincronizacao">🔄 <span className="label">Sincronização</span></NavLink></li>
            <li><NavLink to="/admin/configuracoes">⚙️ <span className="label">Configurações</span></NavLink></li>
          </ul>
        </nav>

        <div className="sidebar-footer">
          <small className="muted">{!collapsed ? 'Usuário: Admin' : 'A'}</small>
        </div>
      </aside>

      <div className="admin-content">
        {children}
      </div>
    </div>
  );
}
