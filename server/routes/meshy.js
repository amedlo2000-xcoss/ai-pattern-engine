import { Router } from 'express'
import axios from 'axios'

const router = Router()

const MESHY_BASE = 'https://api.meshy.ai/openapi/v2'
const POLL_INTERVAL = 3000
const MAX_POLLS = 60

async function pollTask(taskId, apiKey) {
  for (let i = 0; i < MAX_POLLS; i++) {
    await new Promise(r => setTimeout(r, POLL_INTERVAL))
    const res = await axios.get(`${MESHY_BASE}/3d-models/${taskId}`, {
      headers: { Authorization: `Bearer ${apiKey}` }
    })
    const task = res.data
    if (task.status === 'SUCCEEDED') return task
    if (task.status === 'FAILED') throw new Error(`Task failed: ${task.task_error?.message || 'unknown'}`)
  }
  throw new Error('Polling timeout')
}

router.post('/generate', async (req, res) => {
  const { prompt, artStyle } = req.body
  const apiKey = process.env.MESHY_API_KEY

  if (!apiKey) return res.status(500).json({ error: 'MESHY_API_KEY not configured' })
  if (!prompt) return res.status(400).json({ error: 'prompt is required' })

  try {
    // Step 1: Create preview task
    const previewRes = await axios.post(
      `${MESHY_BASE}/text-to-3d`,
      {
        mode: 'preview',
        prompt,
        art_style: artStyle || 'realistic',
        negative_prompt: 'low quality, blurry'
      },
      { headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' } }
    )
    const previewId = previewRes.data.result

    // Step 2: Poll preview
    const previewTask = await pollTask(previewId, apiKey)

    // Step 3: Refine
    const refineRes = await axios.post(
      `${MESHY_BASE}/text-to-3d`,
      { mode: 'refine', preview_task_id: previewId },
      { headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' } }
    )
    const refineId = refineRes.data.result

    // Step 4: Poll refine
    const refineTask = await pollTask(refineId, apiKey)

    const glbUrl = refineTask.model_urls?.glb || previewTask.model_urls?.glb
    res.json({
      taskId: refineId,
      glbUrl,
      thumbnailUrl: refineTask.thumbnail_url
    })
  } catch (err) {
    console.error('Meshy error:', err.response?.data || err.message)
    res.status(500).json({ error: err.message })
  }
})

export default router
