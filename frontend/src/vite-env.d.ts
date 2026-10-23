// Tipos de las variables de entorno: si agregas una a .env.example, agrégala también aquí
// y en src/shared/config/env.ts.
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
