// ── 共通定数 ──────────────────────────────────────────────────────────────────
export const SEAM = 10        // 縫い代 mm
export const SCALE = 0.44     // 表示スケール (1mm = 0.44px)
const PAD = 28                // パネル間のパディング

function applyVerticalLayout(panels) {
  let y = PAD + 50
  let maxW = 0
  for (const p of panels) {
    p.x = PAD
    p.y = y
    y += p.h + 60
    maxW = Math.max(maxW, p.w)
  }
  return { totalW: maxW + PAD * 2 + 80, totalH: y + 30 }
}

// ── サイズテーブル (mm) ────────────────────────────────────────────────────────
const SIZES = {
  tshirt: {
    S: { chest:460, length:680, shoulder:400, sleeve:200, sleeveWidth:160, cuff:120, neck:380, neckDepthF:32, neckDepthB:14, armhole:180, hem:460, shldrDrop:12 },
    M: { chest:500, length:710, shoulder:430, sleeve:210, sleeveWidth:170, cuff:128, neck:390, neckDepthF:34, neckDepthB:15, armhole:185, hem:500, shldrDrop:12 },
    L: { chest:540, length:740, shoulder:460, sleeve:220, sleeveWidth:180, cuff:136, neck:400, neckDepthF:36, neckDepthB:16, armhole:192, hem:540, shldrDrop:12 },
  },
  shirt: {
    S: { chest:460, length:720, shoulder:400, sleeve:580, sleeveWidth:150, cuff:210, cuffH:60, neck:370, neckDepthF:18, neckDepthB:10, armhole:175, hem:460, placket:30, collarW:380, collarH:35, collarStand:25, shldrDrop:12 },
    M: { chest:500, length:750, shoulder:430, sleeve:600, sleeveWidth:160, cuff:220, cuffH:60, neck:380, neckDepthF:20, neckDepthB:10, armhole:180, hem:500, placket:30, collarW:390, collarH:35, collarStand:25, shldrDrop:12 },
    L: { chest:540, length:780, shoulder:460, sleeve:620, sleeveWidth:170, cuff:230, cuffH:60, neck:390, neckDepthF:22, neckDepthB:10, armhole:185, hem:540, placket:30, collarW:400, collarH:35, collarStand:25, shldrDrop:12 },
  },
  dress: {
    S: { chest:460, bodiceLen:380, skirtLen:540, shoulder:400, sleeve:200, sleeveWidth:150, cuff:120, neck:380, neckDepthF:32, neckDepthB:14, armhole:178, halfWaist:340, halfHip:465, shldrDrop:12 },
    M: { chest:500, bodiceLen:390, skirtLen:560, shoulder:430, sleeve:210, sleeveWidth:160, cuff:128, neck:390, neckDepthF:34, neckDepthB:15, armhole:183, halfWaist:355, halfHip:480, shldrDrop:12 },
    L: { chest:540, bodiceLen:400, skirtLen:580, shoulder:460, sleeve:220, sleeveWidth:170, cuff:136, neck:400, neckDepthF:36, neckDepthB:16, armhole:188, halfWaist:370, halfHip:495, shldrDrop:12 },
  },
  skirt: {
    S: { halfWaist:340, halfHip:460, length:560, waistbandH:30 },
    M: { halfWaist:355, halfHip:475, length:580, waistbandH:30 },
    L: { halfWaist:370, halfHip:490, length:600, waistbandH:30 },
  },
  pants: {
    S: { halfWaist:340, halfHip:460, rise:250, inseam:720, halfLeg:230, halfHem:190, crotchExtF:28, crotchExtB:58, waistbandH:30 },
    M: { halfWaist:355, halfHip:475, rise:260, inseam:740, halfLeg:240, halfHem:195, crotchExtF:30, crotchExtB:62, waistbandH:30 },
    L: { halfWaist:370, halfHip:490, rise:270, inseam:760, halfLeg:250, halfHem:200, crotchExtF:32, crotchExtB:66, waistbandH:30 },
  },
}

export function getDimensions(itemType, size) {
  return (SIZES[itemType] || SIZES.tshirt)[size] || (SIZES[itemType] || SIZES.tshirt).M
}

export function getSizes() { return ['S', 'M', 'L'] }

