import { BagProvider } from './store'
import Home from './Home'
import Kitchen from './components/Kitchen'

export default function App() {
  const path = window.location.pathname.replace(/\/+$/, '')
  if (path === '/kitchen') return <Kitchen />
  return <BagProvider><Home /></BagProvider>
}
