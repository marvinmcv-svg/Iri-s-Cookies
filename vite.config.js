import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Serves the /api/chat serverless function locally (dev + preview), same code as on Vercel.
function iriApi() {
  const mount = (server) => {
    server.middlewares.use('/api/chat', async (req, res) => {
      const { default: handler } = await import('./api/chat.js')
      handler(req, res)
    })
  }
  return { name: 'iri-api', configureServer: mount, configurePreviewServer: mount }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  for (const k of ['NVIDIA_API_KEY', 'IRI_MODEL']) if (env[k] && !process.env[k]) process.env[k] = env[k]
  return { plugins: [react(), iriApi()] }
})
