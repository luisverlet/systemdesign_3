import React, { useState, useEffect } from 'react'
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
  const [apiKey, setApiKey] = useState('')
  const [showKeyConfig, setShowKeyConfig] = useState(false)
  const [submittedQuery, setSubmittedQuery] = useState<{ bookingId: string; message: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [agentResponse, setAgentResponse] = useState<AgentResponse | null>(null)

  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_user_api_key')
    if (savedKey) {
      setApiKey(savedKey)
    }
  }, [])

  const handleApiKeyChange = (val: string) => {
    setApiKey(val)
    if (val.trim()) {
      localStorage.setItem('gemini_user_api_key', val.trim())
    } else {
      localStorage.removeItem('gemini_user_api_key')
    }
  }

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
          api_key: apiKey.trim() || undefined,
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

  const isLive = agentResponse?.execution_mode === 'GEMINI_LIVE_LLM'

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
          <button
            type="button"
            className={styles.keyToggleBtn}
            onClick={() => setShowKeyConfig(!showKeyConfig)}
          >
            ⚙️ {apiKey.trim() ? 'API Key Configurada (Gemini Live)' : 'Configurar Gemini API Key (Opcional)'}
          </button>
          <button type="button" className={styles.clearBtn} onClick={handleClear}>
            Limpiar
          </button>
        </div>

        {showKeyConfig && (
          <div className={styles.apiKeySection}>
            <label htmlFor="apiKeyInput" className={styles.apiKeyLabel}>
              🔑 Google Gemini API Key (Opcional para evaluación en vivo):
            </label>
            <input
              id="apiKeyInput"
              type="password"
              className={styles.apiKeyInput}
              value={apiKey}
              onChange={(e) => handleApiKeyChange(e.target.value)}
              placeholder="Pega aquí tu clave AIzaSy... de Google AI Studio (si la dejas vacía, se usa simulación local)"
              disabled={loading}
            />
            <p className={styles.apiKeyHint}>
              * No requerida: Si la dejas vacía, el agente funciona de inmediato en <strong>Modo Simulado Autónomo</strong> con respuesta determinista verificada sin costo.
            </p>
          </div>
        )}

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
          {/* Execution Mode Banner (Live vs Simulated) */}
          <div className={isLive ? styles.modeBannerLive : styles.modeBannerSimulated}>
            <span className={styles.modeIcon}>{isLive ? '🟢' : '🟡'}</span>
            <div>
              <strong>Modo de Ejecución: </strong>
              {isLive ? (
                <span>
                  <strong>Google Gemini Live LLM</strong> ({agentResponse.model_used || 'gemini-1.5-flash'}) &bull; Inferencia real con Function Calling
                </span>
              ) : (
                <span>
                  <strong>Simulación Determinista Autónoma</strong> &bull; Ejecución local verificada (Sin costo ni consumo de cuota)
                </span>
              )}
            </div>
          </div>

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
                  <span>🤖 FlyCompanion AI Agent ({isLive ? 'Gemini 1.5 Flash' : 'Simulación Determinista'})</span>
                </div>
                <p className={styles.bubbleText} data-testid="agent-reply-text">
                  {agentResponse.passenger_reply}
                </p>
              </div>
            </div>
          </div>

          <div className={styles.summaryCard}>
            <h2 className={styles.sectionTitle}>📋 Diagnóstico Operacional y Políticas</h2>
            <div className={styles.gridDetails}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>¿Qué ocurrió en el viaje?</span>
                <p className={styles.detailValue}>{agentResponse.what_happened}</p>
              </div>

              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Beneficios Otorgados por Política</span>
                <div className={styles.tagList}>
                  {agentResponse.entitlements.map((ent, idx) => (
                    <span key={idx} className={styles.entitlementTag}>
                      ✓ {ent}
                    </span>
                  ))}
                  {agentResponse.entitlements.length === 0 && (
                    <span className={styles.neutralTag}>Ninguno aplicable</span>
                  )}
                </div>
              </div>

              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Políticas Versionadas Verificadas</span>
                <div className={styles.tagList}>
                  {agentResponse.policy_refs.map((pref, idx) => (
                    <span key={idx} className={styles.policyTag}>
                      📜 {pref}
                    </span>
                  ))}
                </div>
              </div>

              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Siguiente Paso Operativo</span>
                <p className={styles.detailValue}>{agentResponse.next_step}</p>
              </div>
            </div>
          </div>

          <div className={styles.optionsCard}>
            <h2 className={styles.sectionTitle}>✈️ Alternativas Identificadas por el Agente</h2>
            <p className={styles.optionsSubtitle}>
              Opciones elegibles según política para presentar al agente humano supervisor:
            </p>
            <div className={styles.optionsGrid}>
              {agentResponse.options.map((opt) => (
                <div key={opt.option_id} className={styles.optionItem}>
                  <div className={styles.optionHeader}>
                    <span className={styles.optionType}>{opt.type}</span>
                    <span className={styles.optionConfidence}>Confianza: {opt.confidence}</span>
                  </div>
                  <div className={styles.optionBody}>
                    {opt.flight_number && (
                      <div className={styles.flightInfo}>
                        <strong>Vuelo {opt.flight_number}</strong> ({opt.origin} → {opt.destination})
                      </div>
                    )}
                    {opt.date && opt.departure && (
                      <div className={styles.timeInfo}>
                        Salida: {opt.date} a las {opt.departure}
                      </div>
                    )}
                    <div className={styles.fareInfo}>
                      Diferencia tarifaria: {opt.fare_difference === 0 ? 'Sin Costo ($0)' : `${opt.fare_difference} ${opt.currency || ''}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.trajectoryCard}>
            <h2 className={styles.sectionTitle}>🔍 Observabilidad: Secuencia de Herramientas Invocadas</h2>
            <p className={styles.trajectorySubtitle}>
              Trayectoria determinista y reproducible auditada en el archivo de telemetría:
            </p>
            <div className={styles.trajectorySteps}>
              {agentResponse.tools_invoked.map((tool, idx) => (
                <div key={idx} className={styles.stepBadge}>
                  <span className={styles.stepNumber}>{idx + 1}</span>
                  <span className={styles.stepName}>{tool}()</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
