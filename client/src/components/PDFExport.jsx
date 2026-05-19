import { useState } from 'react'
import { jsPDF } from 'jspdf'
import { getDimensions } from '../lib/patternEngine'

// ── フォント読み込み（/fonts/NotoSansJP-Regular.ttf を使用）────────────────
let _fontBase64 = null

async function arrayBufferToBase64(buf) {
  const bytes = new Uint8Array(buf)
  const chunks = []
  for (let i = 0; i < bytes.length; i += 65536) {
    chunks.push(String.fromCharCode(...bytes.subarray(i, i + 65536)))
  }
  return btoa(chunks.join(''))
}

async function loadFont(doc) {
  if (!_fontBase64) {
    try {
      const resp = await fetch('/fonts/NotoSansJP-Regular.ttf')
      if (!resp.ok) throw new Error(`${resp.status}`)
      _fontBase64 = await arrayBufferToBase64(await resp.arrayBuffer())
    } catch (e) {
      console.warn('日本語フォント読み込み失敗 → courier にフォールバック:', e.message)
      return 'courier'
    }
  }
  doc.addFileToVFS('NotoSansJP-Regular.ttf', _fontBase64)
  doc.addFont('NotoSansJP-Regular.ttf', 'NotoSansJP', 'normal')
  return 'NotoSansJP'
}

// ── 描画ヘルパー ─────────────────────────────────────────────────────────────
const sz = (doc, n) => doc.setFontSize(n)
const col = (doc, r, g, b) => doc.setTextColor(r, g, b)

function hRule(doc, y, margin = 15) {
  doc.setDrawColor(60, 60, 60)
  doc.setLineWidth(0.2)
  doc.line(margin, y, 210 - margin, y)
}

function sectionTitle(doc, font, text, y, margin = 15) {
  doc.setFont(font, 'normal')
  sz(doc, 8.5)
  col(doc, 130, 130, 130)
  doc.text(text, margin, y)
  col(doc, 210, 210, 210)
}

