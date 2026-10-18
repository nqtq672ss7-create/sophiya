import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { FlowerVariety, LightingAtmosphere, PetalColorId } from '../../types';
import { FLOWER_VARIETIES, PETAL_COLORS } from '../../utils/constants';
import { createFlowerModel, FlowerMeshGroup } from './proceduralFlowers';
import { audioEngine } from '../../utils/audio';
import { 
  Maximize2, 
  RotateCw, 
  Layers, 
  Sun, 
  Moon, 
  Sunrise, 
  Compass, 
  Volume2, 
  VolumeX,
  Sparkles
} from 'lucide-react';

interface FlowerSceneProps {
  variety: FlowerVariety;
  colorId: PetalColorId;
  bloomStage: number; // 0.0 - 1.0
  isExploded: boolean;
  atmosphere: LightingAtmosphere;
  onVarietyChange?: (variety: FlowerVariety) => void;
  onColorChange?: (colorId: PetalColorId) => void;
  onBloomChange?: (stage: number) => void;
  onExplodedChange?: (exploded: boolean) => void;
  onAtmosphereChange?: (atm: LightingAtmosphere) => void;
  className?: string;
  enableInteractiveOverlay?: boolean;
}

export const FlowerScene: React.FC<FlowerSceneProps> = ({
  variety,
  colorId,
  bloomStage,
  isExploded,
  atmosphere,
  onVarietyChange,
  onColorChange,
  onBloomChange,
  onExplodedChange,
  onAtmosphereChange,
  className = '',
  enableInteractiveOverlay = true,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const flowerGroupRef = useRef<FlowerMeshGroup | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Lighting references
  const keyLightRef = useRef<THREE.DirectionalLight | null>(null);
  const fillLightRef = useRef<THREE.PointLight | null>(null);
  const rimLightRef = useRef<THREE.PointLight | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);

  // Interactive interaction state
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const rotationVelocityRef = useRef({ x: 0, y: 0 });
  const targetRotationRef = useRef({ x: 0.15, y: -0.3 });
  const [autoRotate, setAutoRotate] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  // Smooth interpolated bloom stage
  const currentBloomRef = useRef(bloomStage);

  // Setup ThreeJS Scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 0.3, 4.2);
    camera.lookAt(0, -0.1, 0);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    const keyLight = new THREE.DirectionalLight(0xffeedd, 1.8);
    keyLight.position.set(4, 5, 4);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    scene.add(keyLight);
    keyLightRef.current = keyLight;

    const fillLight = new THREE.PointLight(0xbbaacc, 0.9, 10);
    fillLight.position.set(-4, -1, -3);
    scene.add(fillLight);
    fillLightRef.current = fillLight;

    const rimLight = new THREE.PointLight(0xd4af37, 1.5, 8);
    rimLight.position.set(0, 4, -3);
    scene.add(rimLight);
    rimLightRef.current = rimLight;

    // 5. Floating Spores Particle System (350 floating botanical particles)
    const particleCount = 350;
    const particlePositions = new Float32Array(particleCount * 3);
    const particleSpeeds = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 6;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 5;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 4;

      particleSpeeds[i * 3] = (Math.random() - 0.5) * 0.003;
      particleSpeeds[i * 3 + 1] = 0.002 + Math.random() * 0.004; // gentle upward drift
      particleSpeeds[i * 3 + 2] = (Math.random() - 0.5) * 0.003;
    }

    const particleGeom = new THREE.BufferGeometry();
    particleGeom.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    
    // Canvas texture for soft glowing bokeh particles
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      grad.addColorStop(0, 'rgba(255, 230, 160, 1)');
      grad.addColorStop(0.3, 'rgba(212, 175, 55, 0.6)');
      grad.addColorStop(1, 'rgba(212, 175, 55, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(16, 16, 16, 0, Math.PI * 2);
      ctx.fill();
    }
    const particleTexture = new THREE.CanvasTexture(canvas);

    const particleMat = new THREE.PointsMaterial({
      size: 0.08,
      map: particleTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.65,
    });
    const particles = new THREE.Points(particleGeom, particleMat);
    scene.add(particles);
    particlesRef.current = particles;

    // 6. Build Initial Flower
    const currentColor = PETAL_COLORS.find((c) => c.id === colorId) || PETAL_COLORS[0];
    const flowerModel = createFlowerModel(variety, currentColor);
    scene.add(flowerModel.group);
    flowerGroupRef.current = flowerModel;

    // 7. Render Loop with smooth inertia
    let clock = new THREE.Clock();

    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Smooth bloom stage interpolation
      currentBloomRef.current += (bloomStage - currentBloomRef.current) * 0.08;

      if (flowerGroupRef.current) {
        flowerGroupRef.current.updateBloom(currentBloomRef.current, isExploded, time);

        // Apply smooth rotation
        if (autoRotate && !isDraggingRef.current) {
          targetRotationRef.current.y += delta * 0.35;
        }

        flowerGroupRef.current.group.rotation.x += (targetRotationRef.current.x - flowerGroupRef.current.group.rotation.x) * 0.08;
        flowerGroupRef.current.group.rotation.y += (targetRotationRef.current.y - flowerGroupRef.current.group.rotation.y) * 0.08;
      }

      // Update particles
      if (particlesRef.current) {
        const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < particleCount; i++) {
          positions[i * 3 + 1] += particleSpeeds[i * 3 + 1];
          positions[i * 3] += Math.sin(time + i) * 0.001;

          // Recycle particle if it floats too high
          if (positions[i * 3 + 1] > 2.8) {
            positions[i * 3 + 1] = -2.5;
            positions[i * 3] = (Math.random() - 0.5) * 6;
          }
        }
        particlesRef.current.geometry.attributes.position.needsUpdate = true;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      if (flowerGroupRef.current) {
        flowerGroupRef.current.dispose();
      }
      particleGeom.dispose();
      particleMat.dispose();
      particleTexture.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []); // Run on mount

  // Update variety or rebuild flower mesh
  useEffect(() => {
    if (!sceneRef.current) return;
    if (flowerGroupRef.current?.variety === variety) return;

    // Remove old model
    if (flowerGroupRef.current) {
      sceneRef.current.remove(flowerGroupRef.current.group);
      flowerGroupRef.current.dispose();
    }

    // Create new model
    const currentColor = PETAL_COLORS.find((c) => c.id === colorId) || PETAL_COLORS[0];
    const newModel = createFlowerModel(variety, currentColor);
    sceneRef.current.add(newModel.group);
    flowerGroupRef.current = newModel;

    audioEngine.playChime(440, 0.08);
  }, [variety]);

  // Update colors
  useEffect(() => {
    if (!flowerGroupRef.current) return;
    const currentColor = PETAL_COLORS.find((c) => c.id === colorId) || PETAL_COLORS[0];
    flowerGroupRef.current.updateColors(currentColor);
    audioEngine.playTap();
  }, [colorId]);

  // Update atmosphere lighting
  useEffect(() => {
    if (!keyLightRef.current || !fillLightRef.current || !rimLightRef.current || !ambientLightRef.current) return;

    if (atmosphere === 'midnight') {
      keyLightRef.current.color.setHex(0xffdfa0);
      keyLightRef.current.intensity = 1.9;
      fillLightRef.current.color.setHex(0x554477);
      fillLightRef.current.intensity = 1.2;
      rimLightRef.current.color.setHex(0x2288bb);
      rimLightRef.current.intensity = 1.8;
      ambientLightRef.current.intensity = 0.25;
      if (rendererRef.current) rendererRef.current.toneMappingExposure = 1.1;
    } else if (atmosphere === 'golden') {
      keyLightRef.current.color.setHex(0xffaa44);
      keyLightRef.current.intensity = 2.4;
      fillLightRef.current.color.setHex(0xffdd99);
      fillLightRef.current.intensity = 1.4;
      rimLightRef.current.color.setHex(0xffeebb);
      rimLightRef.current.intensity = 2.2;
      ambientLightRef.current.intensity = 0.45;
      if (rendererRef.current) rendererRef.current.toneMappingExposure = 1.25;
    } else if (atmosphere === 'dawn') {
      keyLightRef.current.color.setHex(0xf0f4ff);
      keyLightRef.current.intensity = 1.6;
      fillLightRef.current.color.setHex(0xffd4e2);
      fillLightRef.current.intensity = 1.1;
      rimLightRef.current.color.setHex(0x99ddcc);
      rimLightRef.current.intensity = 1.5;
      ambientLightRef.current.intensity = 0.55;
      if (rendererRef.current) rendererRef.current.toneMappingExposure = 1.2;
    }
  }, [atmosphere]);

  // Mouse & Touch Orbit Controls
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDraggingRef.current = true;
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    setAutoRotate(false);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - previousMousePositionRef.current.x;
    const deltaY = e.clientY - previousMousePositionRef.current.y;

    targetRotationRef.current.y += deltaX * 0.007;
    targetRotationRef.current.x = Math.max(-0.6, Math.min(0.8, targetRotationRef.current.x + deltaY * 0.007));

    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!cameraRef.current) return;
    e.preventDefault();
    const newZ = Math.max(2.6, Math.min(6.5, cameraRef.current.position.z + e.deltaY * 0.003));
    cameraRef.current.position.z = newZ;
  }, []);

  // Touch handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      isDraggingRef.current = true;
      previousMousePositionRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      setAutoRotate(false);
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDraggingRef.current || e.touches.length !== 1) return;
    const deltaX = e.touches[0].clientX - previousMousePositionRef.current.x;
    const deltaY = e.touches[0].clientY - previousMousePositionRef.current.y;

    targetRotationRef.current.y += deltaX * 0.008;
    targetRotationRef.current.x = Math.max(-0.6, Math.min(0.8, targetRotationRef.current.x + deltaY * 0.008));

    previousMousePositionRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, []);

  const handleTouchEnd = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  const handleResetCamera = () => {
    if (cameraRef.current) {
      cameraRef.current.position.set(0, 0.3, 4.2);
      targetRotationRef.current = { x: 0.15, y: -0.3 };
      audioEngine.playTap();
    }
  };

  const handleAudioToggle = () => {
    const unmuted = audioEngine.toggleMute();
    setIsMuted(!unmuted);
  };

  return (
    <div
      className={`relative w-full h-full select-none cursor-grab active:cursor-grabbing overflow-hidden ${className}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 3D Canvas Mounting Point */}
      <div ref={mountRef} className="w-full h-full webgl-canvas" />

      {/* Atmospheric Vignette Overlay */}
      <div className="pointer-events-none absolute inset-0 bg-radial from-transparent via-atelier-950/20 to-atelier-950/80" />

      {/* Interactive HUD Overlays */}
      {enableInteractiveOverlay && (
        <>
          {/* Top-Right Quick Controls (Audio, Reset, Rotate) */}
          <div className="absolute top-6 right-6 flex items-center gap-2 z-20">
            <button
              onClick={handleAudioToggle}
              title={isMuted ? 'Включить атмосферный звук' : 'Выключить звук'}
              className="p-2.5 rounded-full glass-panel hover:bg-gold/20 text-gold transition-all duration-300"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 animate-pulse" />}
            </button>
            <button
              onClick={() => {
                setAutoRotate(!autoRotate);
                audioEngine.playTap();
              }}
              title={autoRotate ? 'Остановить автовращение' : 'Включить автовращение'}
              className={`p-2.5 rounded-full glass-panel text-gold transition-all duration-300 ${
                autoRotate ? 'bg-gold/20 shadow-[0_0_12px_rgba(212,175,55,0.3)]' : 'hover:bg-gold/15'
              }`}
            >
              <RotateCw className={`w-4 h-4 ${autoRotate ? 'animate-spin-slow' : ''}`} />
            </button>
            <button
              onClick={handleResetCamera}
              title="Сбросить ракурс камеры"
              className="p-2.5 rounded-full glass-panel hover:bg-gold/20 text-gold transition-all duration-300"
            >
              <Compass className="w-4 h-4" />
            </button>
          </div>

          {/* Bottom Interactive HUD Bar */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-2xl glass-panel rounded-2xl p-4 z-20 shadow-2xl border border-gold/25">
            <div className="flex flex-col gap-3.5">
              {/* Row 1: Variety & Atmosphere */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-3">
                {/* Variety Tabs */}
                <div className="flex items-center gap-1 bg-atelier-900/80 p-1 rounded-xl border border-gold/10">
                  {FLOWER_VARIETIES.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => onVarietyChange?.(v.id)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-300 ${
                        variety === v.id
                          ? 'bg-gold text-atelier-950 font-semibold shadow-md'
                          : 'text-zinc-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {v.nameRu.split(' ')[0]}
                    </button>
                  ))}
                </div>

                {/* Atmosphere Presets */}
                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-zinc-400 mr-1 hidden sm:inline">Свет:</span>
                  <button
                    onClick={() => {
                      onAtmosphereChange?.('midnight');
                      audioEngine.playTap();
                    }}
                    title="Ночное Ателье"
                    className={`p-1.5 rounded-lg border transition-all ${
                      atmosphere === 'midnight'
                        ? 'border-gold text-gold bg-gold/10 shadow-[0_0_10px_rgba(212,175,55,0.25)]'
                        : 'border-white/10 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      onAtmosphereChange?.('golden');
                      audioEngine.playTap();
                    }}
                    title="Золотой Час"
                    className={`p-1.5 rounded-lg border transition-all ${
                      atmosphere === 'golden'
                        ? 'border-gold text-gold bg-gold/10 shadow-[0_0_10px_rgba(212,175,55,0.25)]'
                        : 'border-white/10 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      onAtmosphereChange?.('dawn');
                      audioEngine.playTap();
                    }}
                    title="Рассветная Роса"
                    className={`p-1.5 rounded-lg border transition-all ${
                      atmosphere === 'dawn'
                        ? 'border-gold text-gold bg-gold/10 shadow-[0_0_10px_rgba(212,175,55,0.25)]'
                        : 'border-white/10 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Sunrise className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Row 2: Bloom Slider & Anatomy Button & Palette */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                {/* Bloom Slider */}
                <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                  <span className="text-xs text-zinc-300 font-serif italic whitespace-nowrap">
                    Цветение {Math.round(bloomStage * 100)}%
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={bloomStage}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      onBloomChange?.(val);
                      audioEngine.playBloomSweep(val);
                    }}
                    className="w-full accent-gold h-1.5 bg-atelier-800 rounded-lg cursor-pointer appearance-none"
                  />
                </div>

                {/* Color Swatches */}
                <div className="flex items-center gap-1.5">
                  {PETAL_COLORS.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => onColorChange?.(c.id)}
                      title={c.nameRu}
                      className={`w-5 h-5 rounded-full border transition-transform duration-300 ${
                        colorId === c.id
                          ? 'border-gold scale-125 ring-2 ring-gold/40'
                          : 'border-white/30 hover:scale-110 opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                </div>

                {/* Exploded View Toggle */}
                <button
                  onClick={() => {
                    const next = !isExploded;
                    onExplodedChange?.(next);
                    audioEngine.playChime(next ? 659.25 : 440, 0.1);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-300 ${
                    isExploded
                      ? 'border-gold bg-gold text-atelier-950 font-semibold shadow-[0_0_15px_rgba(212,175,55,0.4)]'
                      : 'border-gold/30 text-gold hover:bg-gold/10'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Анатомия</span>
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Hint */}
          <div className="absolute top-6 left-6 pointer-events-none hidden md:flex items-center gap-2 text-zinc-400 text-xs">
            <span className="w-2 h-2 rounded-full bg-gold animate-ping" />
            <span className="font-serif italic tracking-wide text-zinc-300">
              360° Вращение мышью • Скролл для зума
            </span>
          </div>
        </>
      )}
    </div>
  );
};
