import { useState, useCallback } from 'react'
import axios from 'axios'
import DesignInput from './components/DesignInput'
import ModelViewer from './components/ModelViewer'
import PatternSVG from './components/PatternSVG'
import PDFExport from './components/PDFExport'
import StepProgress from './components/StepProgress'
import './App.css'

const API = import.meta.env.VITE_API_BASE ?? 'http://localhost:3001'

const ITEM_LABELS = {
  tshirt: 'Tシャツ', shirt: 'Yシャツ', dress: 'ワンピース',
  skirt: 'スカート', pants: 'ズボン',
  jacket: 'ジャケット', hoodie: 'パーカー',
  shorts: 'ショートパンツ',
}

export default function App() {
  const [aiLoading, setAiLoading]             = useState(false)
  const [meshyLoading, setMeshyLoading]       = useState(false)
  const [result, setResult]                   = useState(null)
  const [error, setError]                     = useState(null)
  const [color, setColor]                     = useState('#e0e0e0')
  const [size, setSize]                       = useState('M')
  const [itemType, setItemType]               = useState('tshirt')
  const [patternGlowing, setPatternGlowing]   = useState(false)
  const [clothingVisible, setClothingVisible] = useState(true)

  // 1=アイテム選択(always done) 2=デザイン入力 3=AI解析中 4=型紙完成
  const currentStep = aiLoading ? 3 : result ? 4 : 2

  async function handleGenerate({ userDescription, itemType: it, size: sz, color: col, imageBase64 }) {
    setAiLoading(true)
    setError(null)
    setResult(null)
    setColor(col)
    setSize(sz)
    setItemType(it)
    setPatternGlowing(true)
    setClothingVisible(false)
    setTimeout(() => {
      setPatternGlowing(false)
      setClothingVisible(true)
    }, 500)

    try {
      const { data } = await axios.post(`${API}/api/openai/transform`, {
        userDescription, itemType: it, size: sz, color: col, imageBase64
      })
      setResult(data)
      // 画像解析でアイテム種別が変わった場合にビューアを更新
      if (data.itemType && ITEM_LABELS[data.itemType]) setItemType(data.itemType)
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    } finally {
      setAiLoading(false)
    }
  }

  const handleRequestGenerate = useCallback(async () => {
    if (!result?.meshyPrompt || !result?.modelKey) return
    setMeshyLoading(true)
    try {
      const meshyRes = await axios.post(`${API}/api/meshy/generate`, {
        prompt: result.meshyPrompt, artStyle: 'realistic'
      })
      if (meshyRes.data.glbUrl) {
        await axios.post(`${API}/api/cache/update`, {
          modelKey: result.modelKey, glbUrl: meshyRes.data.glbUrl
        })
        setResult(prev => ({ ...prev, _ts: Date.now() }))
      }
    } catch (err) {
      setError(`3D生成失敗: ${err.response?.data?.error || err.message}`)
    } finally {
      setMeshyLoading(false)
    }
  }, [result])

  const itemLabel = ITEM_LABELS[itemType] || itemType

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <div className="logo">
            <div className="logo-mark">◈</div>
            <span className="logo-text">AI Pattern Engine</span>
            <span className="logo-badge">MVP</span>
          </div>
          <p className="header-sub">デザイン説明 → AI解析 → 縫製型紙 + 3Dプレビュー</p>
        </div>
        <div className="header-glow" />
      </header>

      <main className="main-split">
        {/* ── 左画面：型紙エリア ── */}
        <div className="split-left">
          <StepProgress currentStep={currentStep} />

          <DesignInput
            onGenerate={handleGenerate}
            loading={aiLoading}
            onItemTypeChange={it => { setItemType(it); setClothingVisible(true) }}
          />

          {error && (
            <div className="error-panel glass-panel">
              <span className="error-icon">▲</span>
              <p>{error}</p>
            </div>
          )}

          {result && (
            <div className="glass-panel summary-panel">
              <h2 className="panel-title">デザインサマリー — {itemLabel}</h2>
              <p className="summary-text">{result.summary}</p>
              {result.patternParams && (
                <div className="params-grid">
                  {Object.entries(result.patternParams).map(([k, v]) => (
                    <div key={k} className="param-item">
                      <span className="param-key">{k}</span>
                      <span className="param-val">{String(v)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 型紙SVG + PDF出力ボタン */}
          <PatternSVG
            itemType={itemType}
            size={size}
            glowing={patternGlowing}
          />

          {result && (
            <div className="pdf-area">
              <PDFExport
                size={size}
                itemType={itemType}
                patternParams={result.patternParams}
                color={color}
                summary={result.summary}
              />
            </div>
          )}
        </div>

        {/* ── 右画面：3Dプレビューエリア ── */}
        <div className="split-right">
          <ModelViewer
            modelKey={result?.modelKey}
            itemType={itemType}
            color={color}
            clothingVisible={clothingVisible}
            onRequestGenerate={handleRequestGenerate}
            meshyLoading={meshyLoading}
          />
        </div>
      </main>

      <footer className="app-footer">
        <span>AI Pattern Engine — MVP</span>
        <span>型紙は参考データです。裁断前に必ず寸法を確認してください。</span>
      </footer>
    </div>
  )
}
