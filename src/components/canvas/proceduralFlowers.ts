import * as THREE from 'three';
import { FlowerVariety, PetalColorOption } from '../../types';

export interface FlowerMeshGroup {
  group: THREE.Group;
  petals: THREE.Mesh[];
  stem: THREE.Mesh;
  sepals: THREE.Mesh[];
  dewdrops: THREE.Mesh[];
  centerCore?: THREE.Mesh | THREE.Group;
  variety: FlowerVariety;
  updateBloom: (stage: number, isExploded: boolean, time: number) => void;
  updateColors: (colorOpt: PetalColorOption) => void;
  dispose: () => void;
}

// Generate organic curved petal geometry
function createPetalGeometry(
  width: number,
  height: number,
  curvature: number,
  ruffle: number = 0,
  resolution: number = 24
): THREE.BufferGeometry {
  const geom = new THREE.PlaneGeometry(width, height, resolution, resolution);
  const pos = geom.attributes.position;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    
    // Normalize coordinates -1 to 1
    const nx = x / (width / 2);
    const ny = (y + height / 2) / height; // 0 at base, 1 at tip

    // Curvature: Petal cups inward along x and rolls back at the tip
    const cup = (1 - nx * nx) * Math.sin(ny * Math.PI) * curvature;
    const rollBack = Math.pow(ny, 2.5) * (curvature * 0.4);
    
    // Organic ruffle wave at edges
    const wave = ruffle > 0 ? Math.sin(nx * 8 + ny * 6) * ruffle * ny : 0;

    pos.setZ(i, cup - rollBack + wave);
    
    // Taper the base and round the tip
    const taper = Math.sin(ny * Math.PI * 0.95);
    pos.setX(i, x * Math.max(0.2, taper));
  }

  geom.computeVertexNormals();
  return geom;
}

