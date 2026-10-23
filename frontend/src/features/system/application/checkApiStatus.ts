import type { ApiStatus, HealthRepository } from "../domain/ApiStatus";

// Caso de uso: recibe el repositorio por parámetro, así se puede probar con uno falso.
export async function checkApiStatus(repository: HealthRepository): Promise<ApiStatus> {
  try {
    const health = await repository.getHealth();
    return { online: true, environment: health.env };
  } catch {
    return { online: false };
  }
}
