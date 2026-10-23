import os

# Valores fijos para las pruebas, para que no dependan del .env de nadie.
# Las variables de entorno tienen prioridad sobre el archivo .env.
os.environ.update(
    {
        "APP_ENV": "local",
        "DATABASE_URL_IDENTITY": "mysql+pymysql://test:test@127.0.0.1:3306/identity",
        "DATABASE_URL_NEO": "mysql+pymysql://test:test@127.0.0.1:3306/neo",
        "DATABASE_URL_WATCHLIST": "mysql+pymysql://test:test@127.0.0.1:3306/watchlist",
        "DATABASE_URL_MEDIA": "mysql+pymysql://test:test@127.0.0.1:3306/media",
        "JWT_SECRET": "secreto-de-pruebas-con-mas-de-32-caracteres",
    }
)