// ── メインエントリ ────────────────────────────────────────────────────────────
export function buildPanelData(itemType = 'tshirt', size = 'M') {
  const d = getDimensions(itemType, size)
  const s = v => Math.round(v * SCALE)

  switch (itemType) {
    case 'shirt': return buildShirt(d, s, size)
    case 'dress': return buildDress(d, s, size)
    case 'skirt': return buildSkirt(d, s, size)
    case 'pants': return buildPants(d, s, size)
    default:      return buildTshirt(d, s, size)
  }
}

// ── T シャツ ──────────────────────────────────────────────────────────────────
function buildTshirt(d, s, size) {
  const sa = s(SEAM)
  const halfChest = s(d.chest / 2), bodyLen = s(d.length)
  const shldr     = s(d.shoulder / 2), shldrDrop = s(d.shldrDrop)
  const neckW     = s(d.neck / 2)
  const neckDF    = s(d.neckDepthF), neckDB = s(d.neckDepthB)
  const ahD       = s(d.armhole)
  const slvLen    = s(d.sleeve), slvTop = s(d.sleeveWidth)
  const cuff      = s(d.cuff)
  const capH      = Math.round(ahD * 0.33)
  const sideOff   = Math.round((slvTop - cuff) / 2)

  // 前身頃カットパス
  const frontCut = pts([
    `M 0,${neckDF}`,
    `Q ${r(neckW*0.45)},${r(neckDF*0.1)} ${neckW},0`,
    `L ${shldr},${shldrDrop}`,
    `C ${shldr+s(10)},${r(ahD*0.42)} ${halfChest},${r(ahD*0.8)} ${halfChest},${ahD}`,
    `L ${halfChest},${bodyLen}`,
    `L 0,${bodyLen} Z`,
  ])
  const frontSeam = pts([
    `M ${sa},${neckDF+sa}`,
    `Q ${r(neckW*0.45)},${sa*1.3} ${neckW-sa},${sa}`,
    `L ${shldr-sa},${shldrDrop+sa}`,
    `C ${shldr+s(8)},${r(ahD*0.44+sa)} ${halfChest-sa},${r(ahD*0.82)} ${halfChest-sa},${ahD+sa}`,
    `L ${halfChest-sa},${bodyLen-sa}`,
    `L ${sa},${bodyLen-sa} Z`,
  ])

  // 後身頃カットパス
  const backCut = pts([
    `M 0,${neckDB}`,
    `Q ${r(neckW*0.45)},${r(neckDB*0.15)} ${neckW},0`,
    `L ${shldr},${shldrDrop}`,
    `C ${shldr+s(10)},${r(ahD*0.42)} ${halfChest},${r(ahD*0.8)} ${halfChest},${ahD}`,
    `L ${halfChest},${bodyLen}`,
    `L 0,${bodyLen} Z`,
  ])
  const backSeam = pts([
    `M ${sa},${neckDB+sa}`,
    `Q ${r(neckW*0.45)},${sa*1.3} ${neckW-sa},${sa}`,
    `L ${shldr-sa},${shldrDrop+sa}`,
    `C ${shldr+s(8)},${r(ahD*0.44+sa)} ${halfChest-sa},${r(ahD*0.82)} ${halfChest-sa},${ahD+sa}`,
    `L ${halfChest-sa},${bodyLen-sa}`,
    `L ${sa},${bodyLen-sa} Z`,
  ])

  // 袖パス（袖山曲線 + 台形）
  const slvCut = pts([
    `M 0,${capH}`,
    `C ${r(slvTop*0.15)},${r(capH*0.18)} ${r(slvTop*0.42)},0 ${r(slvTop/2)},0`,
    `C ${r(slvTop*0.58)},0 ${r(slvTop*0.85)},${r(capH*0.18)} ${slvTop},${capH}`,
    `L ${slvTop-sideOff},${slvLen}`,
    `L ${sideOff},${slvLen} Z`,
  ])
  const slvSeam = pts([
    `M ${sa},${capH+sa}`,
    `C ${r(slvTop*0.15+sa)},${r(capH*0.3)} ${r(slvTop*0.42)},${sa} ${r(slvTop/2)},${sa}`,
    `C ${r(slvTop*0.58)},${sa} ${r(slvTop*0.85-sa)},${r(capH*0.3)} ${slvTop-sa},${capH+sa}`,
    `L ${slvTop-sideOff-sa},${slvLen-sa}`,
    `L ${sideOff+sa},${slvLen-sa} Z`,
  ])

  const ps=[
    panel('front','前身頃','わで1枚裁断（CF折り）',0,0,halfChest,bodyLen,frontCut,frontSeam,
      {x:halfChest/2,y1:bodyLen*0.22,y2:bodyLen*0.78},'CF',[
        hDim(0,halfChest,bodyLen+18,`½胸囲 ${d.chest/2}`),
        vDim(halfChest+18,0,bodyLen,`着丈 ${d.length}`),
        hDim(0,neckW,-16,`½首回り ${d.neck/2}`),
      ]),
    panel('back','後身頃','わで1枚裁断（CB折り）',0,0,halfChest,bodyLen,backCut,backSeam,
      {x:halfChest/2,y1:bodyLen*0.22,y2:bodyLen*0.78},'CB',[
        hDim(0,halfChest,bodyLen+18,`½胸囲 ${d.chest/2}`),
        vDim(halfChest+18,0,bodyLen,`着丈 ${d.length}`),
      ]),
    panel('sleeve','袖','2枚裁断（左右対称）',0,0,slvTop,slvLen,slvCut,slvSeam,
      {x:slvTop/2,y1:slvLen*0.3,y2:slvLen*0.75},null,[
        hDim(0,slvTop,slvLen+18,`袖山幅 ${d.sleeveWidth}`),
        vDim(slvTop+18,capH,slvLen,`袖丈 ${d.sleeve}`),
      ]),
  ]
  const { totalW, totalH } = applyVerticalLayout(ps)
  return { itemType:'tshirt', size, raw:d,
    notice:'縫い代10mm含む（内側点線）。前後身頃はわで裁断。袖は2枚（左右対称）。',
    panels:ps, totalW, totalH }
}

