#!/usr/bin/env node
/**
 * Script CLI para criar usuário (Auth + Firestore).
 * Uso:
 *  node create_admin_user_cli.js --email contato@... --nome "Nome" --perfil admin --ativo true --data "2025-09-26T13:25:53Z"
 * Se algum argumento faltar, o script pergunta interativamente.
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith('--')) {
      const k = a.slice(2);
      const v = args[i+1] && !args[i+1].startsWith('--') ? args[++i] : 'true';
      out[k] = v;
    }
  }
  return out;
}

async function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, ans => { rl.close(); resolve(ans.trim()); }));
}

async function main() {
  try {
    const root = path.resolve(__dirname);
    const credFile = path.join(root, 'credentials.json');
    if (!fs.existsSync(credFile)) {
      console.error('credentials.json não encontrado em', credFile);
      process.exit(1);
    }
    const serviceAccount = require(credFile);
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    const auth = admin.auth();
    const db = admin.firestore();

    const argv = parseArgs();
    let email = argv.email || await prompt('Email: ');
    let nome = argv.nome || await prompt('Nome completo: ');
    let perfil = argv.perfil || await prompt('Perfil (admin/associado): ');
    let ativo = typeof argv.ativo !== 'undefined' ? (String(argv.ativo).toLowerCase() === 'true') : (await prompt('Ativo (true/false): ')).toLowerCase() === 'true';
    let dataStr = argv.data || await prompt('Data criação (ISO, ex: 2025-09-26T13:25:53Z) ou ENTER para agora: ');
    const dataCriacao = dataStr ? new Date(dataStr) : new Date();

    // validações básicas
    if (!email) { console.error('Email é obrigatório'); process.exit(1); }
    if (!nome) nome = email.split('@')[0];
    if (!perfil) perfil = 'associado';

    // criar ou obter usuário no Auth
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
      console.log('Usuário já existe no Auth. uid=', userRecord.uid);
    } catch (e) {
      if (e.code === 'auth/user-not-found' || (e.message && e.message.includes('user-not-found'))) {
        // senha gerada simples (trocar em produção)
        const senha = Math.random().toString(36).slice(2, 12) + 'A1!';
        userRecord = await auth.createUser({ email, emailVerified: true, password: senha, displayName: nome, disabled: false });
        console.log('Usuário criado no Auth. uid=', userRecord.uid);
        console.log('Senha gerada:', senha);
      } else {
        throw e;
      }
    }

    const uid = userRecord.uid;
    // criar/atualizar documento Firestore usuarios/{uid}
    const docRef = db.collection('usuarios').doc(uid);
    const docData = {
      ativo: ativo,
      data_criacao: admin.firestore.Timestamp.fromDate(dataCriacao),
      email: email,
      nome: nome,
      perfil: perfil
    };
    await docRef.set(docData, { merge: true });
    console.log(`Documento usuarios/${uid} criado/atualizado com sucesso.`);

    // opcional: setar custom claim
    try {
      await auth.setCustomUserClaims(uid, { role: perfil });
      console.log('Custom claim "role" definida como:', perfil);
    } catch (e) {
      console.warn('Falha ao setar custom claim (pode exigir permissões):', e.message || e);
    }

    console.log('Operação concluída.');
    process.exit(0);
  } catch (err) {
    console.error('Erro:', err);
    process.exit(1);
  }
}

main();
