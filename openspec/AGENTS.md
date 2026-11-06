# OpenSpec – Flujo de trabajo para agentes

## Las 3 etapas

### 1. Proponer (antes de codificar)
1. Revisa `openspec/project.md`, `openspec/specs/` y los cambios activos en `openspec/changes/` para evitar conflictos.
2. Elige un `change-id` en kebab-case con verbo: `add-user-auth`, `update-order-api`, `remove-legacy-report`.
3. Copia `openspec/changes/_template/` a `openspec/changes/<change-id>/` y completa:
   - `proposal.md` – Por qué, qué cambia, impacto.
   - `tasks.md` – Checklist de implementación.
   - `design.md` – Solo si hay decisiones técnicas relevantes (nueva dependencia, cambios de DB, seguridad, multi-servicio).
   - `specs/<capacidad>/spec.md` – Deltas de requisitos.
4. Pide revisión al equipo (PR) **antes** de implementar.

### 2. Implementar
1. Sigue `tasks.md` en orden; marca `- [x]` al terminar cada tarea.
2. Coloca el código según el mapa de `AGENTS.md` (raíz).
3. Agrega tests para cada escenario del spec.

### 3. Archivar (después del despliegue/merge)
1. Aplica los deltas a `openspec/specs/<capacidad>/spec.md`.
2. Mueve la carpeta a `openspec/changes/archive/YYYY-MM-DD-<change-id>/`.

## Formato de deltas de spec

```markdown
## ADDED Requirements
### Requirement: Nombre del requisito
El sistema SHALL/DEBE ...

#### Scenario: Caso exitoso
- **WHEN** el usuario hace X
- **THEN** el sistema responde Y

## MODIFIED Requirements
### Requirement: Nombre existente
(texto completo actualizado del requisito, con sus escenarios)

## REMOVED Requirements
### Requirement: Nombre eliminado
**Reason**: ...
**Migration**: ...
```

Reglas:
- Cada requisito DEBE tener al menos un `#### Scenario:` (exactamente 4 `#`).
- Usa SHALL/MUST (o DEBE) para requisitos normativos.
- Una capacidad = una carpeta en `specs/` (`auth`, `orders`, `notifications`...).

## Cuándo NO hace falta propuesta
Corrección de bugs que restauran el comportamiento especificado, typos, formato, comentarios, actualización de dependencias sin cambio de comportamiento, tests de comportamiento existente.

## CLI (opcional)
Si el equipo instala `npm i -g @fission-ai/openspec`: `openspec list`, `openspec show <id>`, `openspec validate <id> --strict`, `openspec archive <id>`.
