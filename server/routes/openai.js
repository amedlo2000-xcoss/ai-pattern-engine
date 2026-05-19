import { Router } from 'express'
import axios from 'axios'

const router = Router()

const MODEL_KEYS = [
  'black-tshirt', 'white-tshirt', 'oversized-tshirt',
  'hoodie', 'wide-silhouette',
  'shirt', 'dress', 'skirt', 'pants',
]

const ITEM_HINTS = {
  tshirt:  'Tシャツ（T-shirt）— crew neck, short sleeve, knit fabric',
  shirt:   'シャツ（dress shirt）— collar, button placket, long sleeve, woven fabric',
  dress:   'ワンピース（dress）— one-piece, bodice + skirt, various silhouettes',
  skirt:   'スカート（skirt）— waistband, A-line or straight, no bodice',
  pants:   'ズボン（trousers/pants）— waistband, two legs, various fits',
}

router.post('/transform', async (req, res) => {
  const { userDescription, itemType = 'tshirt', size, color } = req.body

  if (!userDescription || !size || !color) {
    return res.status(400).json({ error: 'userDescription, size, color are required' })
  }

  const itemHint = ITEM_HINTS[itemType] || ITEM_HINTS.tshirt

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/responses',
      {
        model: 'gpt-4o',
        input: [
          {
            role: 'system',
            content: `You are a fashion design assistant specializing in garment pattern design.
The user is designing: ${itemHint}

Given the description, you will:
1. Select the closest model key from: ${MODEL_KEYS.join(', ')}
   — match itemType to: tshirt→black/white/oversized-tshirt, shirt→shirt, dress→dress, skirt→skirt, pants→pants
2. Generate a concise Meshy AI 3D model prompt (max 80 words, visual appearance, garment shape, fabric)
3. Write a brief design summary in Japanese (2–3 sentences)
4. Extract pattern parameters

Respond ONLY in valid JSON (no markdown):
{
  "itemType": "${itemType}",
  "modelKey": "one of the model keys above",
  "meshyPrompt": "...",
  "summary": "...(日本語)...",
  "patternParams": {
    "ネックライン": "...",
    "袖丈": "...",
    "フィット": "...",
    "プリントエリア": "...",
    "プリント説明": "...",
    "メインカラー": "#hex",
    "サブカラー": "#hex"
  }
}`
          },
          {
            role: 'user',
            content: `アイテム: ${itemType} (${itemHint})\nサイズ: ${size}\nベースカラー: ${color}\n説明: ${userDescription}`
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    )

    const content = response.data.output?.[0]?.content?.[0]?.text || ''
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON in response')

    const parsed = JSON.parse(jsonMatch[0])
    if (!MODEL_KEYS.includes(parsed.modelKey)) parsed.modelKey = 'white-tshirt'

    res.json(parsed)
  } catch (err) {
    console.error('OpenAI error:', err.response?.data || err.message)
    res.status(500).json({ error: err.message })
  }
})

export default router
