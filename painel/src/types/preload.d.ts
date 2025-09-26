export {};

declare global {
  interface Window {
    api?: {
      // retorna a apiKey do Firebase ou null se não encontrada
      getFirebaseApiKey: () => Promise<string | null>;
      getFirebaseConfig: () => Promise<{ apiKey: string | null; source: string | null }>;

    };
  }
}
