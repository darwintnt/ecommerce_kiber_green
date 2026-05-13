# E-Commerce Microservices API Gateway

Sistema de procesamiento de órdenes distribuido construido con NestJS, implementando patrón **CQRS + Saga** para gestionar flujos de trabajo complejos entre múltiples servicios.

## Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                         API Gateway                              │
│                      (Puerto 3000)                               │
└──────────┬─────────────────┬─────────────────┬───────────────────┘
           │                 │                 │
           ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Orders       │  │ Products     │  │ Inventory    │  │ Payments    │
│ Service      │  │ Service      │  │ Service      │  │ Service     │
│ (Puerto 3001) │  │ (Puerto 3002)│  │ (Puerto 3003)│  │ (Puerto 3004)│
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
           │                 │                 │                 │
           └─────────────────┴────────┬────────┴─────────────────┘
                                      │
                        ┌────────────┴───────────┐
                        ▼                         ▼
                 ┌──────────────┐          ┌──────────┐
                 │  PostgreSQL  │          │   NATS   │
                 │   (5432)     │          │  (4222)  │
                 └──────────────┘          └──────────┘
```

## Estructura del Monorepo

```
api-gateway/
├── apps/
│   ├── api-gateway/        # Gateway principal (puerta de enlace)
│   ├── orders-service/     # Gestión de órdenes (CQRS + Saga)
│   ├── products-service/   # Catálogo de productos
│   ├── inventory-service/  # Control de inventario
│   └── payments-service/   # Procesamiento de pagos
├── libs/
│   ├── commons/            # Utilidades compartidas
│   ├── constants/          # Constantes del dominio
│   └── interfaces/         # Contratos entre servicios
├── docker-compose.yml      # Producción (build + multi-stage)
├── docker-compose.dev.yml  # Desarrollo (hot-reload con volúmenes)
└── init-databases.sh       # Script de inicialización PostgreSQL
```

## Tecnologías

| Componente | Tecnología | Propósito |
|------------|------------|-----------|
| Runtime | Node.js 20 | Ejecución de servicios |
| Framework | NestJS 11 | Arquitectura modular |
| API Gateway | NestJS Microservices | Routing + Authentication |
| Message Broker | NATS | Comunicación async + Event Streaming |
| Database | PostgreSQL 16 | Persistencia principal |
| Package Manager | pnpm 9 | Monorepo management |
| Containerization | Docker Compose | Orquestación |

## Requisitos

- [Docker Desktop](https://docs.docker.com/desktop/) (con WSL2 en Windows)
- [pnpm](https://pnpm.io/installation) (opcional para desarrollo local sin Docker)

## Quick Start

### Desarrollo con Docker (Recomendado)

```bash
# Levanta todos los servicios con hot-reload
docker compose -f docker-compose.dev.yml down && docker compose -f docker-compose.dev.yml up --build

pnpm start:dev // Api-gateway
pnpm run start:dev orders-service
pnpm run start:dev payments-service
pnpm run start:dev inventory-service
pnpm run start:dev products-service

# Luego se debe ingresar a cada microservicio y ejecutar el comando npx prisma migrate --name init excepto para inventory-service

# Ver logs en tiempo real
docker compose -f docker-compose.dev.yml up -d
docker compose -f docker-compose.dev.yml logs -f
```

### Producción (Build + Run)

```bash
# Build y ejecución
docker compose up --build

# Escalar servicios (ejemplo: 3 instancias de orders-service)
docker compose up --scale orders-service=3
```

### Desarrollo Local (Sin Docker)

```bash
# Instalar dependencias
pnpm install

# Levantar infraestructura (Postgres, NATS)
docker compose up -d postgres_db nats

# Ejecutar servicios en modo watch
pnpm start:dev

# O ejecutar un servicio específico
pnpm start:dev --filter=orders-service
```

## Endpoints

| Servicio | URL | Descripción |
|----------|-----|-------------|
| API Gateway | http://localhost:3000 | Puerta de enlace principal |
| NATS Monitoring | http://localhost:8222 | Dashboard de streams |
| Orders Service | http://localhost:3001 | API de órdenes |
| Products Service | http://localhost:3002 | API de productos |
| Inventory Service | http://localhost:3003 | API de inventario |
| Payments Service | http://localhost:3004 | API de pagos |

## Variables de Entorno

Cada servicio soporta las siguientes variables:

| Variable | Default | Descripción |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Entorno de ejecución |
| `PORT` | Servicio-dependiente | Puerto HTTP |
| `NATS_URL` | `nats://nats:4222` | Conexión a NATS |
| `POSTGRES_HOST` | `postgres_db` | Host de PostgreSQL |
| `POSTGRES_PORT` | `5432` | Puerto PostgreSQL |
| `POSTGRES_USER` | `admin` | Usuario PostgreSQL |
| `POSTGRES_PASSWORD` | `admin123` | Contraseña PostgreSQL |
| `POSTGRES_DB` | `ecommerce_dev` | Base de datos |

