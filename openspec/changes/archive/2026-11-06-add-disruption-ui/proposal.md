# Change: Interfaz de usuario para Disruption Companion (Frontend - Dev 3)

## Why
El sistema Disruption Companion resuelve contingencias operativas (retrasos, conexiones perdidas, reglas de compensación y casos de revisión humana). Para completar el *vertical slice* y ofrecer valor al usuario final (pasajeros o agentes de aeropuerto), se requiere una interfaz web intuitiva, reactiva y accesible que permita consultar una reserva, comprender el estado real del viaje y visualizar las alternativas o la gestión de su caso prioritario.

## What Changes
- Migración y configuración completa de TypeScript para el frontend (`tsconfig.json`, tipado estricto con los contratos de `types/disruption.ts`).
- Estilos con **CSS Modules** y sistema de variables de diseño nativas (Design Tokens: tipografía, colores semánticos, espaciado) sin dependencias externas pesadas, cumpliendo la decisión **D3**.
- Cliente HTTP `disruptionApi.ts` con manejo de estados asíncronos y alternancia transparente entre datos simulados (`src/mocks/resolve-ABC123.json`) y la API real en FastAPI (`POST /api/v1/disruptions/resolve`).
- Vistas principales:
  - **Búsqueda de reserva (`SearchPage`)**: Validación en cliente de PNR/código de reserva (6 caracteres alfanuméricos en mayúsculas) y ejemplos rápidos de prueba (ej. `ABC123`).
  - **Detalle del viaje (`TripView`)**:
    - Cabecera con datos esenciales de pasajeros (cumpliendo política de privacidad **D6**).
    - Línea de tiempo visual del itinerario (`TripTimeline`, `FlightCard`, `EventBadge`).
    - Alerta destacada de decisión / escalamiento (`DecisionBanner`: caso humano `HUMAN_REVIEW` con ID de caso y tiempo estimado de resolución).
    - Listado de alternativas elegibles (`OptionCard`) con diferenciación de costos, horarios y confianza.
- Manejo integral de estados de carga, desconexión y códigos de error (404 Reserva no encontrada, 422 Formato inválido, 503 Servicio no disponible).
- Suite de pruebas de componentes y servicios con Vitest y React Testing Library.

## Impact
- Specs afectadas: `specs/disruption-ui/spec.md` (nueva especificación).
- Código afectado: `frontend/` (configuraciones, componentes, estilos, servicios y tests).
- Responsable: Dev 3.
- No impacta ni altera el backend ni los contratos de Fase 0.
