import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { motion, AnimatePresence } from 'framer-motion'
import { type AgentState } from '@/store/voiceStore'

interface Props {
  state: AgentState
  audioLevel: number
  agentLevel: number
}

type OrbAgentState = null | 'thinking' | 'listening' | 'talking'

// ── State label config ─────────────────────────────────────────────────────────

const STATE_LABEL: Record<AgentState, string> = {
  idle:         'Ready',
  connecting:   'Connecting…',
  initializing: 'Starting…',
  listening:    'Listening',
  thinking:     'Thinking…',
  speaking:     'Speaking',
  disconnected: 'Ended',
}

// ── Orb wrapper exposed to the page ──────────────────────────────────────────

export function OrbAnimation({ state, audioLevel, agentLevel }: Props) {
  const active = state !== 'idle' && state !== 'disconnected'
  const orbState = toOrbState(state, active)
  const label = STATE_LABEL[state]
  const isListening = state === 'listening'

  const agentVolume = clamp01(agentLevel * 0.9)
  const micVolume   = clamp01(audioLevel  * 0.95)

  const manualOutput = active
    ? Math.max(state === 'speaking' ? 0.34 : 0.22, agentVolume)
    : 0.16
  const manualInput = active && state === 'listening'
    ? Math.max(0.2, micVolume)
    : state === 'thinking' ? 0.16 : 0.04

  const scale = 1 + Math.max(agentVolume, micVolume) * 0.025

  return (
    <div className="flex flex-col items-center gap-0 select-none">
      {/* Orb container */}
      <div
        style={{
          position: 'relative',
          width: 'var(--orb-size, 240px)',
          height: 'var(--orb-size, 240px)',
          flexShrink: 0,
          borderRadius: '50%',
          transform: active ? `scale(${scale})` : 'scale(1)',
          transition: 'transform 120ms ease',
        }}
      >
        {/* Ambient glow */}
        {active && (
          <div
            style={{
              position: 'absolute',
              inset: -10,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(124,58,237,0.55) 0%, rgba(96,165,250,0.2) 60%, transparent 100%)',
              filter: 'blur(18px)',
              opacity: 0.9,
            }}
          />
        )}

        {/* Outer ring */}
        <div
          style={{
            position: 'absolute',
            inset: -8,
            borderRadius: '50%',
            border: '1.5px solid rgba(139,92,246,0.5)',
            boxShadow: '0 0 18px rgba(124,58,237,0.25)',
            pointerEvents: 'none',
          }}
        />

        {/* Canvas orb */}
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', overflow: 'hidden' }}>
          <ShaderOrb
            agentState={orbState}
            manualInput={manualInput}
            manualOutput={manualOutput}
          />
        </div>
      </div>

      {/* Label */}
      <AnimatePresence mode="wait">
        <motion.div
          key={state}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.25 }}
          className="mt-8 flex items-center gap-1.5"
        >
          <span className="text-sm font-medium text-slate-400 tracking-wide">{label}</span>
          {isListening && (
            <span className="inline-flex gap-0.5 ml-1">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="inline-block w-0.5 h-3 rounded-full bg-violet-400"
                  animate={{ scaleY: [0.3, 1, 0.3] }}
                  transition={{ duration: 0.8, delay: i * 0.15, repeat: Infinity }}
                />
              ))}
            </span>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// ── Canvas wrapper ─────────────────────────────────────────────────────────────

function ShaderOrb({
  agentState,
  manualInput,
  manualOutput,
}: {
  agentState: OrbAgentState
  manualInput: number
  manualOutput: number
}) {
  return (
    <Canvas
      resize={{ debounce: 100 }}
      gl={{ alpha: true, antialias: true, premultipliedAlpha: true }}
      style={{ width: '100%', height: '100%' }}
    >
      <OrbScene
        agentState={agentState}
        manualInput={manualInput}
        manualOutput={manualOutput}
      />
    </Canvas>
  )
}

// ── Three.js scene ─────────────────────────────────────────────────────────────