// ── シャツ ────────────────────────────────────────────────────────────────────
function buildShirt(d, s, size) {
  const sa = s(SEAM)
  const halfChest = s(d.chest/2), bodyLen = s(d.length)
  const shldr = s(d.shoulder/2), shldrDrop = s(d.shldrDrop)
  const neckW = s(d.neck/2), neckDF = s(d.neckDepthF), neckDB = s(d.neckDepthB)
  const ahD = s(d.armhole)
  const slvLen = s(d.sleeve), slvTop = s(d.sleeveWidth), cuff = s(d.cuff), cuffH = s(d.cuffH)
  const sideOff = Math.round((slvTop-cuff)/2)
  const placket = s(d.placket)
  const collarW = s(d.collarW/2), collarH = s(d.collarH), standH = s(d.collarStand)
  const capH = Math.round(ahD*0.33)

  // 前身頃（シャツ：やや深い衿ぐり + 前立て）
  const frontCut = pts([
    `M 0,${neckDF}`,
    `Q ${r(neckW*0.4)},${r(neckDF*0.2)} ${neckW},0`,
    `L ${shldr},${shldrDrop}`,
    `C ${shldr+s(10)},${r(ahD*0.42)} ${halfChest},${r(ahD*0.8)} ${halfChest},${ahD}`,
    `L ${halfChest},${bodyLen}`,
    `L 0,${bodyLen} Z`,
  ])
  const frontSeam = insetRect(0, neckDF, halfChest, bodyLen, sa)
  const placketLine = `M ${placket},0 L ${placket},${bodyLen}` // 前立てライン

  const backCut = pts([
    `M 0,${neckDB}`,
    `Q ${r(neckW*0.4)},${r(neckDB*0.2)} ${neckW},0`,
    `L ${shldr},${shldrDrop}`,
    `C ${shldr+s(10)},${r(ahD*0.42)} ${halfChest},${r(ahD*0.8)} ${halfChest},${ahD}`,
    `L ${halfChest},${bodyLen}`,
    `L 0,${bodyLen} Z`,
  ])
  const backSeam = insetRect(0, neckDB, halfChest, bodyLen, sa)

  // 長袖パス
  const slvCut = pts([
    `M 0,${capH}`,
    `C ${r(slvTop*0.15)},${r(capH*0.18)} ${r(slvTop*0.42)},0 ${r(slvTop/2)},0`,
    `C ${r(slvTop*0.58)},0 ${r(slvTop*0.85)},${r(capH*0.18)} ${slvTop},${capH}`,
    `L ${slvTop-sideOff},${slvLen}`,
    `L ${sideOff},${slvLen} Z`,
  ])
  const slvSeam = insetRect(sideOff, capH, slvTop-sideOff, slvLen, sa)

  // 衿台（collar stand）
  const standCut = pts([
    `M 0,0 L ${collarW},0`,
    `Q ${collarW},${standH} ${collarW-sa},${standH}`,
    `L ${sa},${standH}`,
    `Q 0,${standH} 0,0 Z`,
  ])

  // 上衿（collar）
  const colCut = pts([
    `M 0,0 L ${collarW},0`,
    `Q ${collarW+sa},${collarH*0.5} ${collarW},${collarH}`,
    `L 0,${collarH} Q ${-sa},${collarH*0.5} 0,0 Z`,
  ])

  // カフ
  const cuffCut = `M 0,0 L ${cuff},0 L ${cuff},${cuffH} L 0,${cuffH} Z`

  const ps=[
    { ...panel('front','前身頃','わで1枚裁断（CF折り）',0,0,halfChest,bodyLen,frontCut,frontSeam,
        {x:halfChest/2,y1:bodyLen*0.22,y2:bodyLen*0.78},'CF',[
          hDim(0,halfChest,bodyLen+18,`½胸囲 ${d.chest/2}`),
          vDim(halfChest+18,0,bodyLen,`着丈 ${d.length}`),
        ]), extra:[{type:'dash',d:placketLine,label:'前立て'}] },
    panel('back','後身頃','わで1枚裁断（CB折り）',0,0,halfChest,bodyLen,backCut,backSeam,
      {x:halfChest/2,y1:bodyLen*0.22,y2:bodyLen*0.78},'CB',[
        hDim(0,halfChest,bodyLen+18,`½胸囲 ${d.chest/2}`),
      ]),
    panel('sleeve','袖（長袖）','2枚裁断',0,0,slvTop,slvLen,slvCut,slvSeam,
      {x:slvTop/2,y1:slvLen*0.3,y2:slvLen*0.75},null,[
        vDim(slvTop+18,capH,slvLen,`袖丈 ${d.sleeve}`),
      ]),
    panel('collarStand','衿台','2枚裁断',0,0,collarW,standH,standCut,
      insetRect(0,0,collarW,standH,sa),{x:collarW/2,y1:standH*0.3,y2:standH*0.7},null,[
        hDim(0,collarW,standH+14,`衿幅 ${d.collarW/2}`),
      ]),
    panel('collar','上衿','2枚裁断',0,0,collarW,collarH,colCut,
      insetRect(0,0,collarW,collarH,sa),{x:collarW/2,y1:collarH*0.3,y2:collarH*0.7},null,[]),
    panel('cuff','カフ','4枚裁断',0,0,cuff,cuffH,cuffCut,
      insetRect(0,0,cuff,cuffH,sa),{x:cuff/2,y1:cuffH*0.3,y2:cuffH*0.7},null,[
        hDim(0,cuff,cuffH+14,`カフ幅 ${d.cuff}`),
      ]),
  ]
  const { totalW, totalH } = applyVerticalLayout(ps)
  return { itemType:'shirt', size, raw:d,
    notice:'縫い代10mm。前後身頃はわで裁断。袖2枚。衿台・上衿各2枚。カフ4枚（縫い合わせ）。',
    panels:ps, totalW, totalH }
}

