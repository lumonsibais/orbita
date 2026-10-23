import { z } from "zod";

// Igual que Settings en el backend: si falta una variable o es inválida, la app falla al
// arrancar y dice cuál, en lugar de fallar más tarde en una pantalla.
const envSchema = z.object({
  VITE_API_URL: z.url({ error: "VITE_API_URL debe ser una URL; revisa frontend/.env.local" }),
});

export const env = envSchema.parse(import.meta.env);
