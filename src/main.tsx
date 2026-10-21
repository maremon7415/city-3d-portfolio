import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/bricolage-grotesque'
import '@fontsource-variable/inter'
import '@fontsource-variable/jetbrains-mono'
import 'lenis/dist/lenis.css'
import './styles/global.css'
import { App } from './App'
import { loader } from './ui/loader'
import { useStore } from './state/store'
import { detectQuality } from './systems/quality'

loader.set(0.35, 'Unpacking the city')
useStore.getState().setQuality(detectQuality())
document.fonts?.ready.then(() => loader.set(0.5, 'Setting the type'))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
