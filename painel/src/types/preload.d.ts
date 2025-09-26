export {};

declare global {
  interface Window {
    api?: {
      // retorna a apiKey do Firebase ou null se não encontrada
      getFirebaseApiKey: () => Promise<string | null>;
      getFirebaseConfig: () => Promise<{ apiKey: string | null; projectId: string | null; source: string | null }>;

      // novo
      log: (level: 'debug' | 'info' | 'warn' | 'error', message: string, meta?: any) => void;
      getDebugLog: () => Promise<string>;
    };
  }
}
