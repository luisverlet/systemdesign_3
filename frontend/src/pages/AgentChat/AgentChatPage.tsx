import React, { useState } from 'react'
import { useDataSource } from '../../context/DataSourceContext'
import { askAgent, ApiError } from '../../services/disruptionApi'
import { AgentResponse } from '../../types/agent'
import styles from './AgentChatPage.module.css'

const MARIA_PRESET_QUERY =
  'Hola, soy Maria. Mi vuelo a Lima está retrasado y viajo con mi hijo de 7 años. ¿Alcanzamos la conexión a México? Si no, cámbiennos al vuelo de esta noche. También quiero saber cuánto me van a pagar de compensación.'

export const AgentChatPage: React.FC = () => {
  const { mode } = useDataSource()
  const [bookingId, setBookingId] = useState('ABC123')
  const [message, setMessage] = useState(MARIA_PRESET_QUERY)
  const [submittedQuery, setSubmittedQuery] = useState<{ bookingId: string; message: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [agentResponse, setAgentResponse] = useState<AgentResponse | null>(null)

  const handleApplyMariaPreset = () => {
    setBookingId('ABC123')
    setMessage(MARIA_PRESET_QUERY)
    setError(null)
  }

  const handleClear = () => {
    setBookingId('')
    setMessage('')
    setAgentResponse(null)
    setSubmittedQuery(null)
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bookingId.trim() || !message.trim()) {
      setError('Por favor ingrese el código de reserva (PNR) y su mensaje.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await askAgent(
        {
          booking_id: bookingId.trim().toUpperCase(),
          message: message.trim(),
        },
        mode
      )
      setSubmittedQuery({ bookingId: bookingId.trim().toUpperCase(), message: message.trim() })
      setAgentResponse(response)
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Ocurrió un error inesperado al consultar al agente.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.headerSection}>
        <span className={styles.badge}>Agentic Architecture &bull; Function Calling &bull; HITL Safety</span>
        <h1 className={styles.title}>AI Disruption Companion Agent</h1>
        <p className={styles.subtitle}>
          Interacción conversacional asistida por IA con resolución determinista de eventos,
          defensa contra prompt injection y guardrail estricto de protección de menores (Regla R5).
        </p>
      </div>

      <div className={styles.queryCard}>
        <div className={styles.presetBar}>
          <span className={styles.presetLabel}>Casos de Prueba:</span>
          <button
            type="button"
            className={styles.presetBtn}
            onClick={handleApplyMariaPreset}
            data-testid="preset-maria-btn"
          >
            ✈️ Caso Base: María y Tomás (ABC123)
          </button>
          <button type="button" className={styles.clearBtn} onClick={handleClear}>
            Limpiar
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.formGrid}>
          <div className={styles.fieldGroup}>
            <label htmlFor="bookingId" className={styles.label}>
              Código de Reserva (PNR)
            </label>
            <input
              id="bookingId"
              type="text"
              className={styles.input}
              value={bookingId}
              maxLength={6}
              onChange={(e) => setBookingId(e.target.value.toUpperCase())}
              placeholder="EJ. ABC123"
              disabled={loading}
              required
            />
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="message" className={styles.label}>
              Consulta del Pasajero en Lenguaje Natural
            </label>
            <textarea
              id="message"
              className={styles.textarea}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escriba su consulta respecto al viaje..."
              rows={3}
              disabled={loading}
              required
            />
          </div>

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading || !bookingId.trim() || !message.trim()}
            data-testid="submit-agent-query-btn"
          >
            {loading ? 'Consultando al Agente...' : 'Consultar al Agente de IA'}
          </button>
        </form>
      </div>

      {error && (
        <div className={styles.errorBanner} role="alert">
          <span>⚠️</span>
          <div>{error}</div>
        </div>
      )}

      {agentResponse && submittedQuery && (
        <div className={styles.resultsSection}>
          {agentResponse.human_required && (
            <div className={styles.hitlBanner} data-testid="hitl-banner">
              <span className={styles.hitlIcon}>🛡️</span>
              <div className={styles.hitlContent}>
                <h3 className={styles.hitlTitle}>
                  INTERVENCIÓN HUMANA OBLIGATORIA (Regla R5: Menor en Grupo)
                </h3>
                <p className={styles.hitlDescription}>
                  El agente autónomo tiene <strong>estrictamente bloqueado</strong> ejecutar reubicaciones
                  de forma unilateral. Debido a la presencia del menor Tomás Silva (7 años), se ha derivado
                  el caso al equipo de operaciones en aeropuerto (Caso <strong>HC-4471</strong>, SLA 45 min)
                  para garantizar que viajen juntos de manera prioritaria.
                </p>
              </div>
            </div>
          )}

          <div className={styles.conversationCard}>
            <h2 className={styles.sectionTitle}>💬 Diálogo con el Pasajero</h2>
            <div className={styles.chatMessages}>
              <div className={styles.userBubble}>
                <div className={styles.userHeader}>
                  <span>Pasajera (Reserva {submittedQuery.bookingId})</span>
                </div>
                <p className={styles.bubbleText}>{submittedQuery.message}</p>
              </div>

              <div className={styles.agentBubble}>
                <div className={styles.agentHeader}>
                  <span>🤖 FlyCompanion AI Agent (Empathetic &amp; Verified)</span>
                </div>
                <p className={styles.bubbleText} data-testid="agent-reply-text">
                  {agentResponse.passenger_reply}
                </p>
              </div>
            </div>
          </div>

          <div className={styles.trajectoryCard}>
            <h2 className={styles.sectionTitle}>🔍 Trazabilidad y Trayectoria Agéntica (Herramientas Invocadas)</h2>
            <p className={styles.infoBoxText}>
              El agente evaluó el caso invocando la siguiente secuencia verificable de herramientas deterministas:
            </p>
            <div className={styles.toolsTimeline}>
              {agentResponse.tools_invoked.map((tool, idx) => (
                <span key={`${tool}-${idx}`} className={styles.toolStep}>
                  <span className={styles.stepNum}>{idx + 1}</span>
                  <code>{tool}()</code>
                </span>
              ))}
            </div>
          </div>

          <div className={styles.gridTwo}>
            <div className={styles.infoBox}>
              <h4 className={styles.infoBoxTitle}>Diagnóstico Operativo (Hechos)</h4>
              <p className={styles.infoBoxText}>{agentResponse.what_happened}</p>
            </div>

            <div className={styles.infoBox}>
              <h4 className={styles.infoBoxTitle}>Próximo Paso Accionable</h4>
              <p className={styles.infoBoxText}>{agentResponse.next_step}</p>
            </div>
          </div>

          <div className={styles.gridTwo}>
            <div className={styles.infoBox}>
              <h4 className={styles.infoBoxTitle}>Derechos Concedidos (Entitlements)</h4>
              <div className={styles.tagsRow}>
                {agentResponse.entitlements.length > 0 ? (
                  agentResponse.entitlements.map((ent, idx) => (
                    <span key={idx} className={styles.entitlementTag}>
                      ✓ {ent}
                    </span>
                  ))
                ) : (
                  <span className={styles.infoBoxText}>Sin derechos automáticos aplicados.</span>
                )}
              </div>
              <div style={{ marginTop: '0.75rem' }}>
                <span className={styles.presetLabel}>Políticas de Respaldo: </span>
                {agentResponse.policy_refs.map((pol, idx) => (
                  <span key={idx} className={styles.policyTag}>
                    {pol}
                  </span>
                ))}
              </div>
            </div>

            <div className={styles.infoBox}>
              <h4 className={styles.infoBoxTitle}>Alternativas de Vuelo Elegibles</h4>
              <div className={styles.optionsList}>
                {agentResponse.options.map((opt) => (
                  <div key={opt.option_id} className={styles.optionCard}>
                    <div className={styles.optionHeader}>
                      <span>
                        {opt.type} - {opt.flight_number || 'N/A'} ({opt.origin} &rarr; {opt.destination})
                      </span>
                      <span>{opt.departure || ''}</span>
                    </div>
                    <div className={styles.optionDetails}>
                      Cupos: {opt.seats_available ?? 'N/D'} &bull; Dif. Tarifa:{' '}
                      {opt.fare_difference === 0 ? 'Sin Costo (Gratis)' : `${opt.fare_difference} ${opt.currency || ''}`} &bull;
                      Confianza: {opt.confidence}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
