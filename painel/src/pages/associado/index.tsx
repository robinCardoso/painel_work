import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function AssociadoIndex(): JSX.Element {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [claimsInfo, setClaimsInfo] = useState<any>(null);
  const [firestorePerfil, setFirestorePerfil] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function verify() {
    setError(null);
    setStatus(null);
    setClaimsInfo(null);
    setFirestorePerfil(null);

    const idToken = localStorage.getItem('firebaseIdToken');
    const uid = localStorage.getItem('firebaseLocalId');
    const email = localStorage.getItem('firebaseUser');

    if (!idToken) {
      setError('Nenhum idToken encontrado no localStorage. Faça login primeiro.');
      return;
    }

    setLoading(true);
    try {
      const cfg = await (window as any).api?.getFirebaseConfig();
      const apiKey = cfg?.apiKey ?? null;
      const projectId = cfg?.projectId ?? null;

      // 1) accounts:lookup - claims/customAttributes
      if (apiKey) {
        try {
          const resp = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken })
          });
          const data = await resp.json();
          setClaimsInfo(data?.users?.[0] ?? data);
          const foundRole =
            (data?.users?.[0]?.customAttributes && (() => {
              try { return JSON.parse(data.users[0].customAttributes).role; } catch { return null; }
            })()) ||
            data?.users?.[0]?.role ||
            (data?.users?.[0]?.admin ? 'admin' : null);
          if (foundRole) setStatus(String(foundRole).toLowerCase());
        } catch (e) {
          console.warn('accounts:lookup fail', e);
        }
      } else {
        console.warn('apiKey não disponível via preload');
      }

      // 2) Firestore lookup usuários/{uid} e usuários/{email}
      if (projectId) {
        const base = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/usuarios/`;
        const tryDoc = async (docId: string) => {
          try {
            const url = `${base}${encodeURIComponent(docId)}`;
            const r = await fetch(url, { method: 'GET', headers: { Authorization: `Bearer ${idToken}` } });
            if (!r.ok) return null;
            const j = await r.json();
            return j?.fields?.perfil?.stringValue ?? null;
          } catch (e) {
            return null;
          }
        };

        if (uid) {
          const p = await tryDoc(uid);
          if (p) {
            setFirestorePerfil(p);
            setStatus(prev => prev ?? String(p).toLowerCase());
          }
        }
        if (!firestorePerfil && email) {
          const p2 = await tryDoc(email);
          if (p2) {
            setFirestorePerfil(p2);
            setStatus(prev => prev ?? String(p2).toLowerCase());
          }
        }
      } else {
        console.warn('projectId não disponível via preload');
      }

      // fallback: se status ainda vazio, informar que não foi encontrado perfil
      if (!status && !firestorePerfil && !claimsInfo) {
        setStatus(null);
      }
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const role = localStorage.getItem('firebaseRole');
    if (role !== 'associado') {
      if (role === 'admin') navigate('/admin/index');
      else navigate('/'); // volta para login
    }

    // auto verify on mount if token exists
    (async () => {
      if (localStorage.getItem('firebaseIdToken')) await verify();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  return (
    <main style={{ padding: 24 }}>
      <h1>Área do Associado - Verificação de Perfil</h1>
      <p>Esta página mostra como o sistema identifica o perfil do usuário (claims e Firestore).</p>

      <div style={{ marginTop: 12 }}>
        <button onClick={verify} style={{ padding: '8px 12px', borderRadius: 6, background: '#2563eb', color: '#fff', border: 'none', cursor: 'pointer' }}>
          {loading ? 'Verificando...' : 'Verificar perfil'}
        </button>
        <Link to="/" style={{ marginLeft: 12, color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>Logout / Voltar</Link>
      </div>

      {error && <div style={{ marginTop: 12, color: '#b91c1c' }}>{error}</div>}

      <section style={{ marginTop: 18 }}>
        <h3>Status detectado</h3>
        <div style={{ padding: 12, background: '#fff', borderRadius: 8, boxShadow: '0 6px 18px rgba(15,23,42,0.04)' }}>
          <div><strong>localStorage firebaseRole:</strong> {localStorage.getItem('firebaseRole') ?? '<não definido>'}</div>
          <div style={{ marginTop: 6 }}><strong>Status inferido agora:</strong> {status ?? '<nenhum perfil detectado>'}</div>
          <div style={{ marginTop: 6 }}><strong>firebaseLocalId (uid):</strong> {localStorage.getItem('firebaseLocalId') ?? '<n/a>'}</div>
          <div style={{ marginTop: 6 }}><strong>firebaseUser (email):</strong> {localStorage.getItem('firebaseUser') ?? '<n/a>'}</div>
        </div>
      </section>

      <section style={{ marginTop: 18 }}>
        <h3>Claims / accounts:lookup</h3>
        <pre style={{ background: '#0f172a', color: '#fff', padding: 12, borderRadius: 6, overflow: 'auto', maxHeight: 240 }}>
          {claimsInfo ? JSON.stringify(claimsInfo, null, 2) : '<nenhum resultado>'}
        </pre>
      </section>

      <section style={{ marginTop: 18 }}>
        <h3>Perfil no Firestore (usuarios/{'{uid}'})</h3>
        <div style={{ padding: 12, background: '#fff', borderRadius: 8 }}>
          {firestorePerfil ? <div><strong>perfil:</strong> {firestorePerfil}</div> : '<não encontrado>'}
        </div>
      </section>

      <section style={{ marginTop: 18 }}>
        <h3>O que fazer se não houver perfil</h3>
        <ul>
          <li>Verifique se o usuário tem custom claim "role" ou campo perfil em Firestore.</li>
          <li>Se usar custom claims, atualize na Admin SDK (server) e reemita token (login novamente).</li>
          <li>Se usar Firestore, confirme documento em /usuarios com id igual ao uid (ou email).</li>
        </ul>
      </section>
    </main>
  );
}