// ── ワンピース ────────────────────────────────────────────────────────────────
function buildDress(d, s, size) {
  const sa = s(SEAM)
  const halfChest = s(d.chest/2), bodiceLen = s(d.bodiceLen)
  const shldr = s(d.shoulder/2), shldrDrop = s(d.shldrDrop)
  const neckW = s(d.neck/2), neckDF = s(d.neckDepthF), neckDB = s(d.neckDepthB)
  const ahD = s(d.armhole)
  const skirtLen = s(d.skirtLen)
  const halfWaist = s(d.halfWaist), halfHip = s(d.halfHip)
  const slvLen = s(d.sleeve), slvTop = s(d.sleeveWidth), cuff = s(d.cuff)
  const capH = Math.round(ahD*0.33), sideOff = Math.round((slvTop-cuff)/2)

  // ボディス前（胸から腰まで）
  const bodFrontCut = pts([
    `M 0,${neckDF}`,
    `Q ${r(neckW*0.45)},${r(neckDF*0.1)} ${neckW},0`,
    `L ${shldr},${shldrDrop}`,
    `C ${shldr+s(10)},${r(ahD*0.42)} ${halfChest},${r(ahD*0.8)} ${halfChest},${ahD}`,
    `L ${halfChest},${bodiceLen}`,
    `L 0,${bodiceLen} Z`,
  ])
  const bodFrontSeam = insetRect(0,neckDF,halfChest,bodiceLen,sa)

  const bodBackCut = pts([
    `M 0,${neckDB}`,
    `Q ${r(neckW*0.45)},${r(neckDB*0.15)} ${neckW},0`,
    `L ${shldr},${shldrDrop}`,
    `C ${shldr+s(10)},${r(ahD*0.42)} ${halfChest},${r(ahD*0.8)} ${halfChest},${ahD}`,
    `L ${halfChest},${bodiceLen}`,
    `L 0,${bodiceLen} Z`,
  ])
  const bodBackSeam = insetRect(0,neckDB,halfChest,bodiceLen,sa)

  // スカート前（Aライン）
  const skirtFrontCut = pts([
    `M 0,0`,
    `L ${halfWaist},0`,
    `C ${halfWaist+s(10)},${r(skirtLen*0.3)} ${halfHip},${r(skirtLen*0.5)} ${halfHip},${skirtLen}`,
    `L 0,${skirtLen} Z`,
  ])
  const skirtFrontSeam = pts([
    `M ${sa},${sa}`,
    `L ${halfWaist-sa},${sa}`,
    `C ${halfWaist+s(8)},${r(skirtLen*0.3)} ${halfHip-sa},${r(skirtLen*0.5)} ${halfHip-sa},${skirtLen-sa}`,
    `L ${sa},${skirtLen-sa} Z`,
  ])

  const skirtBackCut  = skirtFrontCut
  const skirtBackSeam = skirtFrontSeam

  // 半袖パス
  const slvCut = pts([
    `M 0,${capH}`,
    `C ${r(slvTop*0.15)},${r(capH*0.18)} ${r(slvTop*0.42)},0 ${r(slvTop/2)},0`,
    `C ${r(slvTop*0.58)},0 ${r(slvTop*0.85)},${r(capH*0.18)} ${slvTop},${capH}`,
    `L ${slvTop-sideOff},${slvLen}`,
    `L ${sideOff},${slvLen} Z`,
  ])
  const slvSeam = insetRect(sideOff,capH,slvTop-sideOff,slvLen,sa)

  const ps=[
    panel('bodFront','ボディス前','わで1枚裁断',0,0,halfChest,bodiceLen,bodFrontCut,bodFrontSeam,
      {x:halfChest/2,y1:bodiceLen*0.3,y2:bodiceLen*0.75},'CF',[
        vDim(halfChest+18,0,bodiceLen,`胴丈 ${d.bodiceLen}`),
      ]),
    panel('bodBack','ボディス後','わで1枚裁断',0,0,halfChest,bodiceLen,bodBackCut,bodBackSeam,
      {x:halfChest/2,y1:bodiceLen*0.3,y2:bodiceLen*0.75},'CB',[]),
    panel('skirtFront','スカート前','わで1枚裁断',0,0,halfHip,skirtLen,skirtFrontCut,skirtFrontSeam,
      {x:halfHip*0.4,y1:skirtLen*0.25,y2:skirtLen*0.75},'CF',[
        hDim(0,halfWaist,-16,`½ウエスト ${d.halfWaist}`),
        hDim(0,halfHip,skirtLen+18,`½ヒップ ${d.halfHip}`),
        vDim(halfHip+18,0,skirtLen,`スカート丈 ${d.skirtLen}`),
      ]),
    panel('skirtBack','スカート後','わで1枚裁断',0,0,halfHip,skirtLen,skirtBackCut,skirtBackSeam,
      {x:halfHip*0.4,y1:skirtLen*0.25,y2:skirtLen*0.75},'CB',[]),
    panel('sleeve','袖','2枚裁断',0,0,slvTop,slvLen,slvCut,slvSeam,
      {x:slvTop/2,y1:slvLen*0.3,y2:slvLen*0.75},null,[
        vDim(slvTop+18,capH,slvLen,`袖丈 ${d.sleeve}`),
      ]),
  ]
  const { totalW, totalH } = applyVerticalLayout(ps)
  return { itemType:'dress', size, raw:d,
    notice:'縫い代10mm。ボディス前後はわで裁断。スカート前後はわで裁断。袖2枚。',
    panels:ps, totalW, totalH }
}

