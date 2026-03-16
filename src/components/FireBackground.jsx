import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

const isLowEnd = (() => {
  if (prefersReducedMotion) return true
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection
  if (conn) {
    if (conn.saveData) return true
    if (conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g') return true
  }
  if (navigator.deviceMemory && navigator.deviceMemory <= 2) return true
  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) return true
  return false
})()

const createDiamondTexture = () => {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d')

  if (!context) {
    return null
  }

  context.clearRect(0, 0, size, size)
  const gradient = context.createRadialGradient(size * 0.5, size * 0.5, size * 0.12, size * 0.5, size * 0.5, size * 0.58)
  gradient.addColorStop(0, 'rgba(255, 247, 236, 0.95)')
  gradient.addColorStop(0.38, 'rgba(255, 205, 148, 0.95)')
  gradient.addColorStop(1, 'rgba(255, 141, 65, 0)')

  context.fillStyle = gradient
  context.beginPath()
  context.moveTo(size * 0.5, size * 0.08)
  context.lineTo(size * 0.9, size * 0.5)
  context.lineTo(size * 0.5, size * 0.92)
  context.lineTo(size * 0.1, size * 0.5)
  context.closePath()
  context.fill()

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true

  return texture
}

function FireBackground() {
  const mountRef = useRef(null)

  useEffect(() => {
    if (prefersReducedMotion) return undefined

    const mount = mountRef.current
    if (!mount) {
      return undefined
    }

    const scene = new THREE.Scene()
    scene.fog = new THREE.Fog(0x050201, 6, 24)

    const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100)
    camera.position.z = 11

    const renderer = new THREE.WebGLRenderer({ antialias: !isLowEnd, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isLowEnd ? 1.0 : 1.7))
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setClearColor(0x000000, 0)
    mount.appendChild(renderer.domElement)

    const diamondTexture = createDiamondTexture()
    const particleCount = isLowEnd ? 320 : 1200
    const positions = new Float32Array(particleCount * 3)

    for (let index = 0; index < particleCount; index += 1) {
      const i3 = index * 3
      positions[i3] = (Math.random() - 0.5) * 22
      positions[i3 + 1] = (Math.random() - 0.5) * 16
      positions[i3 + 2] = (Math.random() - 0.5) * 10
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    const material = new THREE.PointsMaterial({
      size: 0.22,
      transparent: true,
      opacity: 0.82,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
      map: diamondTexture,
      alphaTest: 0.15,
    })

    const colors = new Float32Array(particleCount * 3)
    const low = new THREE.Color(0xff4b1f)
    const high = new THREE.Color(0xffb347)

    for (let index = 0; index < particleCount; index += 1) {
      const i3 = index * 3
      const mixed = low.clone().lerp(high, Math.random())
      colors[i3] = mixed.r
      colors[i3 + 1] = mixed.g
      colors[i3 + 2] = mixed.b
    }

    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    const points = new THREE.Points(geometry, material)
    scene.add(points)

    const glowGeometry = new THREE.SphereGeometry(5.7, 32, 32)
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xff4d00,
      transparent: true,
      opacity: 0.08,
    })
    const glow = new THREE.Mesh(glowGeometry, glowMaterial)
    glow.position.set(0, 0, -4)
    scene.add(glow)

    let frameId = 0
    let running = true

    const animate = () => {
      if (!running) return
      frameId = requestAnimationFrame(animate)
      const time = performance.now() * 0.0002

      points.rotation.y = time * 0.9
      points.rotation.x = Math.sin(time * 1.2) * 0.07

      const attr = geometry.attributes.position
      for (let index = 0; index < particleCount; index += 1) {
        const i3 = index * 3
        const drift = Math.sin(time * 10 + index * 0.06) * 0.0022
        attr.array[i3 + 1] += drift

        if (attr.array[i3 + 1] > 8.5) {
          attr.array[i3 + 1] = -8.5
        }
      }
      attr.needsUpdate = true

      renderer.render(scene, camera)
    }

    const handleVisibility = () => {
      if (document.hidden) {
        running = false
        cancelAnimationFrame(frameId)
      } else {
        running = true
        animate()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    animate()

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, isLowEnd ? 1.0 : 1.7))
    }

    window.addEventListener('resize', handleResize)

    return () => {
      running = false
      cancelAnimationFrame(frameId)
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('resize', handleResize)
      geometry.dispose()
      material.dispose()
      glowGeometry.dispose()
      glowMaterial.dispose()
      if (diamondTexture) {
        diamondTexture.dispose()
      }
      renderer.dispose()
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement)
      }
    }
  }, [])

  if (prefersReducedMotion) return null
  return <div className="fire-canvas" ref={mountRef} aria-hidden="true" />
}

export default FireBackground
