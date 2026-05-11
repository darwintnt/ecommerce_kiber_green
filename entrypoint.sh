#!/bin/sh
set -e

echo "=================================================="
echo "Iniciando servicio: $APP_NAME"
echo "=================================================="

# Verificar que APP_NAME esté definido
if [ -z "$APP_NAME" ]; then
  echo "ERROR: La variable APP_NAME no está definida"
  exit 1
fi

CONFIG_PATH="apps/${APP_NAME}/prisma.config.ts"
SCHEMA_PATH="apps/${APP_NAME}/prisma/schema.prisma"

# Verificar que el config de Prisma existe
if [ ! -f "$CONFIG_PATH" ]; then
  echo "ERROR: No se encontró el archivo de configuración de Prisma en $CONFIG_PATH"
  exit 1
fi

if [ ! -f "$SCHEMA_PATH" ]; then
  echo "ERROR: No se encontró el schema de Prisma en $SCHEMA_PATH"
  exit 1
fi

echo "Configuración encontrada: $CONFIG_PATH"
echo "Schema encontrado: $SCHEMA_PATH"

# Cambiar al directorio del servicio para que Prisma encuentre prisma.config.ts
cd "apps/${APP_NAME}"

# Generar el cliente de Prisma
echo "Generando cliente de Prisma..."
npx prisma generate

# Verificar si existe la carpeta de migraciones
if [ -d "prisma/migrations" ]; then
  echo "Ejecutando migraciones de Prisma..."
  npx prisma migrate deploy

  if [ $? -eq 0 ]; then
    echo "✓ Migraciones aplicadas exitosamente"
  else
    echo "✗ Error al aplicar migraciones"
    exit 1
  fi
else
  echo "⚠️  No se encontraron migraciones. Usando 'prisma db push' para sincronizar el schema..."
  npx prisma db push --accept-data-loss

  if [ $? -eq 0 ]; then
    echo "✓ Schema sincronizado exitosamente con la base de datos"
  else
    echo "✗ Error al sincronizar el schema"
    exit 1
  fi
fi

# Ejecutar seeder SQL si existe (solo para products-service la primera vez)
SEED_SQL="prisma/seed.sql"
if [ -f "$SEED_SQL" ]; then
  echo "=================================================="
  echo "Ejecutando seeder de datos iniciales..."
  echo "=================================================="

  # psql no acepta ?schema=public en la URL, hay que usar search_path o separar el schema
  DB_URL_NO_SCHEMA=$(echo "$DATABASE_URL" | sed 's/?schema=public//')

  # Ejecutar el script SQL (solo inserta si la tabla está vacía)
  psql "$DB_URL_NO_SCHEMA" -f "$SEED_SQL"

  if [ $? -eq 0 ]; then
    echo "✓ Seeding completado"
  else
    echo "⚠️  Advertencia: El seeding falló, pero la aplicación continuará"
  fi
else
  echo "No se encontró seed.sql en $SEED_SQL"
fi

# Volver al directorio raíz
cd /app

echo "=================================================="
echo "Iniciando aplicación: $APP_NAME"
echo "=================================================="

# En desarrollo usar pnpm start:dev que compila on-the-fly
# En producción ya está compilado en dist/
if [ "$NODE_ENV" = "production" ]; then
  exec node dist/apps/${APP_NAME}/main
else
  exec pnpm start:dev --filter=${APP_NAME}
fi