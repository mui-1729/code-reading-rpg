import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppRouter } from './AppRouter'
import { AudioControls } from './audio/AudioControls'
import './styles.css'
import './layout-fixes.css'
import './stage-select.css'
import './reward.css'
import './field.css'
import './dialogue.css'
import './motion.css'
import './audio.css'
import './world.css'
import './code-help.css'
import './quests.css'
import './quest-markers.css'
import './codex.css'
import './tutorial.css'
import './inspector.css'
import './economy.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppRouter />
    <AudioControls />
  </StrictMode>,
)
