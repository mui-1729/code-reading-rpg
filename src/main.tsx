import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppRouter } from './AppRouter'
import { AudioUnlock } from './audio/AudioUnlock'
import './styles.css'
import './opening.css'
import './layout-fixes.css'
import './reward.css'
import './dialogue.css'
import './motion.css'
import './audio.css'
import './world.css'
import './typescript-frontier.css'
import './world-objective.css'
import './code-help.css'
import './codex.css'
import './tutorial.css'
import './inspector.css'
import './economy.css'
import './inn.css'
import './items.css'
import './item-toast.css'
import './simplify.css'
import './pause.css'
import './world-atlas.css'
import './boss-guard.css'
import './pixel-art.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppRouter />
    <AudioUnlock />
  </StrictMode>,
)
