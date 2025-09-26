const admin = require('firebase-admin');
const path = require('path');

(async () => {
  try {
    // carregue service account (credentials.json deve estar na raiz do projeto)
    const credPath = path.resolve(__dirname, 'credentials.json');
    const serviceAccount = require(credPath);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    const auth = admin.auth();
    const db = admin.firestore();

    const email = 'contato@redeuniaonacional.com.br';
    const nome = 'Robson Soares Cardoso';
    const perfil = 'admin';
    // Data informada: 26 de setembro de 2025 às 10:25:53 UTC-3 -> UTC = +3h
    const dataCriacao = new Date('2025-09-26T13:25:53Z');
    const ativo = true;

    // tenta localizar usuário existente
    let userRecord = null;
    try {
      userRecord = await auth.getUserByEmail(email);
      console.log('Usuário já existe no Authentication. uid =', userRecord.uid);
    } catch (e) {
      if (e.code === 'auth/user-not-found' || e.message && e.message.includes('user-not-found')) {
        // criar usuário com senha gerada
        const senha = Math.random().toString(36).slice(2, 12) + 'A1!'; // 10 chars + sufixo simples
        userRecord = await auth.createUser({
          email,
          emailVerified: true,
          password: senha,
          displayName: nome,
          disabled: false
        });
        console.log('Usuário criado no Authentication. uid =', userRecord.uid);
        console.log('Senha gerada (guarde em local seguro):', senha);
      } else {
        throw e;
      }
    }

    const uid = userRecord.uid;

    // cria/atualiza documento em Firestore com id = uid
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

    // opcional: adicionar custom claim (apenas se desejar)
    // await auth.setCustomUserClaims(uid, { role: perfil });

    console.log('Operação concluída com sucesso.');
    process.exit(0);
  } catch (err) {
    console.error('Erro ao criar usuário/ documento:', err);
    process.exit(1);
  }
})();
