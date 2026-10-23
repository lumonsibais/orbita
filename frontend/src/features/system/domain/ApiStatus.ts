export type Environment = "local" | "dev" | "qa" | "prod";

export interface Health {
  status: "ok";
  env: Environment;
}

export type ApiStatus = { online: true; environment: Environment } | { online: false };

// El dominio dice QUÉ necesita; infrastructure decide CÓMO conseguirlo.
export interface HealthRepository {
  getHealth(): Promise<Health>;
}