function OrbScene({
  agentState,
  manualInput,
  manualOutput,
}: {
  agentState: OrbAgentState
  manualInput: number
  manualOutput: number
}) {
  const { gl } = useThree()
  const meshRef = useRef<THREE.Mesh<THREE.CircleGeometry, THREE.ShaderMaterial>>(null)
  const agentRef   = useRef<OrbAgentState>(agentState)
  const curInRef   = useRef(0)
  const curOutRef  = useRef(0)
  const animSpeedRef = useRef(0.12)

  useEffect(() => { agentRef.current = agentState }, [agentState])

  const seed = 20260416
  const random = useMemo(() => splitmix32(seed), [])
  const offsets = useMemo(
    () => new Float32Array(Array.from({ length: 7 }, () => random() * Math.PI * 2)),
    [random],
  )

  const noiseTexture = useMemo(() => createNoiseTexture(seed), [])
  useEffect(() => () => noiseTexture.dispose(), [noiseTexture])

  // Brand violet/blue palette instead of yellow
  const COLOR1 = '#7c3aed'  // violet-600
  const COLOR2 = '#60a5fa'  // blue-400

  const uniforms = useMemo(() => ({
    uColor1:        new THREE.Uniform(new THREE.Color(COLOR1)),
    uColor2:        new THREE.Uniform(new THREE.Color(COLOR2)),
    uOffsets:       { value: offsets },
    uPerlinTexture: new THREE.Uniform(noiseTexture),
    uTime:          new THREE.Uniform(0),
    uAnimation:     new THREE.Uniform(0.12),
    uInverted:      new THREE.Uniform(1),   // dark mode
    uInputVolume:   new THREE.Uniform(0),
    uOutputVolume:  new THREE.Uniform(0),
    uOpacity:       new THREE.Uniform(0),
  }), [noiseTexture, offsets])

  // WebGL context lost recovery
  useEffect(() => {
    const canvas = gl.domElement
    const onLost = (e: Event) => { e.preventDefault(); setTimeout(() => gl.forceContextRestore(), 1) }
    canvas.addEventListener('webglcontextlost', onLost, false)
    return () => canvas.removeEventListener('webglcontextlost', onLost, false)
  }, [gl])

  useFrame((_, delta) => {
    const mat = meshRef.current?.material
    if (!mat) return
    const u = mat.uniforms

    u.uTime.value += delta * 0.55
    if (u.uOpacity.value < 1) u.uOpacity.value = Math.min(1, u.uOpacity.value + delta * 2)

    const targetIn  = clamp01(manualInput)
    const targetOut = clamp01(manualOutput)
    curInRef.current  += (targetIn  - curInRef.current)  * 0.025
    curOutRef.current += (targetOut - curOutRef.current) * 0.025

    const targetSpeed = 0.1 + (1 - Math.pow(curOutRef.current - 1, 2)) * 0.24
    animSpeedRef.current += (targetSpeed - animSpeedRef.current) * 0.05

    u.uAnimation.value    += delta * animSpeedRef.current
    u.uInputVolume.value   = curInRef.current
    u.uOutputVolume.value  = curOutRef.current
  })

  return (
    <mesh ref={meshRef}>
      <circleGeometry args={[4.2, 64]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
      />
    </mesh>
  )
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function toOrbState(state: AgentState, active: boolean): OrbAgentState {
  if (!active) return null
  if (state === 'speaking')                       return 'talking'
  if (state === 'listening')                      return 'listening'
  if (state === 'thinking' || state === 'initializing') return 'thinking'
  return null
}

function clamp01(n: number) {
  if (!Number.isFinite(n)) return 0
  return Math.min(1, Math.max(0, n))
}

function splitmix32(a: number) {
  return function () {
    a |= 0
    a = (a + 0x9e3779b9) | 0
    let t = a ^ (a >>> 16)
    t = Math.imul(t, 0x21f0aaad)
    t = t ^ (t >>> 15)
    t = Math.imul(t, 0x735a2d97)
    return ((t = t ^ (t >>> 15)) >>> 0) / 4294967296
  }
}

function createNoiseTexture(seed: number) {
  const size = 128
  const rng = splitmix32(seed)
  const gridSize = 16
  const grid = Array.from({ length: gridSize * gridSize }, () => rng())
  const data = new Uint8Array(size * size * 4)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const gx = (x / size) * gridSize
      const gy = (y / size) * gridSize
      const x0 = Math.floor(gx) % gridSize
      const y0 = Math.floor(gy) % gridSize
      const x1 = (x0 + 1) % gridSize
      const y1 = (y0 + 1) % gridSize
      const tx = smoothstep(gx - Math.floor(gx))
      const ty = smoothstep(gy - Math.floor(gy))
      const v = lerp(
        lerp(grid[y0 * gridSize + x0], grid[y0 * gridSize + x1], tx),
        lerp(grid[y1 * gridSize + x0], grid[y1 * gridSize + x1], tx),
        ty,
      )
      const b = Math.floor(v * 255)
      const i = (y * size + x) * 4
      data[i] = b; data[i+1] = b; data[i+2] = b; data[i+3] = 255
    }
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.magFilter = tex.minFilter = THREE.LinearFilter
  tex.needsUpdate = true
  return tex
}

function smoothstep(v: number) { return v * v * (3 - 2 * v) }
function lerp(a: number, b: number, t: number) { return a + (b - a) * t }

// ── Shaders (identical to reference, color ramp uses brand colors) ─────────────

const vertexShader = /* glsl */`
uniform float uTime;
uniform sampler2D uPerlinTexture;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const fragmentShader = /* glsl */`
uniform float uTime;
uniform float uAnimation;
uniform float uInverted;
uniform float uOffsets[7];
uniform vec3  uColor1;
uniform vec3  uColor2;
uniform float uInputVolume;
uniform float uOutputVolume;
uniform float uOpacity;
uniform sampler2D uPerlinTexture;
varying vec2 vUv;

const float PI = 3.14159265358979323846;

bool drawOval(vec2 polarUv, vec2 polarCenter, float a, float b,
              bool reverseGradient, float softness, out vec4 color) {
  vec2 p = polarUv - polarCenter;
  float oval = (p.x*p.x)/(a*a) + (p.y*p.y)/(b*b);
  float edge = smoothstep(1.0, 1.0 - softness, oval);
  if (edge > 0.0) {
    float grad = reverseGradient
      ? (1.0 - (p.x/a + 1.0)/2.0)
      : ((p.x/a + 1.0)/2.0);
    grad = mix(0.5, grad, 0.1);
    color = vec4(vec3(grad), 0.85 * edge);
    return true;
  }
  return false;
}

vec3 colorRamp(float g, vec3 c1, vec3 c2, vec3 c3, vec3 c4) {
  if (g < 0.33)       return mix(c1, c2, g * 3.0);
  else if (g < 0.66)  return mix(c2, c3, (g - 0.33) * 3.0);
  else                return mix(c3, c4, (g - 0.66) * 3.0);
}

vec2 hash2(vec2 p) {
  return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453);
}