// ── 1ページ目：型紙 ──────────────────────────────────────────────────────────
function drawPatternPage(doc, font, size, color) {
  const d = getDimensions(size)
  const margin = 15
  const pageW = 210
  const pageH = 297

  doc.setFont(font, 'normal')

  // 背景・グリッド
  doc.setFillColor(10, 10, 10)
  doc.rect(0, 0, pageW, pageH, 'F')
  doc.setDrawColor(26, 26, 26)
  doc.setLineWidth(0.15)
  for (let x = 0; x <= pageW; x += 10) doc.line(x, 0, x, pageH)
  for (let y = 0; y <= pageH; y += 10) doc.line(0, y, pageW, y)
  doc.setDrawColor(35, 35, 35)
  doc.setLineWidth(0.3)
  for (let x = 0; x <= pageW; x += 40) doc.line(x, 0, x, pageH)
  for (let y = 0; y <= pageH; y += 40) doc.line(0, y, pageW, y)

  // ヘッダー
  sz(doc, 11)
  col(doc, 0, 168, 255)
  doc.text('AI PATTERN ENGINE', margin, 14)
  sz(doc, 8)
  col(doc, 120, 120, 120)
  doc.text(`Tシャツ サイズ${size}  ·  胸囲: ${d.chest}mm  ·  着丈: ${d.length}mm  ·  肩幅: ${d.shoulder}mm`, margin, 20)
  doc.text(`袖丈: ${d.sleeve}mm  ·  首回り: ${d.neck}mm  ·  縫い代: 10mm`, margin, 26)

  doc.setDrawColor(0, 80, 140)
  doc.setLineWidth(0.3)
  doc.line(margin, 29, pageW - margin, 29)

  // 注意書き
  col(doc, 180, 100, 0)
  sz(doc, 7)
  doc.text('！ 100%実寸で印刷してください — ページに合わせて拡大縮小しないこと。下記50mm基準線で確認してください。', margin, 34)

  // 50mm基準線
  doc.setDrawColor(0, 168, 255)
  doc.setLineWidth(0.4)
  doc.rect(pageW - margin - 50, 29, 50, 6)
  col(doc, 0, 168, 255)
  sz(doc, 6.5)
  doc.text('← 50mm基準線 →', pageW - margin - 50, 37.5)

  // ── スケール計算 ─────────────────────────────────────────────────────────
  const scale = (pageW - margin * 2) / (d.chest * 0.55)
  const S = v => v * scale
  const sa = S(10)

  const halfChest = S(d.chest / 2)
  const bodyH     = S(d.length * 0.55)
  const shoulderX = S((d.chest - d.shoulder) / 2)
  const sleeveLen = S(d.sleeve * 0.55)
  const sleeveTop = S(d.sleeveWidth)
  const cuff      = S(d.cuff)

  const cBlue = [0, 120, 200]
  const cSeam = [0, 80, 140]
  const cDim  = [100, 100, 100]

  function seamLine(x1, y1, x2, y2) {
    doc.setDrawColor(...cSeam)
    doc.setLineWidth(0.2)
    doc.setLineDashPattern([0.8, 1.6], 0)
    doc.line(x1, y1, x2, y2)
    doc.setLineDashPattern([], 0)
  }

  function dimLabel(text, x, y) {
    col(doc, ...cDim)
    sz(doc, 6.5)
    doc.text(text, x, y)
  }

  function panelLabel(text, x, y) {
    col(doc, 0, 168, 255)
    sz(doc, 7.5)
    doc.text(text, x, y)
  }

  // ── 前身頃 ────────────────────────────────────────────────────────────────
  const fx = margin
  const fy = 42
  panelLabel('前身頃（わで1枚裁断）', fx, fy - 2)

  doc.setFillColor(10, 25, 40)
  doc.rect(fx, fy, halfChest, bodyH, 'F')
  doc.setDrawColor(...cBlue)
  doc.setLineWidth(0.4)
  doc.rect(fx, fy, halfChest, bodyH)
  seamLine(fx + sa, fy + sa, fx + halfChest - sa, fy + sa)
  seamLine(fx + sa, fy + bodyH - sa, fx + halfChest - sa, fy + bodyH - sa)
  seamLine(fx + sa, fy + sa, fx + sa, fy + bodyH - sa)
  seamLine(fx + halfChest - sa, fy + sa, fx + halfChest - sa, fy + bodyH - sa)

  doc.setDrawColor(60, 60, 60)
  doc.setLineWidth(0.3)
  doc.line(fx + halfChest / 2, fy + bodyH * 0.25, fx + halfChest / 2, fy + bodyH * 0.75)
  dimLabel('布目線', fx + halfChest / 2 + 1.5, fy + bodyH * 0.5)
  dimLabel(`着丈 ${d.length}mm`, fx + halfChest + 2, fy + bodyH / 2)
  dimLabel(`½胸囲 ${d.chest / 2}mm`, fx + halfChest / 2 - 8, fy + bodyH + 5)

  // ── 後身頃 ────────────────────────────────────────────────────────────────
  const bx = fx + halfChest + 12
  const by = fy
  panelLabel('後身頃（わで1枚裁断）', bx, by - 2)

  doc.setFillColor(10, 22, 35)
  doc.rect(bx, by, halfChest, bodyH, 'F')
  doc.setDrawColor(...cBlue)
  doc.rect(bx, by, halfChest, bodyH)
  seamLine(bx + sa, by + sa, bx + halfChest - sa, by + sa)
  seamLine(bx + sa, by + bodyH - sa, bx + halfChest - sa, by + bodyH - sa)
  seamLine(bx + sa, by + sa, bx + sa, by + bodyH - sa)
  seamLine(bx + halfChest - sa, by + sa, bx + halfChest - sa, by + bodyH - sa)

  doc.setDrawColor(60, 60, 60)
  doc.line(bx + halfChest / 2, by + bodyH * 0.25, bx + halfChest / 2, by + bodyH * 0.75)
  dimLabel('布目線', bx + halfChest / 2 + 1.5, by + bodyH * 0.5)

  // ── 袖 ───────────────────────────────────────────────────────────────────
  const sx = margin
  const sy = fy + bodyH + 16
  panelLabel('袖（2枚裁断・左右反転）', sx, sy - 2)

  const sl = (sleeveTop - cuff) / 2
  doc.setFillColor(10, 20, 32)
  doc.setDrawColor(...cBlue)
  doc.setLineWidth(0.4)
  doc.lines(
    [[sleeveTop, 0], [cuff / 2 - sleeveTop + sl, sleeveLen], [-cuff, 0], [sl - cuff / 2, -sleeveLen]],
    sx, sy, [1, 1], 'FD'
  )
  doc.setDrawColor(60, 60, 60)
  doc.line(sx + sleeveTop / 2, sy + sleeveLen * 0.2, sx + sleeveTop / 2, sy + sleeveLen * 0.75)
  dimLabel('布目線', sx + sleeveTop / 2 + 1.5, sy + sleeveLen * 0.5)
  dimLabel(`袖丈 ${d.sleeve}mm`, sx + sleeveTop + 2, sy + sleeveLen / 2)
  dimLabel(`袖山幅 ${d.sleeveWidth}mm`, sx + sleeveTop / 2 - 10, sy + sleeveLen + 5)
  dimLabel(`カフ幅 ${d.cuff}mm`, sx + sleeveTop / 2 + sl - 8, sy + sleeveLen + 10)

  // ── フッター ──────────────────────────────────────────────────────────────
  col(doc, 60, 60, 60)
  sz(doc, 6.5)
  const fy2 = pageH - 8
  doc.text(
    'AI Pattern Engine  ·  単位mm  ·  縫い代10mm含む  ·  この型紙はMVP用の簡易生成データです。実製造前に専門パタンナーによる確認を推奨します。',
    margin, fy2
  )
  doc.text(`1 / 2ページ  ·  サイズ ${size}`, pageW - margin, fy2, { align: 'right' })
}

