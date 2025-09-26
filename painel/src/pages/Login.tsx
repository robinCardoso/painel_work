// @ts-ignore: alias-based image imports may not have ambient module declarations in TS config
import logo from '@assets/images/logo.png';
import './Login.css';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login(): JSX.Element {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const navigate = useNavigate();

  // Carrega apiKey via preload (main process lê arquivos do disco)
  useEffect(() => {
    (async () => {
      try {
        const cfg = await (window as any).api?.getFirebaseConfig();
        const key = cfg?.apiKey ?? null;
        const source = cfg?.source ?? null;
        if (key) {
          setApiKey(key);
          setError('');
          console.info('Firebase apiKey carregada desde:', source);
        } else {
          setApiKey(null);
          setError('Configuração do Firebase (apiKey) não encontrada.');
          console.warn('Nenhuma apiKey encontrada. Verificou config.txt / config.tx / credentials.json?');
        }
      } catch (e) {
        setApiKey(null);
        setError('Falha ao carregar configuração do Firebase.');
      }
    })();
  }, []);

  const validate = () => {
    if (!email || !email.includes('@')) {
      setError('Informe um email válido.');
      return false;
    }
    if (!senha || senha.length < 4) {
      setError('Senha deve ter pelo menos 4 caracteres.');
      return false;
    }
    setError('');
    return true;
  };

  async function signInWithFirebase(emailAddr: string, password: string) {
    if (!apiKey) throw new Error('apiKey ausente');
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(apiKey)}`;
    const body = { email: emailAddr, password, returnSecureToken: true };
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await resp.json();
    if (!resp.ok) {
      const msg = data && data.error && data.error.message ? data.error.message : 'Erro ao autenticar';
      throw new Error(msg);
    }
    return data; // contém idToken, localId, etc
  }

  // Busca role do usuário via accounts:lookup usando idToken
  async function fetchUserRole(apiKey: string, idToken: string): Promise<string | null> {
    try {
      const url = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken })
      });
      const data = await resp.json();
      if (!resp.ok) {
        console.warn('accounts:lookup falhou', data);
        return null;
      }
      const user = Array.isArray(data.users) && data.users[0] ? data.users[0] : null;
      if (!user) return null;

      // customAttributes pode ser string JSON com claims/custom
      if (user.customAttributes) {
        try {
          const attrs = typeof user.customAttributes === 'string' ? JSON.parse(user.customAttributes) : user.customAttributes;
          if (attrs && attrs.role) return String(attrs.role);
        } catch (e) {
          console.warn('Falha ao parsear customAttributes', e);
        }
      }

      // fallback: se houver providerUserInfo ou displayName, etc, não usamos aqui
      return null;
    } catch (e) {
      console.warn('Erro fetchUserRole', e);
      return null;
    }
  }

  const onSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    if (!apiKey) {
      setError('apiKey do Firebase não disponível. Confira config.txt ou credentials.json');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await signInWithFirebase(email.trim(), senha);
      const idToken = data.idToken || '';
      const localId = data.localId || '';
      localStorage.setItem('firebaseIdToken', idToken);
      localStorage.setItem('firebaseUser', email.trim());
      localStorage.setItem('firebaseLocalId', localId);

      // obtém role seguro e redireciona
      const role = await fetchUserRole(apiKey, idToken);
      if (role === 'admin') {
        navigate('/admin/index');
      } else if (role === 'associado') {
        navigate('/associado/index');
      } else {
        navigate('/home');
      }
    } catch (err: any) {
      setError(err?.message || 'Falha na autenticação');
    } finally {
      setLoading(false);
    }
  };

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

        <a href="#" className="login-link" onClick={(e)=>{ e.preventDefault(); alert('Enviar email de recuperação (simulado)'); }}>
          Recuperar senha
        </a>
      </form>
    </div>
  );
}
