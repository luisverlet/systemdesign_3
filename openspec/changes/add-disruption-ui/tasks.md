## 1. Propuesta y Diseño
- [x] 1.1 Documentar proposal.md, design.md con wireframes y specs/disruption-ui/spec.md

## 2. Setup de Frontend y TypeScript (D3)
- [x] 2.1 Configurar TypeScript (`tsconfig.json`, `vite-env.d.ts`), scripts de build/test y paquetes necesarios
- [x] 2.2 Crear sistema de diseño base en `src/styles/theme.css` y layout global (`AppLayout`, `Header` con selector de Mock/API)

## 3. Capa de Servicios y API Client
- [x] 3.1 Implementar `src/services/disruptionApi.ts` consumiendo `resolve-ABC123.json` en modo mock o FastAPI backend
- [x] 3.2 Tests unitarios para el servicio API (manejo de éxito, errores 404/422/503 y fallback)

## 4. Página de Búsqueda de Reserva
- [ ] 4.1 Componente `SearchPage` con validación de código PNR (6 caracteres alfanuméricos)
- [ ] 4.2 Accesos directos a casos de prueba preconfigurados (ej. reserva `ABC123`)

## 5. Visualización del Estado e Impacto del Viaje
- [ ] 5.1 Componentes de vuelos `FlightCard`, `TripTimeline` y etiquetas de estado `EventBadge`
- [ ] 5.2 Indicadores claros de impacto: retraso acumulado, conexión perdida y cálculo de tiempos (embarque y sala)

## 6. Opciones, Toma de Decisión y Caso Humano
- [ ] 6.1 Componente `DecisionBanner` para casos de revisión humana (`HUMAN_REVIEW`, caso `HC-4471`) y auto-ofertas
- [ ] 6.2 Componente `OptionCard` para rebookings y compensaciones elegibles
- [ ] 6.3 Resumen de pasajeros y cumplimiento de confidencialidad PII (D6)

## 7. Resiliencia, Estados de Carga y Pruebas E2E / Vitest
- [ ] 7.1 Estados de carga (`SkeletonLoader`), errores interactivos y reconexión
- [ ] 7.2 Tests de integración con Vitest para el flujo completo del caso base `ABC123`
