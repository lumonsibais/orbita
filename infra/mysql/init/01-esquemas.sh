#!/bin/bash
# Crea un esquema por módulo y un usuario que solo tiene permisos sobre su propio esquema.
# MySQL lo ejecuta una sola vez, cuando el volumen de datos está vacío. Si cambias algo aquí
# o en las contraseñas de infra/.env, hay que borrar el volumen:
#   docker compose -f infra/docker-compose.yml down -v

crear_modulo() {
  local esquema="$1"
  local password="$2"
  echo "Órbita: creando esquema ${esquema} y usuario ${esquema}_app"
  mysql -uroot -p"${MYSQL_ROOT_PASSWORD}" <<SQL
CREATE DATABASE IF NOT EXISTS \`${esquema}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE USER IF NOT EXISTS '${esquema}_app'@'%' IDENTIFIED BY '${password}';
GRANT ALL PRIVILEGES ON \`${esquema}\`.* TO '${esquema}_app'@'%';
SQL
}

crear_modulo identity "${IDENTITY_DB_PASSWORD}"
crear_modulo neo "${NEO_DB_PASSWORD}"
crear_modulo watchlist "${WATCHLIST_DB_PASSWORD}"
crear_modulo media "${MEDIA_DB_PASSWORD}"