// Create Rose 3D Model
export function buildRoseModel(colorOpt: PetalColorOption): FlowerMeshGroup {
  const flowerGroup = new THREE.Group();
  const petals: THREE.Mesh[] = [];
  const initialTransforms: { pos: THREE.Vector3; rot: THREE.Euler; scale: THREE.Vector3; ring: number }[] = [];

  // Material with velvet sheen
  const petalMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(colorOpt.hex),
    roughness: colorOpt.roughness,
    metalness: 0.04,
    clearcoat: 0.25,
    clearcoatRoughness: 0.3,
    sheen: colorOpt.sheen,
    sheenColor: new THREE.Color(colorOpt.accentHex),
    sheenRoughness: 0.4,
    side: THREE.DoubleSide,
  });

  // Layered petal whorls (Fibonacci spiral distribution)
  const ringConfigs = [
    { count: 4, width: 0.45, height: 0.7, radius: 0.1, tilt: 0.15, curv: 0.28, ruffle: 0.02 },
    { count: 5, width: 0.65, height: 0.9, radius: 0.2, tilt: 0.3, curv: 0.35, ruffle: 0.03 },
    { count: 7, width: 0.85, height: 1.15, radius: 0.32, tilt: 0.5, curv: 0.42, ruffle: 0.04 },
    { count: 9, width: 1.1, height: 1.35, radius: 0.46, tilt: 0.75, curv: 0.5, ruffle: 0.06 },
    { count: 11, width: 1.35, height: 1.55, radius: 0.62, tilt: 1.05, curv: 0.55, ruffle: 0.08 },
  ];

  const goldenAngle = 2.39996; // ~137.5 degrees

  let globalPetalIdx = 0;
  ringConfigs.forEach((ring, ringIdx) => {
    const geom = createPetalGeometry(ring.width, ring.height, ring.curv, ring.ruffle);

    for (let i = 0; i < ring.count; i++) {
      const angle = globalPetalIdx * goldenAngle;
      const mesh = new THREE.Mesh(geom, petalMaterial);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      // Base position around center axis
      const x = Math.cos(angle) * ring.radius;
      const z = Math.sin(angle) * ring.radius;
      const y = ringIdx * 0.08;

      mesh.position.set(x, y, z);
      // Orient facing outward and tilted
      mesh.rotation.y = -angle + Math.PI / 2;
      mesh.rotation.x = ring.tilt;
      mesh.rotation.z = (Math.random() - 0.5) * 0.1;

      initialTransforms.push({
        pos: mesh.position.clone(),
        rot: mesh.rotation.clone(),
        scale: mesh.scale.clone(),
        ring: ringIdx,
      });

      flowerGroup.add(mesh);
      petals.push(mesh);
      globalPetalIdx++;
    }
  });

  // Stem
  const stemCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.05, -0.8, -0.02),
    new THREE.Vector3(-0.06, -1.8, 0.04),
    new THREE.Vector3(0.02, -2.8, -0.03),
  ]);
  const stemGeom = new THREE.TubeGeometry(stemCurve, 32, 0.07, 12, false);
  const stemMat = new THREE.MeshStandardMaterial({
    color: 0x183324,
    roughness: 0.6,
    metalness: 0.05,
  });
  const stemMesh = new THREE.Mesh(stemGeom, stemMat);
  stemMesh.castShadow = true;
  flowerGroup.add(stemMesh);

  // Thorns
  for (let t = 0; t < 5; t++) {
    const thornGeom = new THREE.ConeGeometry(0.04, 0.14, 8);
    const thornMesh = new THREE.Mesh(thornGeom, stemMat);
    const progress = 0.3 + t * 0.14;
    const pt = stemCurve.getPoint(progress);
    thornMesh.position.copy(pt);
    thornMesh.rotation.z = Math.PI / 2 + (t % 2 === 0 ? 0.3 : -0.3);
    thornMesh.rotation.y = t * 1.5;
    flowerGroup.add(thornMesh);
  }

  // Sepals under blossom
  const sepals: THREE.Mesh[] = [];
  const sepalGeom = createPetalGeometry(0.3, 0.8, 0.35, 0, 16);
  const sepalMat = new THREE.MeshStandardMaterial({
    color: 0x1f3f2e,
    roughness: 0.7,
    side: THREE.DoubleSide,
  });
  for (let s = 0; s < 5; s++) {
    const sAngle = (s / 5) * Math.PI * 2;
    const sMesh = new THREE.Mesh(sepalGeom, sepalMat);
    sMesh.position.set(Math.cos(sAngle) * 0.22, -0.05, Math.sin(sAngle) * 0.22);
    sMesh.rotation.y = -sAngle + Math.PI / 2;
    sMesh.rotation.x = 1.35; // drooping down
    flowerGroup.add(sMesh);
    sepals.push(sMesh);
  }

  // Dewdrops on upper petals
  const dewdrops: THREE.Mesh[] = [];
  const dewMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.02,
    metalness: 0.05,
    transmission: 0.9,
    ior: 1.33,
    transparent: true,
    opacity: 0.9,
  });
  const dewGeom = new THREE.SphereGeometry(0.035, 12, 12);
  for (let d = 0; d < 8; d++) {
    const dew = new THREE.Mesh(dewGeom, dewMat);
    const targetPetal = petals[12 + d * 2];
    if (targetPetal) {
      dew.position.set((Math.random() - 0.5) * 0.3, 0.4 + Math.random() * 0.4, 0.08);
      targetPetal.add(dew);
      dewdrops.push(dew);
    }
  }

  // Golden core center pistil
  const coreGeom = new THREE.DodecahedronGeometry(0.12, 1);
  const coreMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    roughness: 0.3,
    metalness: 0.8,
    emissive: 0x553e10,
  });
  const coreMesh = new THREE.Mesh(coreGeom, coreMat);
  coreMesh.position.set(0, 0.2, 0);
  flowerGroup.add(coreMesh);

  // Update Bloom
  const updateBloom = (stage: number, isExploded: boolean, time: number) => {
    petals.forEach((p, idx) => {
      const init = initialTransforms[idx];
      if (!init) return;

      const ringFactor = (init.ring + 1) / 5;
      // Controlled bloom factor: 0.0 = tight bud, 1.0 = fully open
      const bloomAngle = (1 - stage) * (-0.45 * ringFactor) + stage * (0.35 * ringFactor);
      
      // Idle organic sway
      const sway = Math.sin(time * 1.5 + idx * 0.4) * 0.02;

      p.rotation.x = init.rot.x + bloomAngle + sway;

      if (isExploded) {
        // Disassembly anatomy view: petals separate outward
        const explodeDist = 0.85 + init.ring * 0.35;
        p.position.x = init.pos.x * explodeDist * 2.2;
        p.position.z = init.pos.z * explodeDist * 2.2;
        p.position.y = init.pos.y + Math.sin(time + idx) * 0.08 + (init.ring - 2) * 0.25;
        p.scale.setScalar(1 + (init.ring * 0.08));
      } else {
        // Normal positioning
        p.position.copy(init.pos);
        p.scale.setScalar(0.75 + stage * 0.25);
      }
    });

    // Gentle stem breathing
    stemMesh.rotation.z = Math.sin(time * 0.8) * 0.015;
  };

  const updateColors = (newColorOpt: PetalColorOption) => {
    petalMaterial.color.set(newColorOpt.hex);
    petalMaterial.roughness = newColorOpt.roughness;
    petalMaterial.sheenColor.set(newColorOpt.accentHex);
    petalMaterial.sheen = newColorOpt.sheen;
    petalMaterial.needsUpdate = true;
  };

  const dispose = () => {
    petalMaterial.dispose();
    stemMat.dispose();
    sepalMat.dispose();
    dewMat.dispose();
    coreMat.dispose();
    stemGeom.dispose();
    dewGeom.dispose();
    coreGeom.dispose();
  };

  return {
    group: flowerGroup,
    petals,
    stem: stemMesh,
    sepals,
    dewdrops,
    centerCore: coreMesh,
    variety: 'rose',
    updateBloom,
    updateColors,
    dispose,
  };
}

