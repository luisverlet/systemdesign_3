import React, { createContext, useContext, useState, ReactNode } from 'react'

export type DataSourceMode = 'mock' | 'live'

interface DataSourceContextValue {
  mode: DataSourceMode
  setMode: (mode: DataSourceMode) => void
}

const DataSourceContext = createContext<DataSourceContextValue | undefined>(undefined)

const STORAGE_KEY = 'flycompanion_data_source_mode'

export const DataSourceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<DataSourceMode>(() => {
    try {
      if (typeof window !== 'undefined' && typeof window.localStorage?.getItem === 'function') {
        const saved = window.localStorage.getItem(STORAGE_KEY)
        if (saved === 'mock' || saved === 'live') {
          return saved
        }
      }
    } catch {
      // Fallback if localStorage access is denied
    }
    return import.meta.env.VITE_USE_MOCKS === 'false' ? 'live' : 'mock'
  })

  const setMode = (nextMode: DataSourceMode) => {
    setModeState(nextMode)
    try {
      if (typeof window !== 'undefined' && typeof window.localStorage?.setItem === 'function') {
        window.localStorage.setItem(STORAGE_KEY, nextMode)
      }
    } catch {
      // Ignore localStorage write failures
    }
  }

  return (
    <DataSourceContext.Provider value={{ mode, setMode }}>
      {children}
    </DataSourceContext.Provider>
  )
}

export const useDataSource = (): DataSourceContextValue => {
  const context = useContext(DataSourceContext)
  if (!context) {
    throw new Error('useDataSource must be used within a DataSourceProvider')
  }
  return context
}
