import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './pages/WorkspacePages.css'
import App from './App.jsx'
import { initializeTheme } from './theme.js'

initializeTheme()
window.matchMedia?.("(prefers-color-scheme: dark)").addEventListener("change", (event) => {
  if (localStorage.getItem("flowbi-theme") === "system") document.documentElement.dataset.theme = event.matches ? "dark" : "light";
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
