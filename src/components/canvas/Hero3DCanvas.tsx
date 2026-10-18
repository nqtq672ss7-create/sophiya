import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface Hero3DCanvasProps {
  className?: string;
  bloomProgress?: number; // 0 to 1
  autoRotateSpeed?: number;
}

export const Hero3DCanvas: React.FC<Hero3DCanvasProps> = ({
  className = '',
  bloomProgress = 0.9,
  autoRotateSpeed = 0.25,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const prevMouseRef = useRef({ x: 0, y: 0 });
  const targetRotationRef = useRef({ x: 0.18, y: -0.2 });
  const mouseParallaxRef = useRef({ x: 0, y: 0 });
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene
    const scene = new THREE.Scene();

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0.2, 4.3);
    camera.lookAt(0, -0.05, 0);

    // 3. Renderer with ACES Filmic tonemapping
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Lighting Setup (tuned for #1E0708 background and #6C1E26 velvet petals)
    // Key directional light (warm soft cream)
    const keyLight = new THREE.DirectionalLight(0xfff5ee, 2.8);
    keyLight.position.set(3, 5, 4.5);
    keyLight.castShadow = true;
    scene.add(keyLight);

    // Front fill light for petal texture
    const frontLight = new THREE.DirectionalLight(0xffd5dc, 1.6);
    frontLight.position.set(-2, 1, 3);
    scene.add(frontLight);

    // Fill Light (soft viola tone)
    const fillLight = new THREE.PointLight(0xc18f96, 2.0, 10);
    fillLight.position.set(-4, -1, -2);
    scene.add(fillLight);

    // Rim Light (rose gold metallic accent)
    const rimLight = new THREE.PointLight(0xf4b5bd, 2.4, 8);
    rimLight.position.set(0, 4, -3);
    scene.add(rimLight);

    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x45161d, 0.9);
    scene.add(ambientLight);

    // 5. Build Flower Geometry & Materials
    const flowerGroup = new THREE.Group();

    // Petal Material with Red Berry velvet and Viola sheen
    const petalMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#6C1E26'), // RED BERRY
      roughness: 0.52,
      metalness: 0.04,
      clearcoat: 0.35,
      clearcoatRoughness: 0.25,
      sheen: 1.0,
      sheenColor: new THREE.Color('#C18F96'), // VIOLA sheen
      sheenRoughness: 0.45,
      side: THREE.DoubleSide,
    });

    // Helper to generate organic curved petal
    const createPetalGeometry = (w: number, h: number, curv: number, ruffle: number = 0) => {
      const geom = new THREE.PlaneGeometry(w, h, 24, 24);
      const pos = geom.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const nx = x / (w / 2);
        const ny = (y + h / 2) / h;

        const cup = (1 - nx * nx) * Math.sin(ny * Math.PI) * curv;
        const roll = Math.pow(ny, 2.2) * (curv * 0.45);
        const wave = ruffle > 0 ? Math.sin(nx * 8 + ny * 6) * ruffle * ny : 0;

        pos.setZ(i, cup - roll + wave);
        const taper = Math.sin(ny * Math.PI * 0.95);
        pos.setX(i, x * Math.max(0.22, taper));
      }
      geom.computeVertexNormals();
      return geom;
    };

    // Concentric whorls (Fibonacci spiral)
    const petals: THREE.Mesh[] = [];
    const petalTransforms: { pos: THREE.Vector3; rot: THREE.Euler; ring: number }[] = [];

    const rings = [
      { count: 4, w: 0.45, h: 0.75, r: 0.1, tilt: 0.2, curv: 0.32, ruffle: 0.02 },
      { count: 6, w: 0.68, h: 0.95, r: 0.22, tilt: 0.38, curv: 0.4, ruffle: 0.04 },
      { count: 8, w: 0.9, h: 1.2, r: 0.36, tilt: 0.62, curv: 0.48, ruffle: 0.06 },
      { count: 10, w: 1.15, h: 1.45, r: 0.52, tilt: 0.9, curv: 0.54, ruffle: 0.08 },
      { count: 12, w: 1.4, h: 1.65, r: 0.7, tilt: 1.2, curv: 0.6, ruffle: 0.1 },
    ];

    const goldenAngle = 2.39996;
    let pIdx = 0;

    rings.forEach((ring, ringIdx) => {
      const geom = createPetalGeometry(ring.w, ring.h, ring.curv, ring.ruffle);
      for (let i = 0; i < ring.count; i++) {
        const angle = pIdx * goldenAngle;
        const mesh = new THREE.Mesh(geom, petalMaterial);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        const x = Math.cos(angle) * ring.r;
        const z = Math.sin(angle) * ring.r;
        const y = ringIdx * 0.07;

        mesh.position.set(x, y, z);
        mesh.rotation.y = -angle + Math.PI / 2;
        mesh.rotation.x = ring.tilt;

        petalTransforms.push({
          pos: mesh.position.clone(),
          rot: mesh.rotation.clone(),
          ring: ringIdx,
        });

        flowerGroup.add(mesh);
        petals.push(mesh);
        pIdx++;
      }
    });

    // Stem
    const stemCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.04, -0.9, -0.02),
      new THREE.Vector3(-0.05, -1.9, 0.03),
      new THREE.Vector3(0.02, -2.9, -0.01),
    ]);
    const stemGeom = new THREE.TubeGeometry(stemCurve, 32, 0.07, 12, false);
    const stemMat = new THREE.MeshStandardMaterial({
      color: 0x1f1014, // dark burgundy stem
      roughness: 0.65,
    });
    const stemMesh = new THREE.Mesh(stemGeom, stemMat);
    stemMesh.castShadow = true;
    flowerGroup.add(stemMesh);

    // Calyx sepals (Viola/Matrix tone)
    const sepalGeom = createPetalGeometry(0.3, 0.8, 0.35);
    const sepalMat = new THREE.MeshStandardMaterial({ color: 0x3d141a, roughness: 0.7, side: THREE.DoubleSide });
    for (let s = 0; s < 5; s++) {
      const sAngle = (s / 5) * Math.PI * 2;
      const sMesh = new THREE.Mesh(sepalGeom, sepalMat);
      sMesh.position.set(Math.cos(sAngle) * 0.22, -0.05, Math.sin(sAngle) * 0.22);
      sMesh.rotation.y = -sAngle + Math.PI / 2;
      sMesh.rotation.x = 1.35;
      flowerGroup.add(sMesh);
    }

    // Dewdrops with real glass refraction
    const dewGeom = new THREE.SphereGeometry(0.035, 12, 12);
    const dewMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.02,
      transmission: 0.95,
      ior: 1.33,
      transparent: true,
      opacity: 0.9,
    });
    for (let d = 0; d < 7; d++) {
      const dew = new THREE.Mesh(dewGeom, dewMat);
      const targetPetal = petals[10 + d * 3];
      if (targetPetal) {
        dew.position.set((Math.random() - 0.5) * 0.25, 0.4 + Math.random() * 0.4, 0.08);
        targetPetal.add(dew);
      }
    }

    // Core pistil
    const coreGeom = new THREE.DodecahedronGeometry(0.12, 1);
    const coreMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.25, metalness: 0.8 });
    const coreMesh = new THREE.Mesh(coreGeom, coreMat);
    coreMesh.position.set(0, 0.2, 0);
    flowerGroup.add(coreMesh);

    scene.add(flowerGroup);

    // 6. Floating Luminous Petal Dust Particles (300 particles)
    const particleCount = 300;
    const particlePos = new Float32Array(particleCount * 3);
    const particleSpeeds = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      particlePos[i * 3] = (Math.random() - 0.5) * 7;
      particlePos[i * 3 + 1] = (Math.random() - 0.5) * 6;
      particlePos[i * 3 + 2] = (Math.random() - 0.5) * 5;

      particleSpeeds[i * 3] = (Math.random() - 0.5) * 0.002;
      particleSpeeds[i * 3 + 1] = 0.0015 + Math.random() * 0.0035; // gentle upward float
      particleSpeeds[i * 3 + 2] = (Math.random() - 0.5) * 0.002;
    }

    const particleGeom = new THREE.BufferGeometry();
    particleGeom.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));

    // Particle texture
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const pCtx = canvas.getContext('2d');
    if (pCtx) {
      const grad = pCtx.createRadialGradient(16, 16, 0, 16, 16, 16);
      grad.addColorStop(0, 'rgba(241, 225, 233, 1)'); // PETAL #F1E1E9
      grad.addColorStop(0.35, 'rgba(193, 143, 150, 0.6)'); // VIOLA #C18F96
      grad.addColorStop(1, 'rgba(108, 30, 38, 0)');
      pCtx.fillStyle = grad;
      pCtx.beginPath();
      pCtx.arc(16, 16, 16, 0, Math.PI * 2);
      pCtx.fill();
    }
    const particleTex = new THREE.CanvasTexture(canvas);

    const particleMat = new THREE.PointsMaterial({
      size: 0.075,
      map: particleTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.6,
    });
    const particles = new THREE.Points(particleGeom, particleMat);
    scene.add(particles);

    // 7. Mouse and Touch Interaction Handlers
    const onMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      prevMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      // Parallax tracking
      const normX = (e.clientX / window.innerWidth - 0.5) * 2;
      const normY = (e.clientY / window.innerHeight - 0.5) * 2;
      mouseParallaxRef.current = { x: normX * 0.25, y: -normY * 0.2 };

      if (!isDraggingRef.current) return;
      const dx = e.clientX - prevMouseRef.current.x;
      const dy = e.clientY - prevMouseRef.current.y;

      targetRotationRef.current.y += dx * 0.007;
      targetRotationRef.current.x = Math.max(-0.5, Math.min(0.8, targetRotationRef.current.x + dy * 0.007));
      prevMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
    };

    // Touch support
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDraggingRef.current = true;
        prevMouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - prevMouseRef.current.x;
      const dy = e.touches[0].clientY - prevMouseRef.current.y;

      targetRotationRef.current.y += dx * 0.008;
      targetRotationRef.current.x = Math.max(-0.5, Math.min(0.8, targetRotationRef.current.x + dy * 0.008));
      prevMouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const onTouchEnd = () => {
      isDraggingRef.current = false;
    };

    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('touchstart', onTouchStart, { passive: true });
    container.addEventListener('touchmove', onTouchMove, { passive: true });
    container.addEventListener('touchend', onTouchEnd);

    // 8. Animation Loop
    const clock = new THREE.Clock();

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Continuous subtle turntable
      if (!isDraggingRef.current) {
        targetRotationRef.current.y += delta * autoRotateSpeed;
      }

      // Smooth rotation with mouse parallax blend
      flowerGroup.rotation.x += (targetRotationRef.current.x + mouseParallaxRef.current.y - flowerGroup.rotation.x) * 0.06;
      flowerGroup.rotation.y += (targetRotationRef.current.y + mouseParallaxRef.current.x - flowerGroup.rotation.y) * 0.06;

      // Breathing petal pulse
      petals.forEach((p, idx) => {
        const init = petalTransforms[idx];
        if (!init) return;
        const ringFactor = (init.ring + 1) / 5;
        const sway = Math.sin(time * 1.4 + idx * 0.35) * 0.02;
        const bloomAngle = bloomProgress * (0.32 * ringFactor);
        p.rotation.x = init.rot.x + bloomAngle + sway;
      });

      // Stem sway
      stemMesh.rotation.z = Math.sin(time * 0.7) * 0.02;

      // Update particles
      const posArr = particleGeom.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        posArr[i * 3 + 1] += particleSpeeds[i * 3 + 1];
        posArr[i * 3] += Math.sin(time + i) * 0.0008;
        if (posArr[i * 3 + 1] > 3.0) {
          posArr[i * 3 + 1] = -2.8;
          posArr[i * 3] = (Math.random() - 0.5) * 7;
        }
      }
      particleGeom.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    // 9. Resize
    const onResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);

      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

      petalMaterial.dispose();
      stemMat.dispose();
      sepalMat.dispose();
      dewMat.dispose();
      coreMat.dispose();
      stemGeom.dispose();
      dewGeom.dispose();
      coreGeom.dispose();
      particleGeom.dispose();
      particleMat.dispose();
      particleTex.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [bloomProgress, autoRotateSpeed]);

  return (
    <div
      ref={mountRef}
      className={`relative w-full h-full select-none cursor-grab active:cursor-grabbing overflow-hidden ${className}`}
    />
  );
};
