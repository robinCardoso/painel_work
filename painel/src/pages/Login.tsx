import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../components/Login.css'; // <-- importa estilos do componente Login
// @ts-ignore: alias-based image imports may not have ambient module declarations in TS config
import logo from '@assets/images/logo.png'; // <-- novo import da logo

export default function Login(): JSX.Element {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [creatingProfile, setCreatingProfile] = useState(false);
  const [canCreateProfile, setCanCreateProfile] = useState(false); // habilita botão quando perfil ausente
  const navigate = useNavigate();

  // Helper to replace missing `debug` logger used in the original code.
  // Maps level strings to console methods in a safe way.
  function debug(level: string, ...args: any[]) {
    if (typeof console === 'undefined') return;
    const fn =
      level === 'error' ? console.error :
      level === 'warn' ? console.warn :
      level === 'info' ? console.info :
      (console.debug ?? console.log);
    try {
      fn(...args);
    } catch {
      // In very constrained runtimes console methods might throw; ignore.
    }
  }
  
  useEffect(() => {
    debug('info', 'Login mounted - loading firebase config');

    // captura rejections globais durante desenvolvimento para evitar "Uncaught (in promise)" ruidoso
    function onUnhandledRejection(ev: PromiseRejectionEvent) {
      const msg = String(ev?.reason || '');
      // filtra a mensagem específica que você relatou
      if (msg.includes('A listener indicated an asynchronous response by returning true')) {
        debug('warn', 'Ignored extension-like async-response error:', msg);
        ev.preventDefault(); // suprime o erro do console
        return;
      }
      // mantém log e permite inspeção para outros erros
      debug('error', 'Unhandled rejection', msg);
    }
    window.addEventListener('unhandledrejection', onUnhandledRejection);

    const sanitize = (v: any) => {
      if (typeof v !== 'string') return v;
      return v.trim().replace(/^["']|["']$/g, '').replace(/[,\s;]+$/g, '');
    };

    // cleanup do listener ao desmontar
    const cleanup = () => {
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
    };
    
    const tryFetchJson = async (url: string) => {
      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) return null;
        const j = await res.json();
        const apiKey = sanitize(j.apiKey ?? j.client_api_key ?? j.clientId ?? (j.web && j.web.apiKey) ?? (j.firebaseConfig && j.firebaseConfig.apiKey));
        const projectId = sanitize(j.projectId ?? j.project_id ?? (j.web && j.web.projectId) ?? (j.firebaseConfig && j.firebaseConfig.projectId));
        if (apiKey) return { apiKey, projectId };
      } catch (e) {
        /* ignore */
      }
      return null;
    };

    const tryFetchText = async (url: string) => {
      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) return null;
        const txt = await res.text();
        const m = txt.match(/apiKey\s*[:=]\s*["']?([^"'\r\n]+?)["']?(?:\s*,)?/i);
        const p = txt.match(/projectId\s*[:=]\s*["']?([^"'\r\n]+?)["']?(?:\s*,)?/i);
        const apiKey = m && m[1] ? sanitize(m[1]) : null;
        const projectId = p && p[1] ? sanitize(p[1]) : null;
        if (apiKey) return { apiKey, projectId };
      } catch (e) {
        /* ignore */
      }
      return null;
    };

    (async () => {
      try {
        // 1) preload (Electron)
        const preloadCfg = await (window as any).api?.getFirebaseConfig?.();
        debug('debug', 'getFirebaseConfig result', preloadCfg);
        if (preloadCfg && preloadCfg.apiKey) {
          setApiKey(preloadCfg.apiKey);
          setProjectId(preloadCfg.projectId ?? null);
          setError('');
          console.info('Firebase config carregada desde:', preloadCfg.source, 'projectId:', preloadCfg.projectId);
          cleanup();
          return;
        }

        // 2) fallback: tentar arquivos servidos pelo Vite (public/credentials.json ou public/config.txt)
        debug('info', 'preload ausente — tentando buscar /credentials.json e /config.txt via fetch');
        let cfg = await tryFetchJson('/credentials.json');
        if (!cfg) cfg = await tryFetchText('/config.txt');
        if (!cfg) cfg = await tryFetchText('/config.tx');

        if (cfg && cfg.apiKey) {
          setApiKey(cfg.apiKey);
          setProjectId(cfg.projectId ?? null);
          setError('');
          console.info('Firebase config carregada via fetch (dev):', cfg.projectId ? 'projectId=' + cfg.projectId : 'sem projectId');
          cleanup();
        } else {
          setApiKey(null);
          setProjectId(null);
          setError('Configuração do Firebase (apiKey) não encontrada.');
          debug('warn', 'Nenhuma apiKey encontrada via preload ou fetch');
          // mantém listener para capturar outras rejections enquanto dev estiver aberto
        }
      } catch (e) {
        debug('error', 'getFirebaseConfig failed', String(e));
        setApiKey(null);
        setProjectId(null);
        setError('Falha ao carregar configuração do Firebase.');
      } finally {
        // não remover listener aqui — removemos no return cleanup abaixo
      }
    })();

    return () => {
      // cleanup ao desmontar o componente
      try { window.removeEventListener('unhandledrejection', onUnhandledRejection); } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function validate() {
    if (!email) {
      setError('Informe o e-mail');
      return false;
    }
    if (!senha) {
      setError('Informe a senha');
      return false;
    }
    return true;
  }

  async function signInWithFirebase(email: string, senha: string) {
    const url = 'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=' + apiKey;
    const bodyObj = { email: email.trim(), password: senha, returnSecureToken: true };
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyObj)
    });
    const json = await resp.json();
    if (!resp.ok) {
      const msg = json?.error?.message || `HTTP ${resp.status}`;
      throw new Error(msg);
    }
    return json;
  }

  function getRoleFromIdToken(idToken: string): string | null {
    try {
      const payload = JSON.parse(atob(idToken.split('.')[1]));
      if (payload.role) return String(payload.role).toLowerCase();
      if (payload.admin === true) return 'admin';
      if (Array.isArray(payload.roles)) {
        if (payload.roles.includes('admin')) return 'admin';
        if (payload.roles.includes('associado')) return 'associado';
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  async function fetchUserRole(apiKey: string, idToken: string): Promise<string | null> {
    try {
      const url = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken })
      });
      if (!resp.ok) return null;
      const data = await resp.json();
      const user = data?.users?.[0];
      if (user?.customAttributes) {
        try {
          const attrs = JSON.parse(user.customAttributes);
          if (attrs.role) return String(attrs.role).toLowerCase();
        } catch {}
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  // tenta ler perfil no Firestore: usuarios/{uid} ou usuarios/{email}
  async function fetchUserProfileFromFirestore(projectId: string, idToken: string, uid: string | null, email: string | null): Promise<string | null> {
    try {
      const base = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/usuarios/`;

      const parsePerfilField = (field: any): string | null => {
        if (!field) return null;
        // Firestore stringValue
        if (typeof field === 'object' && field.stringValue) return String(field.stringValue);
        // Firestore mapValue with fields.role.stringValue
        if (typeof field === 'object' && field.mapValue && field.mapValue.fields) {
          const roleField = field.mapValue.fields.role;
          if (roleField && roleField.stringValue) return String(roleField.stringValue);
        }
        // Sometimes APIs / data may return plain object { role: 'admin' }
        if (typeof field === 'object' && field.role && typeof field.role === 'string') return String(field.role);
        // fallback: if it's a raw string
        if (typeof field === 'string') return field;
        return null;
      };

      const tryDoc = async (docId: string) => {
        try {
          const url = `${base}${encodeURIComponent(docId)}`;
          debug('debug', 'firestore GET doc', { url });
          const resp = await fetch(url, { method: 'GET', headers: { Authorization: `Bearer ${idToken}` } });
          if (resp.status === 404) {
            debug('info', 'Firestore document not found', { docId });
            return null;
          }
          if (!resp.ok) {
            debug('warn', 'Firestore GET failed', { status: resp.status, docId });
            return null;
          }
          const data = await resp.json();
          const perfilField = data?.fields?.perfil;
          const perfil = parsePerfilField(perfilField);
          debug('debug', 'firestore doc result', { docId, perfil });
          return perfil;
        } catch (e) {
          debug('error', 'tryDoc error', String(e));
          return null;
        }
      };

      // 1) tenta uid
      if (uid) {
        const r = await tryDoc(uid);
        if (r) return r;
      }

      // 2) tenta email como id
      if (email) {
        const r = await tryDoc(email);
        if (r) return r;
      }

      // 3) fallback: runQuery por campo "email" (mais flexível)
      if (email) {
        try {
          const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents:runQuery`;
          const body = {
            structuredQuery: {
              from: [{ collectionId: 'usuarios' }],
              where: {
                fieldFilter: {
                  field: { fieldPath: 'email' },
                  op: 'EQUAL',
                  value: { stringValue: email }
                }
              },
              limit: 1
            }
          };
          debug('debug', 'firestore runQuery', { url, body });
          const resp = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
            body: JSON.stringify(body)
          });
          if (!resp.ok) {
            debug('warn', 'runQuery failed', { status: resp.status });
            return null;
          }
          const results = await resp.json();
          for (const item of results) {
            const doc = item?.document;
            if (doc) {
              const perfilField = doc?.fields?.perfil;
              const perfil = parsePerfilField(perfilField);
              debug('info', 'runQuery found perfil', { perfil, docName: doc.name });
              if (perfil) return perfil;
            }
          }
          debug('info', 'runQuery returned no documents for email', { email });
        } catch (e) {
          debug('error', 'runQuery error', String(e));
        }
      }

      return null;
    } catch (e) {
      debug('error', 'fetchUserProfileFromFirestore outer error', String(e));
      return null;
    }
  }

  // tenta criar documento mínimo em Firestore: usuarios/{docId}
  async function createUserProfileInFirestore(projectId: string, idToken: string, docId: string, email: string, perfil = 'associado', nome = ''): Promise<boolean> {
    try {
      const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/usuarios/${encodeURIComponent(docId)}`;
      // body seguindo formato Firestore REST
      const body = {
        fields: {
          email: { stringValue: email },
          perfil: { stringValue: perfil },
          nome: { stringValue: nome || email.split('@')[0] },
          ativo: { booleanValue: true }
        }
      };
      debug('info', 'createUserProfileInFirestore request', { url, body });
      const resp = await fetch(url, {
        method: 'PATCH', // cria ou substitui
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`
        },
        body: JSON.stringify(body)
      });
      const txt = await resp.text();
      let json;
      try { json = txt ? JSON.parse(txt) : null; } catch { json = { raw: txt }; }
      debug('debug', 'createUserProfileInFirestore response', { status: resp.status, body: json });
      return resp.ok;
    } catch (e) {
      debug('error', 'createUserProfileInFirestore error', String(e));
      return false;
    }
  }

  const onSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    if (!apiKey || !projectId) {
      setError('Configuração do Firebase não disponível.');
      return;
    }
    setLoading(true);
    setError('');
    setCanCreateProfile(false);
    try {
      const data = await signInWithFirebase(email.trim(), senha);
      const idToken = data.idToken || '';
      const localId = data.localId || '';

      // Salva token/usuario
      localStorage.setItem('firebaseIdToken', idToken);
      localStorage.setItem('firebaseUser', email.trim());
      localStorage.setItem('firebaseLocalId', localId);

      // detecta role
      let role = getRoleFromIdToken(idToken);
      debug('debug', 'role from idToken', { role });

      // busca perfil no Firestore (normaliza)
      let perfil = null;
      if (!role) {
        perfil = await fetchUserProfileFromFirestore(projectId!, idToken, localId || null, email.trim() || null);
        debug('debug', 'perfil from Firestore result', { perfil });
        if (perfil) role = String(perfil).toLowerCase();
      }

      // fallback accounts:lookup
      if (!role) {
        role = await fetchUserRole(apiKey!, idToken);
        debug('debug', 'role from accounts.lookup', { role });
      }

      // Se ainda não houver role: permitir criar perfil (mostra botão)
      if (!role) {
        setCanCreateProfile(true);
        setError('Perfil não encontrado. Você pode criar um perfil básico para continuar.');
        // mantém token salvo; usuário deve clicar em "Criar perfil"
        setLoading(false);
        return;
      }

      // continua fluxo normal
      role = String(role).toLowerCase();
      localStorage.setItem('firebaseRole', role);
      if (role === 'admin') navigate('/admin/index', { replace: true });
      else if (role === 'associado') navigate('/associado/index', { replace: true });
      else setError('Você não tem um perfil cadastrado para acesso.');
    } catch (err: any) {
      setError(String(err.message).replace(/_/g, ' '));
      debug('error', 'onSubmit exception', { message: err?.message, stack: err?.stack });
    } finally {
      setLoading(false);
    }
  };

  // Handler do botão "Criar perfil" (chama a API e revalida)
  async function handleCreateProfile() {
    const idToken = localStorage.getItem('firebaseIdToken') || '';
    const uid = localStorage.getItem('firebaseLocalId') || '';
    const emailSaved = localStorage.getItem('firebaseUser') || email.trim();
    if (!idToken || !projectId || !uid) {
      setError('Não foi possível criar o perfil (token/projectId/uid ausente).');
      return;
    }
    setCreatingProfile(true);
    const ok = await createUserProfileInFirestore(projectId!, idToken, uid, emailSaved, 'associado', '');
    setCreatingProfile(false);
    if (ok) {
      debug('info', 'Perfil criado com sucesso, refazendo verificação');
      // re-obter perfil e redirecionar
      const perfil = await fetchUserProfileFromFirestore(projectId!, idToken, uid, emailSaved);
      if (perfil) {
        const role = String(perfil).toLowerCase();
        localStorage.setItem('firebaseRole', role);
        if (role === 'admin') navigate('/admin/index', { replace: true });
        else if (role === 'associado') navigate('/associado/index', { replace: true });
        else setError('Perfil criado, mas sem mapeamento para rotas.');
      } else {
        setError('Perfil criado, mas não foi possível confirmar. Recarregue e tente novamente.');
      }
    } else {
      setError('Falha ao criar perfil. Verifique permissões ou tente mais tarde.');
    }
  }

  return (
    <div className="login-container">
      <form className={`login-form ${error ? 'shake' : ''}`} onSubmit={onSubmit} noValidate>
        <img src={logo} alt="Logo da empresa" className="login-logo" />
        <h1 className="login-title">Entrar no Sistema</h1>
        <p className="login-subtitle">Acesse sua conta usando email e senha.</p>

        <input
          type="email"
          placeholder="seu@exemplo.com"
          className="login-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-label="Email"
        />

        <input
          type="password"
          placeholder="Senha"
          className="login-input"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          aria-label="Senha"
        />

        {error && <div className="login-error" role="alert">{error}</div>}

        <button type="submit" className="login-button" disabled={loading || !apiKey}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      {/* quando perfil ausente, oferecemos criar */}
      {canCreateProfile && (
        <div style={{ padding: 12, marginTop: 12 }}>
          <button onClick={handleCreateProfile} disabled={creatingProfile} style={{ padding: '8px 12px', borderRadius: 6, background: '#2563eb', color: '#fff', border: 'none' }}>
            {creatingProfile ? 'Criando perfil...' : 'Criar perfil básico (associado)'}
          </button>
        </div>
      )}
    </div>
  );
}