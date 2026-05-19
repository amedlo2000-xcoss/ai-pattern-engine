import { Router } from 'express'
import axios from 'axios'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const MODELS_DIR = path.resolve(__dirname, '../../client/public/models')
const CACHE_MAP = path.join(MODELS_DIR, 'cache-map.json')

const router = Router()

router.post('/update', async (req, res) => {
  const { modelKey, glbUrl } = req.body
  if (!modelKey || !glbUrl) {
    return res.status(400).json({ error: 'modelKey and glbUrl required' })
  }

  try {
    await fs.mkdir(MODELS_DIR, { recursive: true })

    const glbRes = await axios.get(glbUrl, { responseType: 'arraybuffer', timeout: 30000 })
    const glbFile = path.join(MODELS_DIR, `${modelKey}.glb`)
    await fs.writeFile(glbFile, Buffer.from(glbRes.data))

    let map = {}
    try {
      map = JSON.parse(await fs.readFile(CACHE_MAP, 'utf-8'))
    } catch {}
    delete map._note
    map[modelKey] = `/models/${modelKey}.glb`

    await fs.writeFile(CACHE_MAP, JSON.stringify(map, null, 2))

    console.log(`Cache updated: ${modelKey} → ${glbFile}`)
    res.json({ success: true, path: `/models/${modelKey}.glb` })
  } catch (err) {
    console.error('Cache update error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

router.get('/map', async (req, res) => {
  try {
    const map = JSON.parse(await fs.readFile(CACHE_MAP, 'utf-8'))
    res.json(map)
  } catch {
    res.json({})
  }
})

export default router