// ── スカート ──────────────────────────────────────────────────────────────────
function buildSkirt(d, s, size) {
  const sa = s(SEAM)
  const halfWaist = s(d.halfWaist), halfHip = s(d.halfHip)
  const skirtLen = s(d.length), wbH = s(d.waistbandH)

  const skirtCut = pts([
    `M 0,0`,
    `L ${halfWaist},0`,
    `C ${halfWaist+s(12)},${r(skirtLen*0.3)} ${halfHip},${r(skirtLen*0.5)} ${halfHip},${skirtLen}`,
    `L 0,${skirtLen} Z`,
  ])
  const skirtSeam = pts([
    `M ${sa},${sa}`,
    `L ${halfWaist-sa},${sa}`,
    `C ${halfWaist+s(10)},${r(skirtLen*0.3)} ${halfHip-sa},${r(skirtLen*0.5)} ${halfHip-sa},${skirtLen-sa}`,
    `L ${sa},${skirtLen-sa} Z`,
  ])

  const wbCut  = `M 0,0 L ${halfWaist*2},0 L ${halfWaist*2},${wbH} L 0,${wbH} Z`
  const wbSeam = insetRect(0,0,halfWaist*2,wbH,sa)

  const ps=[
    panel('front','スカート前','わで1枚裁断',0,0,halfHip,skirtLen,skirtCut,skirtSeam,
      {x:halfHip*0.4,y1:skirtLen*0.25,y2:skirtLen*0.75},'CF',[
        hDim(0,halfWaist,-16,`½ウエスト ${d.halfWaist}`),
        hDim(0,halfHip,skirtLen+18,`½ヒップ ${d.halfHip}`),
        vDim(halfHip+18,0,skirtLen,`スカート丈 ${d.length}`),
      ]),
    panel('back','スカート後','わで1枚裁断',0,0,halfHip,skirtLen,skirtCut,skirtSeam,
      {x:halfHip*0.4,y1:skirtLen*0.25,y2:skirtLen*0.75},'CB',[]),
    panel('waistband','ウエストベルト','1枚裁断（折り）',0,0,halfWaist*2,wbH,wbCut,wbSeam,
      {x:halfWaist,y1:wbH*0.2,y2:wbH*0.8},null,[
        hDim(0,halfWaist*2,wbH+14,`ウエスト ${d.halfWaist*2}`),
      ]),
  ]
  const { totalW, totalH } = applyVerticalLayout(ps)
  return { itemType:'skirt', size, raw:d,
    notice:'縫い代10mm。前後スカートはわで裁断。ウエストベルト1枚（折り）。',
    panels:ps, totalW, totalH }
}