// Create Peony 3D Model
export function buildPeonyModel(colorOpt: PetalColorOption): FlowerMeshGroup {
  const flowerGroup = new THREE.Group();
  const petals: THREE.Mesh[] = [];
  const initialTransforms: { pos: THREE.Vector3; rot: THREE.Euler; scale: THREE.Vector3; ring: number }[] = [];

  const petalMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(colorOpt.hex),
    roughness: colorOpt.roughness,
    metalness: 0.02,
    clearcoat: 0.3,
    sheen: colorOpt.sheen,
    sheenColor: new THREE.Color(colorOpt.accentHex),
    sheenRoughness: 0.5,
    side: THREE.DoubleSide,
  });

  // Dense, ruffled multi-tiered peony petals (~48 petals)
  const rings = [
    { count: 6, width: 0.5, height: 0.7, r: 0.12, tilt: 0.2, curv: 0.3, ruffle: 0.06 },
    { count: 8, width: 0.7, height: 0.95, r: 0.22, tilt: 0.4, curv: 0.4, ruffle: 0.08 },
    { count: 10, width: 0.9, height: 1.15, r: 0.35, tilt: 0.65, curv: 0.48, ruffle: 0.11 },
    { count: 12, width: 1.15, height: 1.35, r: 0.48, tilt: 0.95, curv: 0.52, ruffle: 0.14 },
    { count: 14, width: 1.35, height: 1.5, r: 0.65, tilt: 1.25, curv: 0.58, ruffle: 0.16 },
  ];

  let pIndex = 0;
  rings.forEach((ring, ringIdx) => {
    const geom = createPetalGeometry(ring.width, ring.height, ring.curv, ring.ruffle, 28);
    for (let i = 0; i < ring.count; i++) {
      const angle = (i / ring.count) * Math.PI * 2 + ringIdx * 0.4;
      const mesh = new THREE.Mesh(geom, petalMaterial);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      const x = Math.cos(angle) * ring.r;
      const z = Math.sin(angle) * ring.r;
      const y = ringIdx * 0.06;

      mesh.position.set(x, y, z);
      mesh.rotation.y = -angle + Math.PI / 2;
      mesh.rotation.x = ring.tilt;
      mesh.rotation.z = (Math.random() - 0.5) * 0.15;

      initialTransforms.push({
        pos: mesh.position.clone(),
        rot: mesh.rotation.clone(),
        scale: mesh.scale.clone(),
        ring: ringIdx,
      });

      flowerGroup.add(mesh);
      petals.push(mesh);
      pIndex++;
    }
  });

  // Stem
  const stemCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(-0.04, -0.9, 0.03),
    new THREE.Vector3(0.04, -1.9, -0.02),
    new THREE.Vector3(0, -2.8, 0),
  ]);
  const stemGeom = new THREE.TubeGeometry(stemCurve, 32, 0.08, 12, false);
  const stemMat = new THREE.MeshStandardMaterial({ color: 0x1d3b2a, roughness: 0.6 });
  const stemMesh = new THREE.Mesh(stemGeom, stemMat);
  stemMesh.castShadow = true;
  flowerGroup.add(stemMesh);

  // Calyx sepals
  const sepals: THREE.Mesh[] = [];
  const sepalGeom = createPetalGeometry(0.35, 0.7, 0.3, 0);
  const sepalMat = new THREE.MeshStandardMaterial({ color: 0x224833, roughness: 0.7, side: THREE.DoubleSide });
  for (let s = 0; s < 5; s++) {
    const sAngle = (s / 5) * Math.PI * 2;
    const sMesh = new THREE.Mesh(sepalGeom, sepalMat);
    sMesh.position.set(Math.cos(sAngle) * 0.28, -0.04, Math.sin(sAngle) * 0.28);
    sMesh.rotation.y = -sAngle + Math.PI / 2;
    sMesh.rotation.x = 1.4;
    flowerGroup.add(sMesh);
    sepals.push(sMesh);
  }

  // Golden stamen cluster in center
  const stamenGroup = new THREE.Group();
  const stamenMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.2, metalness: 0.8 });
  for (let st = 0; st < 30; st++) {
    const sGeom = new THREE.CylinderGeometry(0.008, 0.008, 0.25);
    const headGeom = new THREE.SphereGeometry(0.02, 6, 6);
    const stem = new THREE.Mesh(sGeom, stamenMat);
    const head = new THREE.Mesh(headGeom, stamenMat);
    head.position.y = 0.13;
    const single = new THREE.Group();
    single.add(stem);
    single.add(head);

    const sAngle = Math.random() * Math.PI * 2;
    const sR = Math.random() * 0.15;
    single.position.set(Math.cos(sAngle) * sR, 0.1, Math.sin(sAngle) * sR);
    single.rotation.x = (Math.random() - 0.5) * 0.3;
    single.rotation.z = (Math.random() - 0.5) * 0.3;
    stamenGroup.add(single);
  }
  flowerGroup.add(stamenGroup);

  const updateBloom = (stage: number, isExploded: boolean, time: number) => {
    petals.forEach((p, idx) => {
      const init = initialTransforms[idx];
      if (!init) return;

      const bloomTilt = (1 - stage) * (-0.35) + stage * (0.3);
      const sway = Math.sin(time * 1.2 + idx * 0.3) * 0.015;
      p.rotation.x = init.rot.x + bloomTilt + sway;

      if (isExploded) {
        p.position.x = init.pos.x * (1.8 + init.ring * 0.4);
        p.position.z = init.pos.z * (1.8 + init.ring * 0.4);
        p.position.y = init.pos.y + Math.cos(time + idx * 0.5) * 0.06 + (init.ring - 2) * 0.18;
      } else {
        p.position.copy(init.pos);
      }
    });
  };

  const updateColors = (newColorOpt: PetalColorOption) => {
    petalMaterial.color.set(newColorOpt.hex);
    petalMaterial.roughness = newColorOpt.roughness;
    petalMaterial.sheenColor.set(newColorOpt.accentHex);
    petalMaterial.sheen = newColorOpt.sheen;
    petalMaterial.needsUpdate = true;
  };

  const dispose = () => {
    petalMaterial.dispose();
    stemMat.dispose();
    sepalMat.dispose();
    stamenMat.dispose();
    stemGeom.dispose();
    sepalGeom.dispose();
  };

  return {
    group: flowerGroup,
    petals,
    stem: stemMesh,
    sepals,
    dewdrops: [],
    centerCore: stamenGroup,
    variety: 'peony',
    updateBloom,
    updateColors,
    dispose,
  };
}

