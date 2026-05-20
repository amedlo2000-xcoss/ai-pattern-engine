import { Router } from 'express'
import axios from 'axios'

const router = Router()

const MODEL_KEYS = [
  'black-tshirt', 'white-tshirt', 'oversized-tshirt',
  'wide-silhouette',
  'shirt', 'dress', 'skirt', 'pants',
  'jacket', 'hoodie', 'shorts',
]

const ITEM_TYPES = [
  'tshirt', 'shirt', 'dress', 'skirt', 'pants',
  'jacket', 'hoodie', 'shorts',
]

const ITEM_HINTS = {
  tshirt:  'Tシャツ（T-shirt）— crew neck, short sleeve, knit fabric',
  shirt:   'シャツ（dress shirt）— collar, button placket, long sleeve, woven fabric',
  dress:   'ワンピース（dress）— one-piece, bodice + skirt, various silhouettes',
  skirt:   'スカート（skirt）— waistband, A-line or straight, no bodice',
  pants:   'ズボン（trousers/pants）— waistband, two legs, various fits',
  jacket:  'ジャケット（jacket）— structured, lapels, long sleeves, tailored',
  hoodie:  'パーカー（hoodie/sweatshirt）— hood or crew, casual, fleece/knit, long sleeves',
  shorts:  'ショートパンツ（shorts）— waistband, short legs, casual or formal',
}

const MODEL_KEY_DEFAULTS = {
  tshirt: 'white-tshirt', shirt: 'shirt', dress: 'dress',
  skirt: 'skirt', pants: 'pants', jacket: 'jacket',
  hoodie: 'hoodie', shorts: 'shorts',
}

router.post('/transform', async (req, res) => {
  const { userDescription, itemType = 'tshirt', size, color, imageBase64 } = req.body

  if (!userDescription || !size || !color) {
    return res.status(400).json({ error: 'userDescription, size, color are required' })
  }

  const itemHint = ITEM_HINTS[itemType] || ITEM_HINTS.tshirt

  const systemPrompt = imageBase64
    ? `You are a fashion design assistant specializing in garment pattern design.

IMPORTANT: A reference image has been provided. You MUST carefully observe the actual garment(s) in the image and base your entire response on what is visually present. The user's selected item type is only a fallback hint.

From the image, identify and extract:
- Actual item type — choose from: ${ITEM_TYPES.join(', ')}
- Silhouette and fit (tailored, oversized, slim, A-line, etc.)
- Neckline / collar style
- Sleeve length and style
- Fabric texture and pattern (tweed, denim, knit, woven, etc.)
- Colors and color combinations
- Notable design details (pockets, buttons, lapels, seams, etc.)

Then:
1. Set itemType to the closest match from: ${ITEM_TYPES.join(', ')}
2. Select modelKey from: ${MODEL_KEYS.join(', ')}
   — tshirt→black/white/oversized-tshirt, shirt→shirt, dress→dress, skirt→skirt, pants→pants, jacket→jacket, hoodie→hoodie, shorts→shorts
3. Generate a concise Meshy AI 3D model prompt (max 80 words)
4. Write a design summary in Japanese (2–3 sentences) describing what you SEE in the image
5. Extract pattern parameters based on what is actually in the image

Respond ONLY in valid JSON (no markdown):
{
  "itemType": "one of: ${ITEM_TYPES.join(', ')}",
  "modelKey": "one of the model keys above",
  "meshyPrompt": "...",
  "summary": "...(日本語・画像の内容を正確に記述)...",
  "patternParams": {
    "ネックライン": "...",
    "袖丈": "...",
    "フィット": "...",
    "素材": "...",
    "デザインディテール": "...",
    "メインカラー": "#hex",
    "サブカラー": "#hex"
  }
}`
    : `You are a fashion design assistant specializing in garment pattern design.
The user is designing: ${itemHint}

Given the description, you will:
1. Set itemType — choose from: ${ITEM_TYPES.join(', ')}
2. Select modelKey from: ${MODEL_KEYS.join(', ')}
   — tshirt→black/white/oversized-tshirt, shirt→shirt, dress→dress, skirt→skirt, pants→pants, jacket→jacket, hoodie→hoodie, shorts→shorts
3. Generate a concise Meshy AI 3D model prompt (max 80 words, visual appearance, garment shape, fabric)
4. Write a brief design summary in Japanese (2–3 sentences)
5. Extract pattern parameters

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

  const userText = `アイテム参考: ${itemType} (${itemHint})\nサイズ: ${size}\nベースカラー: ${color}\n説明: ${userDescription}`

  // Build messages for Chat Completions API
  const userContent = imageBase64
    ? [
        { type: 'text', text: userText },
        { type: 'image_url', image_url: { url: imageBase64 } }
      ]
    : userText

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user',   content: userContent }
  ]

  console.log('[openai] image attached:', !!imageBase64, '| content types:', Array.isArray(userContent) ? userContent.map(c => c.type) : 'text')

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      { model: 'gpt-4o', messages },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    )

    const content = response.data.choices?.[0]?.message?.content || ''
    console.log('[openai] raw response (first 300):', content.slice(0, 300))

    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON in response')

    const parsed = JSON.parse(jsonMatch[0])
    if (!MODEL_KEYS.includes(parsed.modelKey)) {
      parsed.modelKey = MODEL_KEY_DEFAULTS[parsed.itemType] || 'white-tshirt'
    }
    if (!ITEM_TYPES.includes(parsed.itemType)) parsed.itemType = itemType

    res.json(parsed)
  } catch (err) {
    console.error('OpenAI error:', err.response?.data || err.message)
    res.status(500).json({ error: err.message })
  }
})

export default router