float noise2D(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p);
  vec2 u = f*f*(3.0-2.0*f);
  float n = mix(
    mix(dot(hash2(i+vec2(0,0)),f-vec2(0,0)), dot(hash2(i+vec2(1,0)),f-vec2(1,0)), u.x),
    mix(dot(hash2(i+vec2(0,1)),f-vec2(0,1)), dot(hash2(i+vec2(1,1)),f-vec2(1,1)), u.x),
    u.y);
  return 0.5 + 0.5*n;
}

float sharpRing(vec3 d, float t) {
  float noise = mix(noise2D(vec2(d.x,t)*5.0), noise2D(vec2(d.y,t)*5.0), d.z);
  return 1.0 + (noise-0.5)*2.5 * 0.3*1.5;
}

float smoothRing(vec3 d, float t) {
  float noise = mix(noise2D(vec2(d.x,t)*6.0), noise2D(vec2(d.y,t)*6.0), d.z);
  return 0.9 + (noise-0.5)*5.0 * 0.2;
}

float flow(vec3 d, float t) {
  return mix(
    texture(uPerlinTexture, vec2(t, d.x/2.0)).r,
    texture(uPerlinTexture, vec2(t, d.y/2.0)).r,
    d.z);
}

void main() {
  vec2 uv = vUv*2.0 - 1.0;
  float radius = length(uv);
  float theta  = atan(uv.y, uv.x);
  if (theta < 0.0) theta += 2.0*PI;

  vec3 decomposed = vec3(
    theta/(2.0*PI),
    mod(theta/(2.0*PI)+0.5, 1.0)+1.0,
    abs(theta/PI - 1.0));

  float noise = flow(decomposed, radius*0.02 - uAnimation*0.2) - 0.5;
  theta += noise * mix(0.028, 0.08, uOutputVolume);

  vec4 color = vec4(1.0);
  float origCenters[7] = float[7](0.0,0.5*PI,1.0*PI,1.5*PI,2.0*PI,2.5*PI,3.0*PI);
  float centers[7];
  for (int i=0;i<7;i++)
    centers[i] = origCenters[i] + 0.22*sin(uTime/12.0 + uOffsets[i]);

  vec4 ovalColor;
  for (int i=0;i<7;i++) {
    float oNoise = texture(uPerlinTexture, vec2(mod(centers[i]+uTime*0.052,1.0),0.5)).r;
    float a = 0.5 + oNoise*0.3;
    float b = oNoise * mix(3.5, 2.5, uInputVolume);
    float distTheta = min(abs(theta-centers[i]),
      min(abs(theta+2.0*PI-centers[i]), abs(theta-2.0*PI-centers[i])));
    if (drawOval(vec2(distTheta, radius), vec2(0.0), a, b, (i%2==1), 0.6, ovalColor)) {
      color.rgb = mix(color.rgb, ovalColor.rgb, ovalColor.a);
      color.a   = max(color.a, ovalColor.a);
    }
  }

  float ringR1  = sharpRing(decomposed, uTime*0.12);
  float ringR2  = smoothRing(decomposed, uTime*0.12);
  float inR1    = radius + uInputVolume*0.065;
  float inR2    = radius + uInputVolume*0.05;
  float op1     = mix(0.12, 0.34, uInputVolume);
  float op2     = mix(0.08, 0.24, uInputVolume);
  float rA1     = (inR2 >= ringR1) ? op1 : 0.0;
  float rA2     = smoothstep(ringR2-0.05, ringR2+0.05, inR1)*op2;
  float ringAlpha = max(rA1, rA2);
  color.rgb = 1.0 - (1.0-color.rgb)*(1.0-vec3(1.0)*ringAlpha);

  // Color ramp: dark violet → violet → blue-400 → white
  vec3 c1 = mix(uColor1, vec3(0.06,0.02,0.12), 0.5);  // deep violet-dark
  vec3 c2 = uColor1;                                   // violet-600
  vec3 c3 = uColor2;                                   // blue-400
  vec3 c4 = vec3(1.0);                                 // white highlight

  float lum = mix(color.r, 1.0-color.r, uInverted);
  color.rgb = colorRamp(lum, c1, c2, c3, c4);
  color.a  *= uOpacity;
  gl_FragColor = color;
}
`
