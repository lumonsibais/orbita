# Features

Cada carpeta es una funcionalidad del producto, con los mismos nombres que los módulos del backend. Todas tienen las mismas cuatro capas:

| Capa              | Qué va aquí                                                                               | Puede importar                                          |
| ----------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `domain/`         | Tipos de datos (`Asteroid`, `User`) e interfaces de repositorio. TypeScript puro.         | Nada de las otras capas                                 |
| `application/`    | Casos de uso (`login`, `getNeoFeed`): funciones que reciben el repositorio por parámetro. | `domain`                                                |
| `infrastructure/` | Repositorios que hablan con la API usando `@/shared/http` y validan con Zod.              | `domain`, `shared`                                      |
| `presentation/`   | Componentes, páginas y hooks de React. Llaman casos de uso, nunca `fetch`.                | `application`, `domain`, `@/app/container`, `shared/ui` |

ESLint revisa estas reglas (`eslint.config.js`): si una capa importa lo que no debe, `npm run lint` falla.

`system/` es el ejemplo completo: muestra si la API está en línea. Para una feature nueva, sigue el mismo camino:

1. `domain/`: el tipo y la interfaz del repositorio.
2. `application/`: el caso de uso, con su prueba usando un repositorio falso.
3. `infrastructure/`: el repositorio HTTP con su schema de Zod.
4. Registra el repositorio en `src/app/container.ts`.
5. `presentation/`: un hook con `useQuery` que llama al caso de uso, y el componente.

| Feature                      | Sprint | Dueña o dueño |
| ---------------------------- | ------ | ------------- |
| `system`                     | 1      | JL (ejemplo)  |
| `auth`                       | 5      | Ella          |
| `neo`, `watchlist`, `impact` | 6      | Ella          |
| `media`                      | 8      | Ella          |
