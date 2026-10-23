import type { z } from "zod";

import { env } from "@/shared/config/env";

export class HttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

// Cliente HTTP compartido por todas las features. Valida cada respuesta con un schema de
// Zod: si la API cambia sin avisar, el error aparece aquí y no en medio de una pantalla.
// En el sprint 5 aquí se agregan el token de acceso y la renovación con el refresh token.
export class HttpClient {
  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async get<T>(path: string, schema: z.ZodType<T>): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) {
      throw new HttpError(response.status, `GET ${path} respondió ${response.status}`);
    }
    return schema.parse(await response.json());
  }
}

export const httpClient = new HttpClient(env.VITE_API_URL);
