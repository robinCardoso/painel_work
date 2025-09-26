import React from 'react';
import AdminLayout from './AdminLayout';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Dados de exemplo para o gráfico
const salesData = [
  { name: 'Seg', vendas: 4000 },
  { name: 'Ter', vendas: 3000 },
  { name: 'Qua', vendas: 2000 },
  { name: 'Qui', vendas: 2780 },
  { name: 'Sex', vendas: 1890 },
  { name: 'Sáb', vendas: 2390 },
  { name: 'Dom', vendas: 3490 },
];

export default function AdminIndex(): JSX.Element {
  return (
    <AdminLayout>
      <section>
        <h1>Dashboard</h1>
        <p>Visão geral do seu negócio.</p>

        {/* Cards de métricas */}
        <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginTop: '16px' }}>
          <div style={{ padding: '16px', borderRadius: '8px', background: '#fff', boxShadow: '0 4px 12px rgba(15,23,42,0.05)' }}>
            <strong style={{ color: '#475569' }}>Vendas Hoje</strong>
            <div style={{ fontSize: '28px', marginTop: '8px', fontWeight: 700 }}>R$ 1.234,56</div>
          </div>
          <div style={{ padding: '16px', borderRadius: '8px', background: '#fff', boxShadow: '0 4px 12px rgba(15,23,42,0.05)' }}>
            <strong style={{ color: '#475569' }}>Pedidos Novos</strong>
            <div style={{ fontSize: '28px', marginTop: '8px', fontWeight: 700 }}>42</div>
          </div>
          <div style={{ padding: '16px', borderRadius: '8px', background: '#fff', boxShadow: '0 4px 12px rgba(15,23,42,0.05)' }}>
            <strong style={{ color: '#475569' }}>Clientes Ativos</strong>
            <div style={{ fontSize: '28px', marginTop: '8px', fontWeight: 700 }}>128</div>
          </div>
          <div style={{ padding: '16px', borderRadius: '8px', background: '#fff', boxShadow: '0 4px 12px rgba(15,23,42,0.05)' }}>
            <strong style={{ color: '#475569' }}>Taxa de Conversão</strong>
            <div style={{ fontSize: '28px', marginTop: '8px', fontWeight: 700 }}>3.4%</div>
          </div>
        </div>

        {/* Gráfico de vendas */}
        <div style={{ marginTop: '24px', background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(15,23,42,0.05)' }}>
          <h3 style={{ margin: '0 0 16px 0' }}>Vendas na Semana</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="vendas" fill="#2563eb" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </AdminLayout>
  );
}