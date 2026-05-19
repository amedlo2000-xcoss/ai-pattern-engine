import { useState } from 'react'
import { buildPanelData } from '../lib/patternEngine'

const C = {
  cut:      '#00A8FF', cutW: 0.9,
  seam:     'rgba(0,168,255,0.3)', seamW: 0.6,
  dim:      'rgba(255,255,255,0.4)', dimW: 0.5,
  label:    '#E5E5E5', sublabel: 'rgba(255,255,255,0.42)',
  grain:    'rgba(255,255,255,0.22)',
  fold:     'rgba(255,255,255,0.13)',
  extra:    'rgba(255,255,255,0.18)',
  fill:     'rgba(0,168,255,0.04)',
  grid10:   'rgba(255,255,255,0.02)',
  grid40:   'rgba(255,255,255,0.05)',
  bg:       '#0a0a0a',
  arrow:    'rgba(255,255,255,0.4)',
  sil:      'rgba(255,255,255,0.06)',
}

const ITEM_LABELS = {
  tshirt: 'Tシャツ', shirt: 'Yシャツ', dress: 'ワンピース',
  skirt: 'スカート', pants: 'ズボン',
}

const PATTERN_TABS = [
  { key: null,     label: '全パーツ' },
  { key: 'front',  label: '前身頃' },
  { key: 'back',   label: '後身頃' },
  { key: 'sleeve', label: '袖・その他' },
]

const FRONT_IDS  = new Set(['front', 'bodFront', 'skirtFront'])
const BACK_IDS   = new Set(['back',  'bodBack',  'skirtBack'])
const SLEEVE_IDS = new Set(['sleeve','collarStand','collar','cuff','waistband'])

function getPanelTab(id) {
  if (FRONT_IDS.has(id))  return 'front'
  if (BACK_IDS.has(id))   return 'back'
  if (SLEEVE_IDS.has(id)) return 'sleeve'
  return null
}

function getSilType(id, itemType) {
  if (['front', 'back', 'bodFront', 'bodBack'].includes(id)) {
    if (itemType === 'skirt') return 'lower'
    if (itemType === 'pants') return 'pants'
    return 'torso'
  }
  if (id === 'sleeve') return 'arm'
  if (id === 'skirtFront' || id === 'skirtBack') return 'lower'
  return null
}

function TorsoSil({ w, h }) {
  const headR  = w * 0.28
  const neckHW = w * 0.1
  const neckTopY = -headR * 0.18
  return (
    <g fill={C.sil} stroke="none">
      <ellipse cx={0} cy={-headR * 0.62} rx={headR * 0.82} ry={headR} />
      <rect x={-neckHW} y={neckTopY} width={neckHW * 2} height={Math.abs(neckTopY) + h * 0.052} />
      <path d={`
        M 0,${h * 0.05}
        L ${w * 0.9},${h * 0.09}
        C ${w * 1.03},${h * 0.27} ${w * 0.98},${h * 0.5} ${w * 0.89},${h * 0.61}
        C ${w * 0.93},${h * 0.73} ${w * 0.96},${h}       ${w * 0.96},${h}
        L 0,${h} Z
      `} />
    </g>
  )
}

function ArmSil({ w, h }) {
  const cx   = w * 0.5
  const topW = w * 0.38
  const botW = w * 0.24
  return (
    <path fill={C.sil} stroke="none" d={`
      M ${cx - topW / 2},${h * 0.03}
      L ${cx + topW / 2},${h * 0.03}
      C ${cx + topW / 2 + 3},${h * 0.18} ${cx + botW / 2 + 2},${h * 0.82} ${cx + botW / 2},${h}
      L ${cx - botW / 2},${h}
      C ${cx - botW / 2 - 2},${h * 0.82} ${cx - topW / 2 - 3},${h * 0.18} ${cx - topW / 2},${h * 0.03} Z
    `} />
  )
}

function LowerSil({ w, h }) {
  const waistW = w * 0.78
  const hemW   = w * 1.02
  return (
    <path fill={C.sil} stroke="none" d={`
      M 0,0
      L ${waistW},0
      C ${w * 0.95},${h * 0.13} ${hemW},${h * 0.44} ${hemW},${h}
      L 0,${h} Z
    `} />
  )
}

function PantsSil({ w, h }) {
  const rise  = h * 0.27
  const hipW  = w * 0.8
  const legW  = w * 0.46
  return (
    <g fill={C.sil} stroke="none">
      <path d={`
        M 0,0 L ${hipW},0
        C ${w * 0.93},${rise * 0.35} ${w},${rise * 0.7} ${w},${rise}
        L 0,${rise} Z
      `} />
      <rect x={0} y={rise} width={legW} height={h - rise} rx={3} />
    </g>
  )
}

function HumanSilhouette({ id, itemType, w, h }) {
  const t = getSilType(id, itemType)
  if (!t) return null
  switch (t) {
    case 'torso': return <TorsoSil w={w} h={h} />
    case 'arm':   return <ArmSil   w={w} h={h} />
    case 'lower': return <LowerSil w={w} h={h} />
    case 'pants': return <PantsSil w={w} h={h} />
    default:      return null
  }
}

