import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppRouter } from './AppRouter'
import './styles.css'
import './layout-fixes.css'
import './stage-select.css'
import './reward.css'
import './field.css'
import './dialogue.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppRouter />
  </StrictMode>,
)