## Testing

### Unit Tests (sin Docker)

Los unit tests no requieren servicios externos y pueden ejecutarse directamente:

```bash
# Todos los unit tests
pnpm test

# Todos los e2e tests
pnpm test:e2e (Requiere docker compose operando)

# Tests en modo watch
pnpm test:watch

# Coverage report
pnpm test:cov

# Tests específicos de saga (steps + orchestrator)
npx jest apps/orders-service/src/saga/ --no-coverage

# Tests del create-order handler
npx jest apps/orders-service/src/commands/create-order/create-order.handler.spec.ts --no-coverage
```

**Tests disponibles:**

| Suite | Tests | Descripción |
|-------|-------|-------------|
| `saga-orchestrator.spec.ts` | 6 | Ejecución de steps, compensación, manejo de errores |
| `inventory-validate.step.spec.ts` | 5 | Validación de stock |
| `inventory-reserve.step.spec.ts` | 6 | Reserva de inventario |
| `payment-process.step.spec.ts` | 8 | Procesamiento y reembolso de pagos |
| `order-confirm.step.spec.ts` | 6 | Confirmación de orden |
| `create-order.handler.spec.ts` | 6 | Creación de órdenes, idempotency, errores |

**Total: 37 tests passing**

### Integration Tests (requiere Docker)

Los integration tests requieren PostgreSQL y NATS corriendo:

```bash
# 1. Levantar servicios de infraestructura
docker compose up -d postgres_db nats

# 2. Ejecutar integration tests
npx jest apps/orders-service/test/create-order.integration.spec.ts --detectOpenHandles
```

### E2E Tests (requiere todos los servicios)

Los tests E2E requieren todos los servicios levantados:

```bash
# 1. Levantar todos los servicios
docker compose up -d

# 2. Esperar a que los servicios estén healthy
docker compose ps

# 3. Ejecutar tests E2E
pnpm test:e2e
```

**Tests E2E (`apps/api-gateway/test/orders.e2e-spec.ts`):**
- Creación de órdenes (happy path)
- Validación de idempotency key
- Validación de DTOs (400 para datos inválidos)
- Consulta y listado de órdenes
- Cancelación de órdenes

### Notas

- Los integration y E2E tests necesitan la base de datos y NATS corriendo
- Los unit tests usan mocks y no requieren servicios externos
- Si un test falla con "Cannot find module", verificá que el archivo de origen exista
- Los tests legacy con paths incorrectos fueron eliminados

## Comandos Disponibles

```bash
# Desarrollo
pnpm start:dev              # Modo watch con hot-reload
pnpm start:dev --filter=<service>  # Servicio específico

# Producción
pnpm build                  # Compila todos los servicios
pnpm start:prod            # Ejecuta en producción

# Testing
pnpm test                   # Unit tests (37 passing)
pnpm test:watch             # Tests en watch mode
pnpm test:cov               # Coverage report
pnpm test:e2e              # E2E tests (requiere Docker)

# Calidad de código
pnpm lint                   # ESLint + Prettier
pnpm format                 # Solo Prettier
```

## Patrones Implementados

### CQRS (Command Query Responsibility Segregation)
- **Commands**: CreateOrder, UpdateOrderStatus, CancelOrder
- **Queries**: GetOrderById, GetOrdersByUser, GetOrderHistory
- Separación clara entre escritura (commands) y lectura (queries)

### Saga Pattern
Orquestación de transacciones distribuidas:
1. `CreateOrderSaga` → Valida → Reserva inventario → Procesa pago → Confirma
2. Compensación automática en caso de errores

## Troubleshooting

### Windows: Docker Desktop no inicia
```powershell
wsl --update
docker-desktop --reset
```

### WSL2: Performance lenta
```bash
# En WSL2, limitar Docker resources
# Docker Desktop > Settings > Resources > CPU: 4, Memory: 8GB
```

### Puerto en uso
```bash
# Verificar qué proceso usa el puerto
netstat -ano | findstr :3000  # Windows
lsof -i :3000                 # Mac/Linux

# Matar el proceso
taskkill /PID <pid> /F       # Windows
kill -9 <pid>                 # Mac/Linux
```

### Limpiar todo y empezar de nuevo
```bash
docker compose down -v      # Eliminar contenedores y volúmenes
docker system prune -af     # Limpiar recursos no usados
```

## Autor

**Darwin Gomez** — Arquitectura distribuida, CQRS + Saga patterns

## Licencia

UNLICENSED — Private project