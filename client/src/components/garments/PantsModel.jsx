import { useMemo } from 'react'
import * as THREE from 'three'

const CROTCH_EXT = { depth: 0.14, bevelEnabled: false }

export default function PantsModel({ color = '#e0e0e0', opacity = 1 }) {
  const mat = {
    color, roughness: 0.88, metalness: 0,
    clearcoat: 0.08, clearcoatRoughness: 0.5,
    side: THREE.DoubleSide, transparent: true, opacity,
  }

  // 股上：台形＋股ぐりQuadraticCurve
  const crotchShape = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(-0.22, 0)
    s.lineTo(-0.22, 0.30)
    s.lineTo( 0.22, 0.30)
    s.lineTo( 0.22, 0)
    s.quadraticCurveTo( 0.10, -0.08,  0, -0.08)
    s.quadraticCurveTo(-0.10, -0.08, -0.22, 0)
    return s
  }, [])

  // 左脚カーブ
  const leftCurve = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.11,  0.00, 0),
    new THREE.Vector3(-0.11, -0.20, 0.01),
    new THREE.Vector3(-0.11, -0.45, 0),
  ]), [])

  // 右脚カーブ
  const rightCurve = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3( 0.11,  0.00, 0),
    new THREE.Vector3( 0.11, -0.20, 0.01),
    new THREE.Vector3( 0.11, -0.45, 0),
  ]), [])

  return (
    <group>
      {/* 股上パーツ */}
      <mesh position={[0, 0, -0.07]}>
        <extrudeGeometry args={[crotchShape, CROTCH_EXT]} />
        <meshPhysicalMaterial {...mat} />
      </mesh>
      {/* 左脚 */}
      <mesh>
        <tubeGeometry args={[leftCurve, 20, 0.11, 12, false]} />
        <meshPhysicalMaterial {...mat} />
      </mesh>
      {/* 右脚 */}
      <mesh>
        <tubeGeometry args={[rightCurve, 20, 0.11, 12, false]} />
        <meshPhysicalMaterial {...mat} />
      </mesh>
    </group>
  )
}
