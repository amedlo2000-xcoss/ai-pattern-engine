import { Suspense, useEffect, useMemo, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, useGLTF } from '@react-three/drei'
import * as THREE from 'three'

const MODELS = {
  tshirt:  '/models/black-tshirt.glb',
  shirt:   '/models/white-shirt.glb',
  dress:   '/models/dress.glb',
  skirt:   '/models/skirt.glb',
  pants:   '/models/pants.glb',
  jacket:  '/models/jacket.glb',
  hoodie:  '/models/hoodie.glb',
  shorts:  '/models/shorts.glb',
}

function GarmentModel({ itemType, color }) {
  const path = MODELS[itemType] || MODELS.tshirt
  const { scene } = useGLTF(path)

  const clonedScene = useMemo(() => {
    const clone = scene.clone(true)
    console.log('[ModelViewer] loading:', path)
    return clone
  }, [path])

  useEffect(() => {
    clonedScene.traverse((child) => {
      if (child.isMesh) {
        child.visible = true
        child.material = new THREE.MeshStandardMaterial({
          color,
          roughness: 0.8,
          metalness: 0,
          side: THREE.DoubleSide,
        })
      }
    })
  }, [clonedScene, color])

  const { scale, position } = useMemo(() => {
    // ワールドマトリクスを更新してから計算
    clonedScene.updateMatrixWorld(true)

    // メッシュジオメトリのみでバウンディングボックスを計算
    // （ボーン・スケルトン・ヘルパー等を除外）
    const box = new THREE.Box3()
    clonedScene.traverse((child) => {
      if (child.isMesh && child.geometry) {
        const geomBox = new THREE.Box3().setFromBufferAttribute(
          child.geometry.attributes.position
        )
        geomBox.applyMatrix4(child.matrixWorld)
        box.union(geomBox)
      }
    })

    if (box.isEmpty()) {
      console.warn('[ModelViewer] empty bounding box for', path, '— using fallback scale')
      return { scale: 1, position: [0, 0, 0] }
    }

    const sz = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const maxDim = Math.max(sz.x, sz.y, sz.z)

    if (!isFinite(maxDim) || maxDim === 0) {
      console.warn('[ModelViewer] degenerate bounds for', path, sz)
      return { scale: 1, position: [0, 0, 0] }
    }

    const s = 1.4 / maxDim
    console.log('[ModelViewer]', path, '| maxDim:', maxDim.toFixed(3), '| scale:', s.toFixed(3))
    return { scale: s, position: [-center.x * s, -center.y * s, -center.z * s] }
  }, [clonedScene])

  return <primitive object={clonedScene} scale={scale} position={position} />
}

Object.values(MODELS).forEach(p => useGLTF.preload(p))

export default function ModelViewer({ itemType, color, baseColor }) {
  const modelColor = color || baseColor || '#e0e0e0'

  const [modelKey, setModelKey] = useState(itemType)
  useEffect(() => {
    setModelKey(itemType + '_' + Date.now())
  }, [itemType])

  return (
    <div className="glass-panel viewer-panel">
      <div className="canvas-wrap">
        <Canvas camera={{ position: [0, 0, 2.5], fov: 45 }}>
          <ambientLight intensity={0.8} />
          <directionalLight position={[3, 5, 3]} intensity={2.0} />
          <directionalLight position={[-3, 2, -2]} intensity={0.8} />
          <Environment preset="studio" />
          <Suspense fallback={null}>
            <GarmentModel key={modelKey} itemType={itemType} color={modelColor} />
          </Suspense>
          <OrbitControls enablePan={false} minDistance={1.0} maxDistance={4.0} />
        </Canvas>
      </div>
    </div>
  )
}