// Create Orchid 3D Model
export function buildOrchidModel(colorOpt: PetalColorOption): FlowerMeshGroup {
  const flowerGroup = new THREE.Group();
  const petals: THREE.Mesh[] = [];

  const petalMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(colorOpt.hex),
    roughness: colorOpt.roughness,
    metalness: 0.03,
    clearcoat: 0.35,
    sheen: colorOpt.sheen,
    sheenColor: new THREE.Color(colorOpt.accentHex),
    side: THREE.DoubleSide,
  });

  // Orchid has distinct dorsal sepal, 2 lateral sepals, 2 wide upper petals, and an ornate lip (labellum)
  const dorsalGeom = createPetalGeometry(0.7, 1.2, 0.25, 0.04);
  const dorsal = new THREE.Mesh(dorsalGeom, petalMaterial);
  dorsal.position.set(0, 0.4, -0.05);
  dorsal.rotation.x = -0.15;
  flowerGroup.add(dorsal);
  petals.push(dorsal);

  // 2 Lateral sepals
  [-1, 1].forEach((dir) => {
    const latGeom = createPetalGeometry(0.55, 1.1, 0.2, 0.03);
    const lat = new THREE.Mesh(latGeom, petalMaterial);
    lat.position.set(dir * 0.45, -0.1, -0.08);
    lat.rotation.z = dir * 1.9;
    lat.rotation.y = dir * 0.2;
    lat.rotation.x = -0.1;
    flowerGroup.add(lat);
    petals.push(lat);
  });

  // 2 Large Lateral Petals (wings)
  [-1, 1].forEach((dir) => {
    const wingGeom = createPetalGeometry(0.9, 1.25, 0.35, 0.08);
    const wing = new THREE.Mesh(wingGeom, petalMaterial);
    wing.position.set(dir * 0.55, 0.2, 0.05);
    wing.rotation.z = -dir * 1.25;
    wing.rotation.y = -dir * 0.3;
    wing.rotation.x = 0.2;
    flowerGroup.add(wing);
    petals.push(wing);
  });

  // Labellum / Lip (ornate central orchid petal)
  const lipGeom = createPetalGeometry(0.75, 0.95, 0.6, 0.12);
  const lipMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(colorOpt.accentHex),
    roughness: 0.3,
    metalness: 0.1,
    sheen: 1.0,
    sheenColor: 0xd4af37,
    side: THREE.DoubleSide,
  });
  const lip = new THREE.Mesh(lipGeom, lipMat);
  lip.position.set(0, -0.32, 0.18);
  lip.rotation.x = 0.85;
  flowerGroup.add(lip);
  petals.push(lip);

  // Column (reproductive structure)
  const colGeom = new THREE.CylinderGeometry(0.06, 0.04, 0.3, 12);
  const colMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.2, metalness: 0.7 });
  const colMesh = new THREE.Mesh(colGeom, colMat);
  colMesh.position.set(0, 0.02, 0.14);
  colMesh.rotation.x = 0.4;
  flowerGroup.add(colMesh);

  // Gracefully arching stem
  const stemCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.08, -0.6, -0.1),
    new THREE.Vector3(0.2, -1.5, -0.25),
    new THREE.Vector3(0.12, -2.5, -0.15),
  ]);
  const stemGeom = new THREE.TubeGeometry(stemCurve, 32, 0.06, 12, false);
  const stemMat = new THREE.MeshStandardMaterial({ color: 0x1f3c2b, roughness: 0.6 });
  const stemMesh = new THREE.Mesh(stemGeom, stemMat);
  stemMesh.castShadow = true;
  flowerGroup.add(stemMesh);

  const initialPositions = petals.map((p) => p.position.clone());

  const updateBloom = (stage: number, isExploded: boolean, time: number) => {
    petals.forEach((p, idx) => {
      const init = initialPositions[idx];
      const sway = Math.sin(time * 1.3 + idx) * 0.02;

      if (isExploded) {
        p.position.set(init.x * 2.2, init.y * 1.8 + Math.sin(time + idx) * 0.05, init.z + (idx - 2) * 0.25);
      } else {
        p.position.copy(init);
        p.scale.setScalar(0.7 + stage * 0.3 + sway);
      }
    });
  };

  const updateColors = (newColorOpt: PetalColorOption) => {
    petalMaterial.color.set(newColorOpt.hex);
    petalMaterial.sheenColor.set(newColorOpt.accentHex);
    lipMat.color.set(newColorOpt.accentHex);
    petalMaterial.needsUpdate = true;
    lipMat.needsUpdate = true;
  };

  const dispose = () => {
    petalMaterial.dispose();
    lipMat.dispose();
    colMat.dispose();
    stemMat.dispose();
    dorsalGeom.dispose();
    lipGeom.dispose();
    colGeom.dispose();
    stemGeom.dispose();
  };

  return {
    group: flowerGroup,
    petals,
    stem: stemMesh,
    sepals: [],
    dewdrops: [],
    centerCore: colMesh,
    variety: 'orchid',
    updateBloom,
    updateColors,
    dispose,
  };
}

