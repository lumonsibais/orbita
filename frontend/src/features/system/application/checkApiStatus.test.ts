import { describe, expect, it } from "vitest";

import type { HealthRepository } from "../domain/ApiStatus";
import { checkApiStatus } from "./checkApiStatus";

describe("checkApiStatus", () => {
  it("reporta el ambiente cuando la API responde", async () => {
    const repository: HealthRepository = {
      getHealth: async () => ({ status: "ok", env: "qa" }),
    };

    await expect(checkApiStatus(repository)).resolves.toEqual({
      online: true,
      environment: "qa",
    });
  });

  it("reporta fuera de línea cuando la API falla", async () => {
    const repository: HealthRepository = {
      getHealth: async () => {
        throw new Error("sin conexión");
      },
    };

    await expect(checkApiStatus(repository)).resolves.toEqual({ online: false });
  });
});
