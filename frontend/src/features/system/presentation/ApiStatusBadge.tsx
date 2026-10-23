import { useApiStatus } from "./useApiStatus";

export function ApiStatusBadge() {
  const { data, isPending } = useApiStatus();

  if (isPending) {
    return <p className="badge">Conectando con la API…</p>;
  }
  if (!data?.online) {
    return <p className="badge badge--offline">API fuera de línea. ¿Está corriendo el backend?</p>;
  }
  return <p className="badge badge--online">API en línea · ambiente {data.environment}</p>;
}