function DimH({ x1, x2, y, label }) {
  const mx = (x1 + x2) / 2
  return (
    <g>
      <line x1={x1} y1={y} x2={x2} y2={y} stroke={C.dim} strokeWidth={C.dimW}
            markerStart="url(#aL)" markerEnd="url(#aR)" />
      <line x1={x1} y1={y-4} x2={x1} y2={y+4} stroke={C.dim} strokeWidth={C.dimW} />
      <line x1={x2} y1={y-4} x2={x2} y2={y+4} stroke={C.dim} strokeWidth={C.dimW} />
      <text x={mx} y={y-5} fill={C.sublabel} fontSize="8.5" fontFamily="monospace"
            textAnchor="middle" fontvariantnumeric="tabular-nums">{label} mm</text>
    </g>
  )
}

function DimV({ x, y1, y2, label }) {
  const my = (y1 + y2) / 2
  return (
    <g>
      <line x1={x} y1={y1} x2={x} y2={y2} stroke={C.dim} strokeWidth={C.dimW}
            markerStart="url(#aU)" markerEnd="url(#aD)" />
      <line x1={x-4} y1={y1} x2={x+4} y2={y1} stroke={C.dim} strokeWidth={C.dimW} />
      <line x1={x-4} y1={y2} x2={x+4} y2={y2} stroke={C.dim} strokeWidth={C.dimW} />
      <text x={x+6} y={my+3} fill={C.sublabel} fontSize="8.5" fontFamily="monospace"
            fontvariantnumeric="tabular-nums">{label} mm</text>
    </g>
  )
}

function PanelGroup({ p, dimmed, itemType }) {
  return (
    <g transform={`translate(${p.x},${p.y})`} opacity={dimmed ? 0.07 : 1}
       style={{ transition: 'opacity 0.3s' }}>
      <HumanSilhouette id={p.id} itemType={itemType} w={p.w} h={p.h} />
      <path d={p.cutPath} fill={C.fill} stroke={C.cut} strokeWidth={C.cutW} />
      <path d={p.seamPath} fill="none" stroke={C.seam} strokeWidth={C.seamW}
            strokeDasharray="3,4" />
      {p.fold && (
        <line x1={0} y1={0} x2={0} y2={p.h}
              stroke={C.fold} strokeWidth="0.7" strokeDasharray="8,4" />
      )}
      {p.extra?.map((e, i) => (
        <path key={i} d={e.d} fill="none"
              stroke={C.extra} strokeWidth="0.6" strokeDasharray="5,3" />
      ))}
      {p.grain && (
        <g>
          <line x1={p.grain.x} y1={p.grain.y1} x2={p.grain.x} y2={p.grain.y2}
                stroke={C.grain} strokeWidth="0.8" markerEnd="url(#aGrain)" />
          <text x={p.grain.x+3} y={(p.grain.y1+p.grain.y2)/2+3}
                fill={C.grain} fontSize="8" fontFamily="monospace">布目線</text>
        </g>
      )}
      <text x={6} y={15} fill={C.label} fontSize="10" fontFamily="monospace"
            fontWeight="bold" letterSpacing="0.06em">{p.title}</text>
      <text x={6} y={26} fill={C.sublabel} fontSize="8" fontFamily="monospace">
        {p.subtitle}
      </text>
      {p.fold && (
        <text x={3} y={p.h/2} fill={C.fold} fontSize="8" fontFamily="monospace"
              writingMode="tb" dominantBaseline="middle">{p.fold}</text>
      )}
      {p.dims.map((dim, i) =>
        dim.axis === 'h'
          ? <DimH key={i} x1={dim.x1} x2={dim.x2} y={dim.y} label={dim.label} />
          : <DimV key={i} x={dim.x}  y1={dim.y1} y2={dim.y2} label={dim.label} />
      )}
    </g>
  )
}

function SvgDefs() {
  return (
    <defs>
      <pattern id="g10" width="10" height="10" patternUnits="userSpaceOnUse">
        <path d="M10 0H0V10" fill="none" stroke={C.grid10} strokeWidth="0.3" />
      </pattern>
      <pattern id="g40" width="40" height="40" patternUnits="userSpaceOnUse">
        <rect width="40" height="40" fill="url(#g10)" />
        <path d="M40 0H0V40" fill="none" stroke={C.grid40} strokeWidth="0.6" />
      </pattern>
      {[['aR','auto'],['aL','auto-start-reverse'],['aD','auto'],['aU','auto-start-reverse'],['aGrain','auto']].map(([id, o]) => (
        <marker key={id} id={id} markerWidth="5" markerHeight="5" refX="2.5" refY="2.5" orient={o}>
          <path d="M0,1 L2.5,2.5 L0,4" fill="none"
                stroke={id === 'aGrain' ? C.grain : C.arrow} strokeWidth="0.8" />
        </marker>
      ))}
    </defs>
  )
}

