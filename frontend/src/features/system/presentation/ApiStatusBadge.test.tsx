import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ApiStatusBadge } from "./ApiStatusBadge";

// Reemplazamos el contenedor real por uno con un repositorio falso: la prueba no llama a la API.
vi.mock("@/app/container", () => ({
  container: {
    healthRepository: { getHealth: async () => ({ status: "ok", env: "dev" }) },
  },
}));

describe("ApiStatusBadge", () => {
  it("muestra el ambiente cuando la API responde", async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <ApiStatusBadge />
      </QueryClientProvider>,
    );

    expect(await screen.findByText("API en línea · ambiente dev")).toBeInTheDocument();
  });
});
