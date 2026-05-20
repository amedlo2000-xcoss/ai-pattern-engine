import { useState, useRef } from 'react'

const PRESET_COLORS = [
  '#e0e0e0', '#0a0a0a', '#1a2a5e', '#5e1a1a',
  '#1a3a2a', '#3a2a10', '#2a1a3a', '#3a3010'
]

const ITEMS = [
  { key: 'tshirt',  label: 'Tシャツ' },
  { key: 'shirt',   label: 'Yシャツ' },
  { key: 'dress',   label: 'ワンピース' },
  { key: 'skirt',   label: 'スカート' },
  { key: 'pants',   label: 'ズボン' },
  { key: 'jacket',  label: 'ジャケット' },
  { key: 'hoodie',  label: 'パーカー' },
  { key: 'shorts',  label: 'ショートパンツ' },
]

export default function DesignInput({ onGenerate, loading, onItemTypeChange }) {
  const [description, setDescription] = useState('')
  const [itemType, setItemType]       = useState('tshirt')
  const [size, setSize]               = useState('M')
  const [color, setColor]             = useState('#e0e0e0')
  const [imageBase64, setImageBase64] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [isDragOver, setIsDragOver]   = useState(false)
  const fileInputRef = useRef(null)

  const processFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const MAX = 1024
        let { width, height } = img
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round(height * MAX / width); width = MAX }
          else { width = Math.round(width * MAX / height); height = MAX }
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        canvas.getContext('2d').drawImage(img, 0, 0, width, height)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
        setImageBase64(dataUrl)
        setImagePreview(dataUrl)
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    processFile(e.dataTransfer.files[0])
  }

  const handleFileChange = (e) => processFile(e.target.files[0])

  const handleRemoveImage = (e) => {
    e.stopPropagation()
    setImageBase64(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!description.trim()) return
    onGenerate({ userDescription: description, itemType, size, color, imageBase64 })
  }

  return (
    <div className="glass-panel">
      <h2 className="panel-title">デザイン入力</h2>
      <form onSubmit={handleSubmit} className="design-form">

        {/* アイテム種別 */}
        <div className="field">
          <label>アイテム</label>
          <div className="item-buttons">
            {ITEMS.map(it => (
              <button
                key={it.key}
                type="button"
                className={`item-btn ${itemType === it.key ? 'active' : ''}`}
                onClick={() => { setItemType(it.key); onItemTypeChange?.(it.key) }}
              >
                {it.label}
              </button>
            ))}
          </div>
        </div>

        {/* テキスト説明 */}
        <div className="field">
          <label>デザイン説明</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="例：ミニマルな黒のTシャツ、胸元にジオメトリック柄、オーバーサイズフィット"
            rows={4}
            className="input-textarea"
          />
        </div>

        {/* 参照画像（任意） */}
        <div className="field">
          <label>参照画像（任意）</label>
          <div
            className={`upload-area${isDragOver ? ' drag-over' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
            onDragLeave={() => setIsDragOver(false)}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            {imagePreview ? (
              <div className="upload-preview" onClick={e => e.stopPropagation()}>
                <img src={imagePreview} alt="参照画像" />
                <button className="upload-remove" onClick={handleRemoveImage}>✕</button>
              </div>
            ) : (
              <>
                <div className="upload-icon">⊕</div>
                <div className="upload-hint">
                  クリックまたはドラッグ＆ドロップ<br />
                  <span style={{ opacity: 0.5 }}>JPG / PNG / WebP</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* サイズ */}
        <div className="field">
          <label>サイズ</label>
          <div className="size-buttons">
            {['S', 'M', 'L'].map(s => (
              <button
                key={s}
                type="button"
                className={`size-btn ${size === s ? 'active' : ''}`}
                onClick={() => setSize(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* カラー */}
        <div className="field">
          <label>ベースカラー</label>
          <div className="color-row">
            <div className="color-presets">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  className={`color-swatch ${color === c ? 'selected' : ''}`}
                  style={{ background: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
            <div className="color-custom">
              <input
                type="color"
                value={color}
                onChange={e => setColor(e.target.value)}
                className="color-picker"
              />
              <span className="color-hex">{color}</span>
            </div>
          </div>
        </div>

        <button type="submit" className="generate-btn"
                disabled={loading || !description.trim()}>
          {loading ? (
            <span className="loading-text"><span className="spinner" />解析中...</span>
          ) : 'パターン生成'}
        </button>
      </form>
    </div>
  )
}
