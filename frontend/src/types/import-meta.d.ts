// Added to provide types for Vite environment variables used via import.meta.env
interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  // add other VITE_ env variables here as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
