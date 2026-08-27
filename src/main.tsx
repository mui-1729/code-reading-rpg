import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppRouter } from './AppRouter'
import { AudioUnlock } from './audio/AudioUnlock'
import './styles.css'
import './layout-fixes.css'
import './reward.css'
import './field.css'
import './dialogue.css'
import './motion.css'
import './audio.css'
import './world.css'
import './world-objective.css'
import './code-help.css'
import './quests.css'
import './quest-markers.css'
import './codex.css'
import './tutorial.css'
import './inspector.css'
import './economy.css'
import './simplify.css'
import './pause.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppRouter />
    <AudioUnlock />
  </StrictMode>,
)