// Create Lotus 3D Model
export function buildLotusModel(colorOpt: PetalColorOption): FlowerMeshGroup {
  const flowerGroup = new THREE.Group();
  const petals: THREE.Mesh[] = [];
  const initialTransforms: { pos: THREE.Vector3; rot: THREE.Euler; ring: number }[] = [];

  const petalMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(colorOpt.hex),
    roughness: colorOpt.roughness,
    metalness: 0.02,
    clearcoat: 0.4,
    sheen: colorOpt.sheen,
    sheenColor: new THREE.Color(colorOpt.accentHex),
    sheenRoughness: 0.3,
    side: THREE.DoubleSide,
  });

  // Lotus tiers opening radially (4 rings of 8 petals each = 32 pointed petals)
  const lotusRings = [
    { count: 6, width: 0.45, height: 0.9, r: 0.16, tilt: 0.35, curv: 0.3 },
    { count: 8, width: 0.65, height: 1.15, r: 0.28, tilt: 0.65, curv: 0.38 },
    { count: 10, width: 0.85, height: 1.35, r: 0.44, tilt: 1.05, curv: 0.42 },
    { count: 12, width: 1.05, height: 1.55, r: 0.62, tilt: 1.38, curv: 0.46 },
  ];

  lotusRings.forEach((ring, ringIdx) => {
    const geom = createPetalGeometry(ring.width, ring.height, ring.curv, 0.02, 20);
    for (let i = 0; i < ring.count; i++) {
      const angle = (i / ring.count) * Math.PI * 2 + ringIdx * 0.3;
      const mesh = new THREE.Mesh(geom, petalMaterial);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      const x = Math.cos(angle) * ring.r;
      const z = Math.sin(angle) * ring.r;
      const y = ringIdx * 0.04;

      mesh.position.set(x, y, z);
      mesh.rotation.y = -angle + Math.PI / 2;
      mesh.rotation.x = ring.tilt;

      initialTransforms.push({
        pos: mesh.position.clone(),
        rot: mesh.rotation.clone(),
        ring: ringIdx,
      });

      flowerGroup.add(mesh);
      petals.push(mesh);
    }
  });

  // Flat seed pod receptacle in center (sacred lotus carpellary receptacle)
  const podGeom = new THREE.CylinderGeometry(0.24, 0.18, 0.2, 16);
  const podMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    roughness: 0.35,
    metalness: 0.6,
  });
  const podMesh = new THREE.Mesh(podGeom, podMat);
  podMesh.position.set(0, 0.1, 0);
  flowerGroup.add(podMesh);

  // Tiny seeds on top of receptacle
  const seedGeom = new THREE.SphereGeometry(0.025, 8, 8);
  const seedMat = new THREE.MeshStandardMaterial({ color: 0x5a4515 });
  for (let s = 0; s < 9; s++) {
    const seed = new THREE.Mesh(seedGeom, seedMat);
    const sAngle = (s / 9) * Math.PI * 2;
    seed.position.set(Math.cos(sAngle) * 0.14, 0.21, Math.sin(sAngle) * 0.14);
    flowerGroup.add(seed);
  }

  // Stem
  const stemCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, -1.0, 0),
    new THREE.Vector3(0, -2.5, 0),
  ]);
  const stemGeom = new THREE.TubeGeometry(stemCurve, 16, 0.07, 12, false);
  const stemMat = new THREE.MeshStandardMaterial({ color: 0x1f3f2d, roughness: 0.6 });
  const stemMesh = new THREE.Mesh(stemGeom, stemMat);
  flowerGroup.add(stemMesh);

  const updateBloom = (stage: number, isExploded: boolean, time: number) => {
    petals.forEach((p, idx) => {
      const init = initialTransforms[idx];
      if (!init) return;

      const bloomTilt = (1 - stage) * (-0.5) + stage * (0.35);
      const sway = Math.sin(time + idx * 0.2) * 0.015;
      p.rotation.x = init.rot.x + bloomTilt + sway;

      if (isExploded) {
        p.position.x = init.pos.x * (1.9 + init.ring * 0.35);
        p.position.z = init.pos.z * (1.9 + init.ring * 0.35);
        p.position.y = init.pos.y + Math.sin(time + idx) * 0.05 + init.ring * 0.12;
      } else {
        p.position.copy(init.pos);
      }
    });
  };

  const updateColors = (newColorOpt: PetalColorOption) => {
    petalMaterial.color.set(newColorOpt.hex);
    petalMaterial.sheenColor.set(newColorOpt.accentHex);
    petalMaterial.needsUpdate = true;
  };

  const dispose = () => {
    petalMaterial.dispose();
    podMat.dispose();
    stemMat.dispose();
    seedMat.dispose();
    podGeom.dispose();
    seedGeom.dispose();
    stemGeom.dispose();
  };

  return {
    group: flowerGroup,
    petals,
    stem: stemMesh,
    sepals: [],
    dewdrops: [],
    centerCore: podMesh,
    variety: 'lotus',
    updateBloom,
    updateColors,
    dispose,
  };
}

export function createFlowerModel(variety: FlowerVariety, colorOpt: PetalColorOption): FlowerMeshGroup {
  switch (variety) {
    case 'rose':
      return buildRoseModel(colorOpt);
    case 'peony':
      return buildPeonyModel(colorOpt);
    case 'orchid':
      return buildOrchidModel(colorOpt);
    case 'lotus':
      return buildLotusModel(colorOpt);
    default:
      return buildRoseModel(colorOpt);
  }
}
