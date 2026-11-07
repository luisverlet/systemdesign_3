import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { DataSourceProvider } from './context/DataSourceContext'
import { App } from './App'
import './styles/theme.css'

const rootElement = document.getElementById('root')

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <BrowserRouter>
        <DataSourceProvider>
          <App />
        </DataSourceProvider>
      </BrowserRouter>
    </React.StrictMode>
  )
}
