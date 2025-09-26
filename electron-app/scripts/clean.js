const fs = require('fs');
const path = require('path');
const os = require('os');
const find = require('find-process');
const kill = require('tree-kill');

const myPid = process.pid;

// Função para aguardar um pouco
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Função para encerrar processos
async function killProcesses(names) {
  console.log(`Procurando por processos para encerrar: ${names.join(', ')}`);
  for (const name of names) {
    try {
      const list = await find('name', name, true); // 'true' para correspondência exata
      for (const p of list) {
        if (p.pid === myPid) {
          console.log(`Ignorando o processo atual (PID: ${p.pid})`);
          continue;
        }
        console.log(`Encerrando processo: ${p.name} (PID: ${p.pid})`);
        // Usando tree-kill para garantir que processos filhos também sejam encerrados
        await new Promise(resolve => kill(p.pid, 'SIGKILL', resolve));
      }
    } catch (err) {
      console.warn(`Aviso ao procurar/encerrar '${name}':`, err.message);
    }
  }
}

// Função para remover diretório de forma robusta
function removeDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.log(`Diretório não encontrado, nada a fazer: ${dirPath}`);
    return;
  }
  try {
    fs.rmSync(dirPath, { recursive: true, force: true });
    console.log(`Diretório removido com sucesso: ${dirPath}`);
  } catch (err) {
    console.error(`ERRO ao remover o diretório ${dirPath}:`, err.message);
    throw err; // Lança o erro para interromper o script
  }
}

// Função principal assíncrona
async function main() {
  console.log('--- INICIANDO LIMPEZA AGRESSIVA ---');

  // 1. Encerrar processos que podem estar bloqueando arquivos
  await killProcesses(['electron.exe', 'app-builder.exe']);
  
  // 2. Aguardar um momento para o SO liberar os arquivos
  console.log('Aguardando 1 segundo para liberação de arquivos...');
  await delay(1000);

  // 3. Remover os diretórios
  const distDir = path.join(__dirname, '..', 'dist');
  const cacheDir = path.join(os.homedir(), 'AppData', 'Local', 'electron-builder', 'cache');

  try {
    removeDir(distDir);
    removeDir(cacheDir);
    console.log('--- LIMPEZA CONCLUÍDA COM SUCESSO ---');
  } catch (e) {
    console.error('--- FALHA NA LIMPEZA. O PROCESSO DE BUILD SERÁ INTERROMPIDO. ---');
    console.error('Causa provável: Antivírus ou outro processo não identificado está bloqueando os arquivos.');
    process.exit(1); // Interrompe o script com código de erro
  }
}

// Executa a função principal
main();