// ── 2ページ目：サマリー + 寸法表 ─────────────────────────────────────────────
function drawSummaryPage(doc, font, size, summary, patternParams, color) {
  const margin = 15
  const pageW = 210

  doc.setFont(font, 'normal')
  doc.setFillColor(10, 10, 10)
  doc.rect(0, 0, pageW, 297, 'F')

  sz(doc, 11)
  col(doc, 0, 168, 255)
  doc.text('デザインサマリー', margin, 16)
  hRule(doc, 20)

  if (summary) {
    sz(doc, 9)
    col(doc, 200, 200, 200)
    const lines = doc.splitTextToSize(summary, pageW - margin * 2)
    doc.text(lines, margin, 28)
  }

  let y = summary
    ? 28 + 6 * Math.min(doc.splitTextToSize(summary, pageW - margin * 2).length, 6) + 8
    : 30

  // パターンパラメータ
  if (patternParams) {
    sectionTitle(doc, font, 'パターンパラメータ', y)
    y += 7
    const entries = Object.entries(patternParams)
    const colW = (pageW - margin * 2) / 2
    entries.forEach(([k, v], i) => {
      const col2 = i % 2
      const row = Math.floor(i / 2)
      const cx = margin + col2 * colW
      const cy = y + row * 9
      doc.setFillColor(18, 18, 18)
      doc.roundedRect(cx, cy - 5, colW - 4, 8, 1, 1, 'F')
      col(doc, 90, 90, 90)
      sz(doc, 7)
      doc.text(k.toUpperCase(), cx + 3, cy)
      sz(doc, 8)
      col(doc, 200, 200, 200)
      doc.text(String(v), cx + 3, cy + 5)
    })
    y += Math.ceil(entries.length / 2) * 9 + 12
  }

  // 寸法表
  sectionTitle(doc, font, '寸法表（mm）', y)
  y += 7

  const cols = ['部位', 'S', 'M', 'L']
  const rows = [
    ['胸囲（全周）',   460, 500, 540],
    ['着丈',           680, 710, 740],
    ['肩幅',           400, 430, 460],
    ['袖丈',           200, 210, 220],
    ['袖山幅',         160, 170, 180],
    ['カフ幅',         120, 128, 136],
    ['首回り幅',       180, 190, 200],
    ['前衿ぐり深さ',    32,  34,  36],
    ['後衿ぐり深さ',    14,  15,  16],
    ['袖ぐり深さ',     180, 185, 192],
    ['縫い代',          10,  10,  10],
  ]

  const cw = [72, 28, 28, 28]
  const rowH = 7.5
  const tableW = cw.reduce((a, b) => a + b, 0)

  // テーブルヘッダー
  doc.setFillColor(0, 60, 100)
  doc.rect(margin, y - 4.5, tableW, rowH, 'F')
  sz(doc, 7.5)
  col(doc, 0, 168, 255)
  let cx = margin
  cols.forEach((c, i) => { doc.text(c, cx + 2, y); cx += cw[i] })
  y += rowH

  rows.forEach((row, ri) => {
    const bg = ri % 2 === 0 ? 14 : 18
    doc.setFillColor(bg, bg, bg)
    doc.rect(margin, y - 4.5, tableW, rowH, 'F')

    // 選択サイズ列をハイライト
    const sIdx = ['S', 'M', 'L'].indexOf(size)
    if (sIdx !== -1) {
      let hx = margin + cw[0]
      for (let i = 0; i < sIdx; i++) hx += cw[i + 1]
      doc.setFillColor(0, 30, 50)
      doc.rect(hx, y - 4.5, cw[sIdx + 1], rowH, 'F')
    }

    cx = margin
    row.forEach((cell, i) => {
      sz(doc, i === 0 ? 7.5 : 8)
      const isSelected = i > 0 && i === sIdx + 1
      col(doc, ...(isSelected ? [0, 168, 255] : i === 0 ? [160, 160, 160] : [210, 210, 210]))
      doc.text(String(cell), cx + 2, y)
      cx += cw[i]
    })
    y += rowH
  })

  // 縫製手順
  y += 12
  sectionTitle(doc, font, '縫製手順', y)
  y += 7
  const steps = [
    '1.  肩縫い（前後身頃を縫い合わせ、縫い代を割る）',
    '2.  脇縫い前に袖を付ける（フラットメソッド）',
    '3.  脇縫い：カフから裾まで一気に縫う',
    '4.  衿ぐり始末：見返しを折るかリブを付ける',
    '5.  裾始末：10mm折り→15mm折り、12mmでステッチ',
    `6.  推奨素材：4方向伸縮ジャージ 180〜220g/m²${color ? '（' + color + ' ベース）' : ''}`,
    '7.  裁断前に水通しを行い、縮み分を考慮してください',
  ]
  sz(doc, 8)
  col(doc, 170, 170, 170)
  steps.forEach(s => { doc.text(s, margin, y); y += 6 })

  // フッター
  col(doc, 60, 60, 60)
  sz(doc, 6.5)
  doc.text(
    'AI Pattern Engine  ·  この型紙はMVP用の簡易生成データです。実製造前に専門パタンナーによる確認を推奨します。',
    margin, 289
  )
  doc.text('2 / 2ページ', pageW - margin, 289, { align: 'right' })
}

// ── エクスポートボタン ────────────────────────────────────────────────────────
export default function PDFExport({ size, patternParams, color, summary }) {
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    try {
      const doc = new jsPDF({ unit: 'mm', format: 'a4' })
      const font = await loadFont(doc)

      drawPatternPage(doc, font, size, color)
      doc.addPage()

      // 2ページ目は新しい doc インスタンスにフォントを再登録
      if (font !== 'courier' && _fontBase64) {
        doc.addFileToVFS('NotoSansJP-Regular.ttf', _fontBase64)
        doc.addFont('NotoSansJP-Regular.ttf', 'NotoSansJP', 'normal')
      }
      drawSummaryPage(doc, font, size, summary, patternParams, color)

      doc.save(`型紙-Tシャツ-${size}-${Date.now()}.pdf`)
    } finally {
      setExporting(false)
    }
  }

  return (
    <button className="export-btn" onClick={handleExport} disabled={exporting}>
      {exporting ? '生成中...' : 'PDFエクスポート（A4・2ページ）'}
    </button>
  )
}
