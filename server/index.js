import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import openaiRouter from './routes/openai.js'
import meshyRouter from './routes/meshy.js'
import cacheRouter from './routes/cache.js'

dotenv.config({ path: '../.env' })

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json({ limit: '20mb' }))
app.use(express.urlencoded({ limit: '20mb', extended: true }))

app.use('/api/openai', openaiRouter)
app.use('/api/meshy', meshyRouter)
app.use('/api/cache', cacheRouter)

app.get('/health', (req, res) => res.json({ status: 'ok' }))

// Vercel: export app as serverless handler
// Local: start HTTP server
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
  })
}

export default app
