// Raíz de composición: el único lugar que conoce las implementaciones concretas
// (infrastructure) y las entrega a los casos de uso. Cada feature nueva registra aquí
// sus repositorios.
import { HttpHealthRepository } from "@/features/system/infrastructure/HttpHealthRepository";
import { httpClient } from "@/shared/http/httpClient";

export const container = {
  healthRepository: new HttpHealthRepository(httpClient),
};
