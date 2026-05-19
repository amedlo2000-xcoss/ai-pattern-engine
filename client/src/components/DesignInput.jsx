import { useState } from 'react'

const PRESET_COLORS = [
  '#e0e0e0', '#0a0a0a', '#1a2a5e', '#5e1a1a',
  '#1a3a2a', '#3a2a10', '#2a1a3a', '#3a3010'
]

const ITEMS = [
  { key: 'tshirt', label: 'Tシャツ' },
  { key: 'shirt',  label: 'Yシャツ' },
  { key: 'dress',  label: 'ワンピース' },
  { key: 'skirt',  label: 'スカート' },
  { key: 'pants',  label: 'ズボン' },
]

export default function DesignInput({ onGenerate, loading, onItemTypeChange }) {
  const [description, setDescription] = useState('')
  const [itemType, setItemType]       = useState('tshirt')
  const [size, setSize]               = useState('M')
  const [color, setColor]             = useState('#e0e0e0')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!description.trim()) return
    onGenerate({ userDescription: description, itemType, size, color })
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
