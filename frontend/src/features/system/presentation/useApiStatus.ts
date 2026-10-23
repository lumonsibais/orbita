import { useQuery } from "@tanstack/react-query";

import { container } from "@/app/container";

import { checkApiStatus } from "../application/checkApiStatus";

export function useApiStatus() {
  return useQuery({
    queryKey: ["system", "api-status"],
    queryFn: () => checkApiStatus(container.healthRepository),
    refetchInterval: 30_000,
  });
}
