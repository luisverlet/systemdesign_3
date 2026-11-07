# Spec Delta

## Purpose

Decidir de forma determinista y trazable qué eventos operativos se toman como verdad cuando llegan de varias fuentes que pueden estar degradadas, desactualizadas o contradecirse.

## ADDED Requirements

### Requirement: Fuentes degradadas se descartan
El sistema SHALL ignorar todo evento cuya `source` esté listada en `_meta.sources_degraded` de la respuesta, y SHALL registrar el `event_id` descartado y el motivo.

#### Scenario: LEGACY_MIRROR degradado
- **WHEN** llegan E-1001 (OPS_CORE, DELAY 160) y E-1012 (LEGACY_MIRROR, ON_TIME) con `sources_degraded = ["LEGACY_MIRROR"]`
- **THEN** E-1012 queda descartado con motivo "source degraded" y el estado de S1 es DELAY de 160 minutos

### Requirement: Solo fuentes confiables
El sistema SHALL tomar en cuenta únicamente eventos de `OPS_CORE` y `AIRPORT_FEED`; cualquier otra fuente SHALL descartarse con motivo registrado.

#### Scenario: Fuente desconocida
- **WHEN** llega un evento con `source = "UNKNOWN_FEED"` no degradado
- **THEN** el evento se descarta con motivo "untrusted source"

### Requirement: Resolución por segmento y aspecto
El sistema SHALL resolver los eventos por (segmento, aspecto), donde los aspectos son "estado" (DELAY, STATUS) y "puerta" (GATE_CHANGE). Un evento de un aspecto MUST NOT anular a otro aspecto. Dentro de un aspecto gana el `recorded_at` más reciente.

#### Scenario: Cambio de puerta no borra el retraso
- **WHEN** S1 tiene E-1001 DELAY (10:48, OPS_CORE) y E-1007 GATE_CHANGE (10:55, AIRPORT_FEED)
- **THEN** S1 queda con retraso de 160 minutos y puerta 24

### Requirement: Contradicción entre fuentes sanas escala
Cuando dos fuentes confiables distintas reportan valores distintos para el mismo (segmento, aspecto), el sistema SHALL marcar el resultado como en conflicto con ambos `event_id` y MUST NOT elegir uno en silencio.

#### Scenario: OPS_CORE y AIRPORT_FEED no coinciden
- **WHEN** OPS_CORE dice DELAY 160 y AIRPORT_FEED dice STATUS ON_TIME para S1
- **THEN** el resultado de S1 queda en conflicto con ambos `event_id` y la decisión final es HUMAN
