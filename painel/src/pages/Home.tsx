import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header'; // <-- import movido para components

export default function Home(): JSX.Element {
	return (
		<div style={{
			minHeight: '100vh',
			display: 'flex',
			flexDirection: 'column',
			background: 'linear-gradient(180deg, #f0f4ff 0%, #f7fafc 100%)',
		}}>
			<Header /> {/* usa o Header importado */}
			<main style={{
				display: 'flex',
				flex: 1,
				alignItems: 'center',
				justifyContent: 'center',
				padding: 24,
			}}>
				<div style={{
					width: '100%',
					maxWidth: 1100,
					display: 'flex',
					gap: 24,
					alignItems: 'stretch',
					flexWrap: 'wrap',
				}}>
					{/* Cartão principal */}
					<section style={{
						flex: '1 1 420px',
						background: '#fff',
						padding: 28,
						borderRadius: 12,
						boxShadow: '0 8px 24px rgba(15,23,42,0.06)',
						border: '1px solid rgba(15,23,42,0.04)'
					}}>
						<h1 style={{ margin: 0, fontSize: 28, color: '#0f172a' }}>Painel Administrativo</h1>
						<p style={{ marginTop: 10, color: '#475569' }}>
							Bem-vindo ao painel. Aqui você encontra um resumo rápido do sistema e acessos rápidos.
						</p>

						<div style={{ marginTop: 20, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
							<Link to="/" style={{ textDecoration: 'none' }}>
								<button style={{
									padding: '10px 16px',
									background: '#2563eb',
									color: '#fff',
									border: 'none',
									borderRadius: 8,
									cursor: 'pointer',
									fontWeight: 600
								}}>
									Ir para Login
								</button>
							</Link>

							<Link to="/home" style={{ textDecoration: 'none' }}>
								<button style={{
									padding: '10px 16px',
									background: 'transparent',
									color: '#0f172a',
									border: '1px solid rgba(15,23,42,0.08)',
									borderRadius: 8,
									cursor: 'pointer',
									fontWeight: 600
								}}>
									Minha Área
								</button>
							</Link>
						</div>
					</section>

					{/* Cartão lateral com informações */}
					<aside style={{
						width: 320,
						minWidth: 260,
						background: 'linear-gradient(180deg,#ffffff,#fbfdff)',
						padding: 20,
						borderRadius: 12,
						boxShadow: '0 6px 18px rgba(15,23,42,0.04)',
						border: '1px solid rgba(15,23,42,0.03)'
					}}>
						<h3 style={{ margin: 0, fontSize: 16, color: '#0f172a' }}>Resumo rápido</h3>
						<ul style={{ marginTop: 14, paddingLeft: 18, color: '#475569' }}>
							<li>Usuários: 128</li>
							<li>Atividades pendentes: 3</li>
							<li>Último login: Hoje</li>
						</ul>
						<div style={{ marginTop: 18 }}>
							<span style={{ fontSize: 12, color: '#94a3b8' }}>Dica:</span>
							<p style={{ margin: '6px 0 0', color: '#334155', fontSize: 14 }}>
								Use o botão "Ir para Login" para voltar à tela de autenticação.
							</p>
						</div>
					</aside>
				</div>
			</main>
		</div>
	);
}