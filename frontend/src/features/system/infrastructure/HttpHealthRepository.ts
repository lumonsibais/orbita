import { z } from "zod";

import type { HttpClient } from "@/shared/http/httpClient";

import type { Health, HealthRepository } from "../domain/ApiStatus";

// Forma exacta que esperamos de GET /health del backend.
const healthSchema = z.object({
  status: z.literal("ok"),
  env: z.enum(["local", "dev", "qa", "prod"]),
});

export class HttpHealthRepository implements HealthRepository {
  private readonly http: HttpClient;

  constructor(http: HttpClient) {
    this.http = http;
  }

  getHealth(): Promise<Health> {
    return this.http.get("/health", healthSchema);
  }
}
