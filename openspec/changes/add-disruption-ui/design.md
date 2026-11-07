# Technical Design: Disruption UI (Frontend - Dev 3)

## 1. Architecture & Component Hierarchy

The frontend architecture follows a modular, feature-oriented structure with React 18, TypeScript, and Vite.
Styling uses strictly **CSS Modules** (`*.module.css`) to guarantee scoped styles without global pollution or heavyweight CSS frameworks.

```
App
├── Header (with Mock / Live API source switch)
│     ├── Brand / App Title
│     └── DataSourceToggle (Mock JSON vs FastAPI backend)
└── Router (react-router-dom)
      ├── Route "/": SearchPage
      │     ├── SearchForm (PNR validation: 6 alphanumeric uppercase chars)
      │     └── DemoQuickLinks (instant load for ABC123, etc.)
      └── Route "/booking/:bookingId": BookingDetailsPage
            ├── ErrorBoundary & DistillationFallback (handles malformed/unparseable API payloads)
            ├── LoadingSkeleton
            ├── PassengerSummaryCard (PII-protected view: passenger name, loyalty, type)
            ├── DecisionBanner (Alert on HUMAN_REVIEW with HC-4471 priority case, or AUTO_OFFER)
            ├── TripTimeline
            │     └── FlightCard (S1, S2, gate, times, delay badge, boarding/lounge times)
            ├── DisruptionNotice (distilled user message without raw API dumps)
            └── OptionsList
                  └── OptionCard (Rebook / Refund with seat availability and cost breakdown)
```

## 2. Wireframe

```
+-----------------------------------------------------------------------------------+
|  [LOGO] FlyCompanion - Disruption Assistant          [Data Source: [Mock ABC123 v]] |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  <- Back to Search                                     Booking Reference: ABC123  |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  | [!] Action Required: Human Review in Progress (Case: HC-4471)               |  |
|  | Your flight NB500 is delayed 160 min and connection NB2410 was missed.      |  |
|  | Priority support is handling your case (traveling with minor). Response <45m|  |
|  +-----------------------------------------------------------------------------+  |
|                                                                                   |
|  Passengers: Maria Silva (Adult, Gold Tier) • Tomás Silva (Child)                  |
|                                                                                   |
|  === FLIGHT ITINERARY ===                                                         |
|  +-----------------------------------------------------------------------------+  |
|  | NB500 | SCL -> LIM | Sep 15, 2026                 [DELAYED: +160 min]       |  |
|  | Departure: 14:30 -> Est. 17:10   |   Arrival: 17:55 -> Est. 20:35           |  |
|  | Gate: 24 | Boarding: 16:50       |   Lounge: 15:50                          |  |
|  +-----------------------------------------------------------------------------+  |
|  | NB2410 | LIM -> MEX | Sep 15, 2026                [CONNECTION MISSED]       |  |
|  | Scheduled: 19:05 -> 23:40 (Connection departs before arrival + 15 min MCT) |  |
|  +-----------------------------------------------------------------------------+  |
|                                                                                   |
|  === ELIGIBLE RESOLUTION OPTIONS ===                                               |
|  +-----------------------------------------------------------------------------+  |
|  | Option 1: Flight NB2412 (LIM -> MEX) • Sep 16, 2026 - 08:15                  |  |
|  | Fare Difference: $0.00 • Seats Available: 4 • Confidence: High               |  |
|  | [Select Option] (Disabled while Human Review is active)                     |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
```

## 3. Key Technical Decisions

1. **Language & Conventions**:
   - 100% of the code, types, comments, test names, and file names will be in **English**.
   - Clear naming conventions: `PascalCase` for React components, `camelCase` for utilities/hooks.
2. **Styling (CSS Modules)**:
   - Each component has its dedicated `.module.css` (e.g., `SearchPage.module.css`, `FlightCard.module.css`).
   - Shared CSS custom properties (colors, borders, shadows, breakpoints) are imported or declared scoped in root theme tokens.
3. **Routing (`react-router-dom`)**:
   - `BrowserRouter` with routes:
     - `/`: `SearchPage`
     - `/booking/:bookingId`: `BookingDetailsPage`
     - `*`: `NotFoundPage`
4. **Data Distillation & Resilience**:
   - API payloads must pass through distillation adapters that format times, compute status badges, and sanitize internal names (no exposure of `OPS_CORE`, `LEGACY_MIRROR`, or raw backend stack traces).
   - If an API payload cannot be safely distilled (e.g., missing essential flight segments or corrupted structure), a fallback error boundary (`DistillationErrorCard`) is displayed explaining that the reservation details require manual airport assistance.
5. **Data Source Switcher (Mock / Real API)**:
   - A visual control in the header lets the tester toggle between:
     - `Mock: Base Case ABC123` (loaded from `frontend/src/mocks/resolve-ABC123.json`)
     - `Live Backend API` (`http://localhost:8000/api/v1/disruptions/resolve`)
