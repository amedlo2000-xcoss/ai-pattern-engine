import { useState } from 'react'
import { jsPDF } from 'jspdf'
import { getDimensions } from '../lib/patternEngine'

// ── フォント読み込み ──────────────────────────────────────────────────────────
let _fontBase64 = null

async function arrayBufferToBase64(buf) {
  const bytes = new Uint8Array(buf)
  const chunks = []
  for (let i = 0; i < bytes.length; i += 65536)
    chunks.push(String.fromCharCode(...bytes.subarray(i, i + 65536)))
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

// ── 色定数（白背景用） ────────────────────────────────────────────────────────
const C = {
  white:    [255, 255, 255],
  gridMin:  [225, 232, 240],   // 薄青グリッド（細）
  gridMaj:  [200, 215, 230],   // 薄青グリッド（太）
  blue:     [0,   100, 180],   // メイン青
  blueDark: [0,    60, 130],   // 縫い代線・濃青
  blueHL:   [0,   168, 255],   // アクセント明青（見出しのみ）
  panelFg:  [240, 248, 255],   // パネル塗り（ほぼ白）
  text:     [30,   30,  30],   // 本文黒
  subtext:  [80,   80,  80],   // 補助テキスト
  muted:    [140, 140, 140],   // グレー
  warn:     [160,  80,   0],   // 警告色
  rule:     [200, 215, 230],   // 罫線
  tblHead:  [0,    70, 130],   // 表ヘッダー背景
  tblEven:  [245, 249, 253],   // 表偶数行
  tblOdd:   [255, 255, 255],   // 表奇数行
  tblHL:    [210, 235, 255],   // 選択サイズ列
}

const sz  = (doc, n) => doc.setFontSize(n)
const col = (doc, r, g, b) => doc.setTextColor(r, g, b)
const drw = (doc, r, g, b) => doc.setDrawColor(r, g, b)
const fil = (doc, r, g, b) => doc.setFillColor(r, g, b)

function hRule(doc, y, margin = 15) {
  drw(doc, ...C.rule)
  doc.setLineWidth(0.3)
  doc.line(margin, y, 210 - margin, y)
}

function sectionTitle(doc, font, text, y, margin = 15) {
  doc.setFont(font, 'normal')
  sz(doc, 8)
  col(doc, ...C.muted)
  doc.text(text.toUpperCase(), margin, y)
}

// ── 1ページ目：型紙（白背景） ────────────────────────────────────────────────
function drawPatternPage(doc, font, itemType, size, color) {
  const d = getDimensions(itemType, size)
  const margin = 15
  const pageW  = 210
  const pageH  = 297

  doc.setFont(font, 'normal')

  // 白背景
  fil(doc, ...C.white)
  doc.rect(0, 0, pageW, pageH, 'F')

  // CADグリッド（薄青・細）
  drw(doc, ...C.gridMin)
  doc.setLineWidth(0.12)
  for (let x = 0; x <= pageW; x += 10) doc.line(x, 0, x, pageH)
  for (let y = 0; y <= pageH; y += 10) doc.line(0, y, pageW, y)
  // CADグリッド（薄青・太）
  drw(doc, ...C.gridMaj)
  doc.setLineWidth(0.25)
  for (let x = 0; x <= pageW; x += 40) doc.line(x, 0, x, pageH)
  for (let y = 0; y <= pageH; y += 40) doc.line(0, y, pageW, y)

  // ── ヘッダー ─────────────────────────────────────────────────────────────
  sz(doc, 12)
  col(doc, ...C.blue)
  doc.text('AI PATTERN ENGINE', margin, 14)

  sz(doc, 8)
  col(doc, ...C.subtext)
  const itemLabel = itemType === 'tshirt' ? 'Tシャツ' : itemType === 'shirt' ? 'Yシャツ'
    : itemType === 'dress' ? 'ワンピース' : itemType === 'skirt' ? 'スカート'
    : itemType === 'pants' ? 'ズボン' : itemType === 'jacket' ? 'ジャケット'
    : itemType === 'hoodie' ? 'パーカー' : itemType === 'shorts' ? 'ショートパンツ'
    : itemType
  doc.text(`${itemLabel}  サイズ${size}  ·  縫い代 10mm`, margin, 21)

  hRule(doc, 25)

  col(doc, ...C.warn)
  sz(doc, 7)
  doc.text('！ 100%実寸で印刷してください（ページに合わせて拡大縮小しないこと）', margin, 31)

  // 50mm基準線（右上）
  drw(doc, ...C.blue)
  doc.setLineWidth(0.5)
  doc.rect(pageW - margin - 50, 24, 50, 5)
  col(doc, ...C.blue)
  sz(doc, 6)
  doc.text('← 50mm基準線 →', pageW - margin - 50, 31.5)

  // ── スケール計算 ─────────────────────────────────────────────────────────
  const usableW = pageW - margin * 2
  const halfChest = d.chest / 2
  const scale = (usableW * 0.44) / halfChest   // ½胸囲を左半分に収める
  const S = v => v * scale
  const sa = S(10)

  const sleeveLen = 'sleeve' in d ? S(d.sleeve) : S(200)
  const sleeveTop = 'sleeveWidth' in d ? S(d.sleeveWidth) : S(160)
  const cuff      = 'cuff' in d ? S(d.cuff) : S(120)
  const halfChestPx = S(halfChest)
  const bodyH = 'length' in d ? S(d.length * 0.5) : S(300)

  function seamLine(x1, y1, x2, y2) {
    drw(doc, ...C.blueDark)
    doc.setLineWidth(0.18)
    doc.setLineDashPattern([0.8, 1.6], 0)
    doc.line(x1, y1, x2, y2)
    doc.setLineDashPattern([], 0)
  }

  function grainLine(x1, y1, x2, y2) {
    drw(doc, ...C.muted)
    doc.setLineWidth(0.25)
    doc.line(x1, y1, x2, y2)
    // 矢印
    doc.line(x1, y1, x1 - 1, y1 + 2)
    doc.line(x1, y1, x1 + 1, y1 + 2)
    doc.line(x2, y2, x2 - 1, y2 - 2)
    doc.line(x2, y2, x2 + 1, y2 - 2)
  }

  function dimLabel(text, x, y) {
    col(doc, ...C.subtext)
    sz(doc, 6.5)
    doc.text(text, x, y)
  }

  function panelLabel(text, x, y) {
    col(doc, ...C.blue)
    sz(doc, 7.5)
    doc.text(text, x, y)
  }

  // ── 前身頃 ────────────────────────────────────────────────────────────────
  const fx = margin
  const fy = 38
  panelLabel('前身頃（わで1枚裁断）', fx, fy - 2)
  fil(doc, ...C.panelFg)
  drw(doc, ...C.blue)
  doc.setLineWidth(0.5)
  doc.rect(fx, fy, halfChestPx, bodyH, 'FD')
  seamLine(fx + sa, fy + sa, fx + halfChestPx - sa, fy + sa)
  seamLine(fx + sa, fy + bodyH - sa, fx + halfChestPx - sa, fy + bodyH - sa)
  seamLine(fx + sa, fy + sa, fx + sa, fy + bodyH - sa)
  seamLine(fx + halfChestPx - sa, fy + sa, fx + halfChestPx - sa, fy + bodyH - sa)
  grainLine(fx + halfChestPx / 2, fy + bodyH * 0.25, fx + halfChestPx / 2, fy + bodyH * 0.75)
  dimLabel('布目線', fx + halfChestPx / 2 + 1.5, fy + bodyH * 0.52)
  dimLabel(`着丈 ${d.length}mm`, fx + halfChestPx + 2, fy + bodyH / 2)
  dimLabel(`½胸囲 ${halfChest}mm`, fx + halfChestPx / 2 - 8, fy + bodyH + 5)

  // ── 後身頃 ────────────────────────────────────────────────────────────────
  const bx = fx + halfChestPx + 12
  const by = fy
  panelLabel('後身頃（わで1枚裁断）', bx, by - 2)
  fil(doc, ...C.panelFg)
  drw(doc, ...C.blue)
  doc.setLineWidth(0.5)
  doc.rect(bx, by, halfChestPx, bodyH, 'FD')
  seamLine(bx + sa, by + sa, bx + halfChestPx - sa, by + sa)
  seamLine(bx + sa, by + bodyH - sa, bx + halfChestPx - sa, by + bodyH - sa)
  seamLine(bx + sa, by + sa, bx + sa, by + bodyH - sa)
  seamLine(bx + halfChestPx - sa, by + sa, bx + halfChestPx - sa, by + bodyH - sa)
  grainLine(bx + halfChestPx / 2, by + bodyH * 0.25, bx + halfChestPx / 2, by + bodyH * 0.75)
  dimLabel('布目線', bx + halfChestPx / 2 + 1.5, by + bodyH * 0.52)

  // ── 袖 ───────────────────────────────────────────────────────────────────
  const svx = margin
  const svy = fy + bodyH + 16
  panelLabel('袖（2枚裁断・左右反転）', svx, svy - 2)
  const sl = (sleeveTop - cuff) / 2
  fil(doc, ...C.panelFg)
  drw(doc, ...C.blue)
  doc.setLineWidth(0.5)
  doc.lines(
    [[sleeveTop, 0], [sl - sleeveTop + cuff / 2, sleeveLen],
     [-cuff, 0], [sleeveTop - sl - cuff / 2, -sleeveLen]],
    svx, svy, [1, 1], 'FD'
  )
  grainLine(svx + sleeveTop / 2, svy + sleeveLen * 0.2, svx + sleeveTop / 2, svy + sleeveLen * 0.75)
  dimLabel('布目線', svx + sleeveTop / 2 + 1.5, svy + sleeveLen * 0.5)
  dimLabel(`袖丈 ${d.sleeve}mm`, svx + sleeveTop + 2, svy + sleeveLen / 2)
  dimLabel(`袖山幅 ${d.sleeveWidth}mm`, svx + sleeveTop / 2 - 10, svy + sleeveLen + 5)

  // ── 凡例 ─────────────────────────────────────────────────────────────────
  const legY = svy + sleeveLen + 18
  drw(doc, ...C.blue)
  doc.setLineWidth(0.5)
  doc.line(margin, legY, margin + 10, legY)
  dimLabel('裁断線', margin + 11.5, legY + 1)
  drw(doc, ...C.blueDark)
  doc.setLineWidth(0.18)
  doc.setLineDashPattern([0.8, 1.6], 0)
  doc.line(margin + 30, legY, margin + 40, legY)
  doc.setLineDashPattern([], 0)
  dimLabel('縫い代線（10mm）', margin + 41.5, legY + 1)

  // ── フッター ──────────────────────────────────────────────────────────────
  hRule(doc, pageH - 12)
  col(doc, ...C.muted)
  sz(doc, 6)
  doc.text(
    'AI Pattern Engine  ·  単位mm  ·  縫い代10mm含む  ·  実製造前に専門パタンナーによる確認を推奨します。',
    margin, pageH - 7
  )
  doc.text(`1 / 2ページ  ·  サイズ ${size}`, pageW - margin, pageH - 7, { align: 'right' })
}

// ── 2ページ目：サマリー + 寸法表（白背景） ───────────────────────────────────
function drawSummaryPage(doc, font, itemType, size, summary, patternParams, color) {
  const margin = 15
  const pageW  = 210

  doc.setFont(font, 'normal')

  // 白背景
  fil(doc, ...C.white)
  doc.rect(0, 0, pageW, 297, 'F')

  sz(doc, 12)
  col(doc, ...C.blue)
  doc.text('デザインサマリー', margin, 16)
  hRule(doc, 20)

  if (summary) {
    sz(doc, 9)
    col(doc, ...C.text)
    const lines = doc.splitTextToSize(summary, pageW - margin * 2)
    doc.text(lines, margin, 28)
  }

  let y = summary
    ? 28 + 6 * Math.min(doc.splitTextToSize(summary, pageW - margin * 2).length, 6) + 10
    : 30

  // パターンパラメータ
  if (patternParams) {
    sectionTitle(doc, font, 'パターンパラメータ', y)
    y += 7
    const entries = Object.entries(patternParams)
    const colW = (pageW - margin * 2) / 2
    entries.forEach(([k, v], i) => {
      const col2 = i % 2
      const row  = Math.floor(i / 2)
      const cx   = margin + col2 * colW
      const cy   = y + row * 10
      fil(doc, ...C.tblEven)
      doc.roundedRect(cx, cy - 5.5, colW - 4, 9, 1, 1, 'F')
      drw(doc, ...C.gridMaj)
      doc.setLineWidth(0.15)
      doc.roundedRect(cx, cy - 5.5, colW - 4, 9, 1, 1, 'D')
      col(doc, ...C.muted)
      sz(doc, 6.5)
      doc.text(k.toUpperCase(), cx + 3, cy - 0.5)
      sz(doc, 8)
      col(doc, ...C.text)
      doc.text(String(v), cx + 3, cy + 4.5)
    })
    y += Math.ceil(entries.length / 2) * 10 + 12
  }

  // 寸法表
  sectionTitle(doc, font, '寸法表（mm）', y)
  y += 7

  const d = getDimensions(itemType, size)
  const allSizes = {
    S: getDimensions(itemType, 'S'),
    M: getDimensions(itemType, 'M'),
    L: getDimensions(itemType, 'L'),
  }

  const dimKeys = Object.keys(d).slice(0, 8)
  const keyLabels = {
    chest: '胸囲', length: '着丈', shoulder: '肩幅', sleeve: '袖丈',
    sleeveWidth: '袖山幅', cuff: 'カフ幅', neck: '首回り', halfWaist: 'ウエスト(半)',
    halfHip: 'ヒップ(半)', inseam: '股下', rise: '股上', bodiceLen: 'ボディス丈',
    skirtLen: 'スカート丈', hoodW: 'フード幅', hoodH: 'フード丈',
  }

  const cols = ['部位', 'S', 'M', 'L']
  const rows = dimKeys.map(k => [
    keyLabels[k] || k,
    allSizes.S[k] ?? '-',
    allSizes.M[k] ?? '-',
    allSizes.L[k] ?? '-',
  ])

  const cw   = [72, 28, 28, 28]
  const rowH = 7.5
  const tableW = cw.reduce((a, b) => a + b, 0)

  // テーブルヘッダー
  fil(doc, ...C.tblHead)
  doc.rect(margin, y - 5, tableW, rowH, 'F')
  sz(doc, 7.5)
  col(doc, 255, 255, 255)
  let cx = margin
  cols.forEach((c, i) => { doc.text(c, cx + 3, y); cx += cw[i] })
  y += rowH

  const sIdx = ['S', 'M', 'L'].indexOf(size)

  rows.forEach((row, ri) => {
    fil(doc, ...(ri % 2 === 0 ? C.tblOdd : C.tblEven))
    doc.rect(margin, y - 5, tableW, rowH, 'F')

    // 選択サイズ列ハイライト
    if (sIdx !== -1) {
      let hx = margin + cw[0]
      for (let i = 0; i < sIdx; i++) hx += cw[i + 1]
      fil(doc, ...C.tblHL)
      doc.rect(hx, y - 5, cw[sIdx + 1], rowH, 'F')
    }

    // 罫線
    drw(doc, ...C.gridMaj)
    doc.setLineWidth(0.12)
    doc.line(margin, y + 2.5, margin + tableW, y + 2.5)

    cx = margin
    row.forEach((cell, i) => {
      const isSelected = i > 0 && i === sIdx + 1
      sz(doc, i === 0 ? 7.5 : 8)
      col(doc, ...(isSelected ? C.blue : i === 0 ? C.subtext : C.text))
      doc.text(String(cell), cx + 3, y)
      cx += cw[i]
    })
    y += rowH
  })

  // 縫製手順
  y += 12
  sectionTitle(doc, font, '縫製手順', y)
  y += 8
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
  col(doc, ...C.subtext)
  steps.forEach(s => { doc.text(s, margin, y); y += 6.5 })

  // フッター
  hRule(doc, 289)
  col(doc, ...C.muted)
  sz(doc, 6)
  doc.text(
    'AI Pattern Engine  ·  この型紙はMVP用の簡易生成データです。実製造前に専門パタンナーによる確認を推奨します。',
    margin, 293
  )
  doc.text('2 / 2ページ', pageW - margin, 293, { align: 'right' })
}

// ── エクスポートボタン ────────────────────────────────────────────────────────
export default function PDFExport({ size, itemType = 'tshirt', patternParams, color, summary }) {
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    try {
      const doc  = new jsPDF({ unit: 'mm', format: 'a4' })
      const font = await loadFont(doc)

      drawPatternPage(doc, font, itemType, size, color)
      doc.addPage()

      if (font !== 'courier' && _fontBase64) {
        doc.addFileToVFS('NotoSansJP-Regular.ttf', _fontBase64)
        doc.addFont('NotoSansJP-Regular.ttf', 'NotoSansJP', 'normal')
      }
      drawSummaryPage(doc, font, itemType, size, summary, patternParams, color)

      const itemLabel = itemType === 'tshirt' ? 'Tシャツ' : itemType === 'shirt' ? 'Yシャツ'
        : itemType === 'dress' ? 'ワンピース' : itemType === 'skirt' ? 'スカート'
        : itemType === 'pants' ? 'ズボン' : itemType === 'jacket' ? 'ジャケット'
        : itemType === 'hoodie' ? 'パーカー' : itemType === 'shorts' ? 'ショートパンツ'
        : itemType
      doc.save(`型紙-${itemLabel}-${size}-${Date.now()}.pdf`)
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
