import { useMemo } from 'react'
import * as THREE from 'three'

const BODY_EXT   = { depth: 0.11, bevelEnabled: false }
const SLEEVE_EXT = { depth: 0.09, bevelEnabled: false }
const COLLAR_EXT = { depth: 0.02, bevelEnabled: false }

export default function ShirtModel({ color = '#e0e0e0', opacity = 1 }) {
  const mat = {
    color, roughness: 0.88, metalness: 0,
    clearcoat: 0.08, clearcoatRoughness: 0.5,
    side: THREE.DoubleSide, transparent: true, opacity,
  }

  // 胴体：Tシャツと同形状（depth=0.11）
  const bodyShape = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(-0.26, -0.32)
    s.lineTo(-0.26,  0.10)
    s.quadraticCurveTo(-0.26, 0.28, -0.18, 0.30)
    s.lineTo(-0.26,  0.30)
    s.lineTo(-0.10,  0.32)
    s.quadraticCurveTo(0, 0.36, 0.10, 0.32)
    s.lineTo( 0.26,  0.30)
    s.quadraticCurveTo(0.26, 0.28, 0.26, 0.10)
    s.lineTo( 0.26, -0.32)
    s.lineTo(-0.26, -0.32)
    return s
  }, [])

  // 長袖：Tシャツ袖の2倍（0.22→0.38）
  const sleeveShape = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(0,    0)
    s.lineTo(0.38,  0.04)
    s.lineTo(0.38, -0.10)
    s.lineTo(0,   -0.13)
    s.lineTo(0,    0)
    return s
  }, [])

  // 襟：尖った形状
  const collarShape = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(-0.08, 0)
    s.lineTo(0, -0.12)
    s.lineTo(0.08, 0)
    s.lineTo(0.04, 0.06)
    s.lineTo(0, 0.02)
    s.lineTo(-0.04, 0.06)
    s.lineTo(-0.08, 0)
    return s
  }, [])

  return (
    <group>
      {/* 胴体 */}
      <mesh position={[0, 0, -0.055]}>
        <extrudeGeometry args={[bodyShape, BODY_EXT]} />
        <meshPhysicalMaterial {...mat} />
      </mesh>
      {/* 左袖 */}
      <mesh position={[-0.26, 0.18, -0.045]} scale={[-1, 1, 1]}>
        <extrudeGeometry args={[sleeveShape, SLEEVE_EXT]} />
        <meshPhysicalMaterial {...mat} />
      </mesh>
      {/* 右袖 */}
      <mesh position={[0.26, 0.18, -0.045]}>
        <extrudeGeometry args={[sleeveShape, SLEEVE_EXT]} />
        <meshPhysicalMaterial {...mat} />
      </mesh>
      {/* 襟 */}
      <mesh position={[0, 0.28, 0.06]}>
        <extrudeGeometry args={[collarShape, COLLAR_EXT]} />
        <meshPhysicalMaterial {...mat} />
      </mesh>
    </group>
  )
}
