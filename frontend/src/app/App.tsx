import { ApiStatusBadge } from "@/features/system/presentation/ApiStatusBadge";

export function App() {
  return (
    <main className="page">
      <header>
        <h1>Órbita</h1>
        <p>Seguimiento de asteroides cercanos a la Tierra</p>
      </header>
      <ApiStatusBadge />
    </main>
  );
}