export default function PatternSVG({ itemType = 'tshirt', size = 'M', glowing = false }) {
  const [activeTab, setActiveTab] = useState(null)
  const [fullscreen, setFullscreen] = useState(false)

  const data = buildPanelData(itemType, size)
  const { panels, totalW, totalH, raw, notice } = data
  const itemLabel = ITEM_LABELS[itemType] || itemType

  const svgBody = (
    <>
      <SvgDefs />
      <rect width={totalW} height={totalH} fill={C.bg} />
      <rect width={totalW} height={totalH} fill="url(#g40)" />
      <text x={28} y={22} fill={C.label} fontSize="12" fontFamily="monospace"
            fontWeight="bold" letterSpacing="0.1em">
        AI PATTERN ENGINE  ·  {itemLabel.toUpperCase()}  SIZE {size}
      </text>
      {raw.chest && (
        <text x={28} y={36} fill={C.sublabel} fontSize="8.5" fontFamily="monospace"
              fontvariantnumeric="tabular-nums">
          {[
            raw.chest     && `胸囲 ${raw.chest}`,
            raw.length    && `着丈 ${raw.length}`,
            raw.shoulder  && `肩幅 ${raw.shoulder}`,
            raw.sleeve    && `袖丈 ${raw.sleeve}`,
            raw.halfWaist && `½ウエスト ${raw.halfWaist}`,
            raw.halfHip   && `½ヒップ ${raw.halfHip}`,
          ].filter(Boolean).join('  ·  ')}  [mm ±2mm]
        </text>
      )}
      {panels.map(p => (
        <PanelGroup
          key={p.id}
          p={p}
          dimmed={activeTab !== null && getPanelTab(p.id) !== activeTab}
          itemType={itemType}
        />
      ))}
      <text x={28} y={totalH - 10} fill="rgba(255,255,255,0.18)"
            fontSize="8" fontFamily="monospace">
        100%実寸で印刷 · 縫い代10mm含む（内側点線） · 裁断前に必ず採寸確認
      </text>
    </>
  )

  return (
    <div className="glass-panel pattern-panel">
      <div className="pattern-header">
        <h2 className="panel-title">型紙 — {itemLabel} サイズ {size}</h2>
        <div className="pattern-dims-inline">
          {raw.chest      && <DimChip k="胸囲"       v={raw.chest} />}
          {raw.length     && <DimChip k="着丈"       v={raw.length} />}
          {raw.shoulder   && <DimChip k="肩幅"       v={raw.shoulder} />}
          {raw.sleeve     && <DimChip k="袖丈"       v={raw.sleeve} />}
          {raw.halfWaist  && <DimChip k="½ウエスト" v={raw.halfWaist} />}
          {raw.halfHip    && <DimChip k="½ヒップ"   v={raw.halfHip} />}
          {raw.inseam     && <DimChip k="股下"       v={raw.inseam} />}
        </div>
      </div>

      <div className="pattern-tabs">
        {PATTERN_TABS.map(t => (
          <button
            key={String(t.key)}
            className={`pattern-tab ${activeTab === t.key ? 'active' : ''}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="pattern-notice">{notice}</div>

      <div className="svg-scroll-wrap">
        {!fullscreen && (
          <div className={`svg-scroll ${glowing ? 'pattern-glowing' : ''}`}>
            <svg viewBox={`0 0 ${totalW} ${totalH}`} width="100%"
                 style={{ display: 'block' }}>
              {svgBody}
            </svg>
          </div>
        )}
        <button className="fullscreen-btn" onClick={() => setFullscreen(true)}
                style={{ display: fullscreen ? 'none' : undefined }}>
          ⛶ 全画面
        </button>
      </div>

      <div className="pattern-legend">
        <LegLine color={C.cut}  label="カット線" dash="" />
        <LegLine color={C.seam} label="縫い代10mm" dash="3,4" />
        <LegLine color={C.fold} label="折り線(CF/CB)" dash="8,4" />
        <LegLine color={C.grain} label="布目線" dash="" />
      </div>

      {fullscreen && (
        <div className="pattern-fullscreen-overlay" onClick={() => setFullscreen(false)}>
          <button className="fullscreen-close" onClick={() => setFullscreen(false)}>×</button>
          <div className="pattern-fullscreen-content" onClick={e => e.stopPropagation()}>
            <svg viewBox={`0 0 ${totalW} ${totalH}`} width="100%"
                 style={{ display: 'block' }}>
              {svgBody}
            </svg>
          </div>
        </div>
      )}
    </div>
  )
}

function DimChip({ k, v }) {
  return (
    <span className="dim-chip">
      <span className="dim-chip-k">{k}</span>
      <span className="dim-chip-v">{v}</span>
    </span>
  )
}

function LegLine({ color, label, dash }) {
  return (
    <span className="legend-item">
      <svg width="22" height="6" style={{ verticalAlign:'middle', marginRight:4 }}>
        <line x1="0" y1="3" x2="22" y2="3" stroke={color} strokeWidth="1.5"
              strokeDasharray={dash || undefined} />
      </svg>
      {label}
    </span>
  )
}