// ── ズボン ────────────────────────────────────────────────────────────────────
function buildPants(d, s, size) {
  const sa = s(SEAM)
  const halfWaist = s(d.halfWaist), halfHip = s(d.halfHip)
  const rise = s(d.rise), inseam = s(d.inseam)
  const halfLeg = s(d.halfLeg), halfHem = s(d.halfHem)
  const extF = s(d.crotchExtF), extB = s(d.crotchExtB)
  const wbH = s(d.waistbandH)
  const totalLen = rise + inseam

  // 前パンツ（CF折り）
  const frontCut = pts([
    `M 0,0`,
    `L ${halfWaist},0`,
    `C ${halfWaist+s(8)},${r(rise*0.4)} ${halfHip},${r(rise*0.7)} ${halfHip},${rise}`,
    `L ${halfLeg},${totalLen}`,
    `L ${halfLeg-halfHem},${totalLen}`,
    `L ${extF},${rise+s(10)}`,
    `Q ${r(extF*0.5)},${r(rise*0.6)} 0,0 Z`,
  ])
  const frontSeam = pts([
    `M ${sa},${sa}`,
    `L ${halfWaist-sa},${sa}`,
    `C ${halfWaist+s(6)},${r(rise*0.4)} ${halfHip-sa},${r(rise*0.7)} ${halfHip-sa},${rise}`,
    `L ${halfLeg-sa},${totalLen-sa}`,
    `L ${halfLeg-halfHem+sa},${totalLen-sa}`,
    `L ${extF+sa},${rise+s(12)}`,
    `Q ${r(extF*0.6)},${r(rise*0.62)} ${sa},${sa} Z`,
  ])

  // 後パンツ（CB折り）—— 股繰りが前より広い
  const backCut = pts([
    `M 0,0`,
    `L ${halfWaist+s(10)},0`,
    `C ${halfWaist+s(20)},${r(rise*0.35)} ${halfHip+s(10)},${r(rise*0.65)} ${halfHip+s(10)},${rise}`,
    `L ${halfLeg+s(5)},${totalLen}`,
    `L ${halfLeg-halfHem+s(5)},${totalLen}`,
    `L ${extB},${rise+s(15)}`,
    `Q ${r(extB*0.4)},${r(rise*0.5)} 0,${r(rise*0.15)}`,
    `L 0,0 Z`,
  ])
  const backSeam = pts([
    `M ${sa},${sa}`,
    `L ${halfWaist+s(8)},${sa}`,
    `C ${halfWaist+s(16)},${r(rise*0.35)} ${halfHip+s(8)},${r(rise*0.65)} ${halfHip+s(8)},${rise}`,
    `L ${halfLeg+s(3)},${totalLen-sa}`,
    `L ${halfLeg-halfHem+s(7)},${totalLen-sa}`,
    `L ${extB+sa},${rise+s(18)}`,
    `Q ${r(extB*0.5)},${r(rise*0.55)} ${sa},${r(rise*0.15)}`,
    `L ${sa},${sa} Z`,
  ])

  const wbCut  = `M 0,0 L ${halfWaist*2},0 L ${halfWaist*2},${wbH} L 0,${wbH} Z`
  const wbSeam = insetRect(0,0,halfWaist*2,wbH,sa)

  const ps=[
    panel('front','前パンツ','わで1枚裁断（CF折り）',0,0,halfHip+extF,totalLen,frontCut,frontSeam,
      {x:halfHip*0.45,y1:totalLen*0.2,y2:totalLen*0.75},'CF',[
        vDim(halfHip+extF+18,0,totalLen,`股上+股下 ${d.rise+d.inseam}`),
        hDim(0,halfWaist,-16,`½ウエスト ${d.halfWaist}`),
      ]),
    panel('back','後パンツ','わで1枚裁断（CB折り）',0,0,halfHip+s(12)+extB,totalLen,backCut,backSeam,
      {x:halfHip*0.45,y1:totalLen*0.2,y2:totalLen*0.75},'CB',[
        vDim(halfHip+s(12)+extB+18,0,totalLen,`股上+股下 ${d.rise+d.inseam}`),
      ]),
    panel('waistband','ウエストベルト','1枚裁断（折り）',0,0,halfWaist*2,wbH,wbCut,wbSeam,
      {x:halfWaist,y1:wbH*0.2,y2:wbH*0.8},null,[
        hDim(0,halfWaist*2,wbH+14,`ウエスト ${d.halfWaist*2}`),
      ]),
  ]
  const { totalW, totalH } = applyVerticalLayout(ps)
  return { itemType:'pants', size, raw:d,
    notice:'縫い代10mm。前後パンツはわで裁断。ウエストベルト1枚。',
    panels:ps, totalW, totalH }
}

// ── パネルオブジェクト生成ヘルパー ──────────────────────────────────────────────
function panel(id, title, subtitle, x, y, w, h, cutPath, seamPath, grain, fold, dims) {
  return { id, title, subtitle, x, y, w, h, cutPath, seamPath, grain, fold, dims }
}

// ── SVGパスヘルパー ────────────────────────────────────────────────────────────
const r = Math.round
const pts = a => a.join(' ')

// 矩形内側縫い代パス
function insetRect(x, y, w, h, sa) {
  const ix=x+sa, iy=y+sa, iw=w-sa*2, ih=h-sa*2
  return `M ${ix},${iy} L ${ix+iw},${iy} L ${ix+iw},${iy+ih} L ${ix},${iy+ih} Z`
}

// 寸法注記ヘルパー
function hDim(x1, x2, y, label) { return { axis:'h', x1, x2, y, label } }
function vDim(x, y1, y2, label)  { return { axis:'v', x, y1, y2, label } }
