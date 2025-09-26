(function(){
  const form = document.getElementById('loginForm');
  const email = document.getElementById('email');
  const senha = document.getElementById('senha');
  const errorBox = document.getElementById('errorBox');
  const recover = document.getElementById('recover');

  // Função simplificada para carregar a logo
  async function resolveLogo() {
    const img = document.getElementById('logoImg');
    if (!img) return;

    // Pede ao processo principal do Electron o caminho para a imagem 'logo.png'
    const logoPath = await window.api.getAssetPath('logo.png');

    if (logoPath) {
      img.src = logoPath;
      img.alt = 'Logo da empresa';
    } else {
      // Se não encontrar, tenta carregar o ícone como fallback
      const iconPath = await window.api.getAssetPath('icon.ico');
      if (iconPath) {
        img.src = iconPath;
        img.alt = 'Ícone';
      } else {
        // Se nada for encontrado, mostra o estado de erro
        img.alt = 'Logo não encontrada';
        img.removeAttribute('src');
        console.error("Não foi possível encontrar 'logo.png' ou 'icon.ico' na pasta assets.");
      }
    }
  }

  // Chama a função para resolver a logo assim que o script carregar
  resolveLogo();

  let apiKey = null;
  let projectId = null;

  function showError(msg){
    errorBox.textContent = msg;
    errorBox.style.display = msg ? 'block' : 'none';
  }

  async function loadConfig(){
    try {
      const res = await fetch('./config.txt', {cache: 'no-store'});
      const txt = await res.text();
      const m = txt.match(/apiKey\s*:\s*["']([^"']+)["']/);
      if (m && m[1]) {
        apiKey = m[1];
      } else {
        throw new Error('apiKey não encontrada em config.txt');
      }
      const p = txt.match(/projectId\s*:\s*["']([^"']+)["']/);
      if (p && p[1]) {
        projectId = p[1];
      } // projectId pode ficar nulo se não existir, tratamos depois
    } catch (err) {
      showError('Erro carregando configuração: ' + err.message);
    }
  }

  // adiciona: consulta Firestore para ler campo "perfil" no documento usuarios/{email}
  async function fetchFirestoreProfile(userEmail, idToken){
    if (!projectId) return null;
    try {
      const docId = encodeURIComponent(userEmail);
      const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/usuarios/${docId}`;
      const resp = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer ' + idToken
        }
      });
      if (!resp.ok) {
        // pode retornar 403/404; trata como ausência de perfil
        return null;
      }
      const json = await resp.json();
      // Firestore document fields structure: fields: { perfil: { stringValue: "admin" } }
      const perfilField = json && json.fields && json.fields.perfil && json.fields.perfil.stringValue;
      if (perfilField) return String(perfilField).toLowerCase();
      return null;
    } catch (err) {
      console.warn('Erro ao ler perfil no Firestore:', err);
      return null;
    }
  }

  async function signIn(emailAddr, password){
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(apiKey)}`;
    const body = {email: emailAddr, password: password, returnSecureToken: true};
    const resp = await fetch(url, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(body)
    });
    return resp.json().then(data => ({ok: resp.ok, data}));
  }

  async function lookupAccount(idToken){
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`;
    const body = {idToken};
    const resp = await fetch(url, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(body)
    });
    return resp.json().then(data => ({ok: resp.ok, data}));
  }

  async function sendPasswordReset(emailAddr){
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${encodeURIComponent(apiKey)}`;
    const body = {requestType: 'PASSWORD_RESET', email: emailAddr};
    const resp = await fetch(url, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(body)
    });
    return resp.json().then(data => ({ok: resp.ok, data}));
  }

  // inicializa
  loadConfig();

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    showError('');
    const e = email.value.trim();
    const s = senha.value;

    if (!e) { showError('Informe um email válido.'); email.focus(); return; }
    if (!s || s.length < 4) { showError('Senha inválida.'); senha.focus(); return; }
    if (!apiKey) { showError('Configuração do Firebase ausente.'); return; }

    try {
      const {ok, data} = await signIn(e, s);
      if (!ok) {
        const msg = data && data.error && data.error.message ? data.error.message : 'Erro ao autenticar';
        showError('Erro de autenticação: ' + msg);
        return;
      }

      // sucesso: armazena token e user
      const idToken = data.idToken || '';
      const localId = data.localId || '';
      localStorage.setItem('firebaseIdToken', idToken);
      localStorage.setItem('firebaseUser', e);
      localStorage.setItem('firebaseLocalId', localId);

      // obtém informações adicionais (customAttributes) para identificar perfil
      try {
        const lookup = await lookupAccount(idToken);
        let role = null;
        if (lookup.ok) {
          const user = (lookup.data.users && lookup.data.users[0]) || null;
          if (user && user.customAttributes) {
            try {
              const attrs = JSON.parse(user.customAttributes);
              if (attrs && attrs.role) role = String(attrs.role).toLowerCase();
            } catch (err) {
              console.warn('Falha ao parsear customAttributes', err);
            }
          }
        }

        // se não obteve role via customAttributes, tenta Firestore (coleção usuarios)
        if (!role) {
          const firestoreRole = await fetchFirestoreProfile(e, idToken);
          if (firestoreRole) role = firestoreRole;
        }

        // fallback se ainda não definido
        if (!role) role = 'associado';
        redirectByRole(role);

      } catch (err) {
        console.error('Erro ao buscar perfil:', err);
        redirectByRole('associado');
      }

    } catch (err) {
      showError('Falha na requisição: ' + err.message);
    }
  });

  function redirectByRole(role){
    // role esperado: 'admin' || 'associado' (outros -> associado)
    if (role === 'admin') {
      // página de admin (relativa ao index.html)
      window.location.href = './pages/admin/admin/index.html';
    } else {
      // page associado
      window.location.href = './pages/associado/associado/index.html';
    }
  }

  recover.addEventListener('click', async (ev) => {
    ev.preventDefault();
    showError('');
    const addr = email.value.trim();
    if (!addr) {
      showError('Informe seu email para recuperar a senha.');
      email.focus();
      return;
    }
    if (!apiKey) { showError('Configuração do Firebase ausente.'); return; }

    try {
      const {ok, data} = await sendPasswordReset(addr);
      if (!ok) {
        const msg = data && data.error && data.error.message ? data.error.message : 'Erro ao solicitar recuperação';
        showError('Erro: ' + msg);
        return;
      }
      showError('Email de recuperação enviado. Verifique sua caixa de entrada.');
      console.log('sendOobCode response:', data);
    } catch (err) {
      showError('Falha na requisição: ' + err.message);
    }
  });
})();
