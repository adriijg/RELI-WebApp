import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { svgToImage, supportsWebGL } from '../../utils/kit';

const CAMERA_PRESETS = [
  { id: 'hero', label: '3/4 Estudio', position: [2.6, 0.85, 5.4], target: [0, 0.55, 0] },
  { id: 'front', label: 'Frontal', position: [0, 0.75, 5.6], target: [0, 0.6, 0] },
  { id: 'back', label: 'Espalda', position: [0, 0.75, -5.6], target: [0, 0.6, 0] },
  { id: 'closeup', label: 'Detalle Pecho', position: [0.4, 1.05, 3.2], target: [0, 0.9, 0] },
  { id: 'full', label: 'Cuerpo Entero', position: [2.8, -0.35, 8.8], target: [0, -0.65, 0] },
];

const DISPLAY_MODES = [
  { id: 'shirt', label: 'Camiseta' },
  { id: 'kit', label: 'Uniforme Completo' },
];

/**
 * Generates an anatomical 3D torso half-shell (front or back) with natural pectoral/lat contours,
 * waist taper, sloped shoulders, curved neck opening, and cloth drape folds.
 * UVs map directly to the torso region of ShirtSvg (400x520).
 */
function createTorsoHalfGeometry(isFront = true) {
  const vSegments = 72;
  const uSegments = 64;
  const geometry = new THREE.BufferGeometry();

  const positions = [];
  const uvs = [];
  const indices = [];

  const zSign = isFront ? 1 : -1;

  for (let iv = 0; iv <= vSegments; iv += 1) {
    const v = iv / vSegments; // 0 = bottom hem, 1 = top shoulder/collar
    const yBase = -1.42 + v * 2.84;

    // Anatomical width profile (hip flare -> waist taper -> broad chest/lats -> shoulder slope)
    const hipWidth = 0.98 * (1 - v);
    const waistDip = -0.11 * Math.exp(-Math.pow((v - 0.34) / 0.22, 2));
    const chestBulge = 0.16 * Math.exp(-Math.pow((v - 0.72) / 0.24, 2));
    let rx = 0.98 + waistDip + chestBulge + hipWidth * 0.04;

    // Above v = 0.80, shoulders slope inward toward the neck opening
    if (v > 0.8) {
      const tShoulder = (v - 0.8) / 0.2;
      const smoothS = tShoulder * tShoulder * (3 - 2 * tShoulder);
      rx = THREE.MathUtils.lerp(rx, 0.44, smoothS);
    }

    // Anatomical depth profile (chest fullness in front, shoulder blades in back)
    let rz = 0.52 + 0.14 * Math.exp(-Math.pow((v - 0.68) / 0.28, 2));
    if (v > 0.82) {
      const tNeck = (v - 0.82) / 0.18;
      rz = THREE.MathUtils.lerp(rz, 0.31, tNeck * tNeck);
    }

    for (let iu = 0; iu <= uSegments; iu += 1) {
      // s goes from -1 (left seam) to +1 (right seam)
      const uNorm = iu / uSegments;
      const s = uNorm * 2 - 1;
      const angle = s * (Math.PI / 2); // -pi/2 to +pi/2

      const sinA = Math.sin(angle);
      const cosA = Math.cos(angle);

      // Super-ellipse blend for realistic athletic torso cross-section
      const x = rx * Math.sign(sinA) * Math.pow(Math.abs(sinA), 0.92);
      let z = rz * Math.pow(Math.max(0, cosA), 0.88);

      // Pectoral definition on front chest
      if (isFront) {
        const pecHeight = Math.exp(-Math.pow((v - 0.66) / 0.14, 2));
        const pecSide = Math.exp(-Math.pow((Math.abs(s) - 0.36) / 0.26, 2));
        const sternumValley = -0.022 * Math.exp(-Math.pow(s / 0.12, 2)) * pecHeight;
        z += (0.045 * pecHeight * pecSide + sternumValley) * cosA;
      } else {
        // Upper back trapezius & lat contour, with spine groove
        const backHeight = Math.exp(-Math.pow((v - 0.68) / 0.18, 2));
        const spineValley = -0.018 * Math.exp(-Math.pow(s / 0.14, 2)) * backHeight;
        z += (0.032 * backHeight + spineValley) * cosA;
      }

      // Natural cloth drape folds (vertical hem ripples + diagonal waist tension creases)
      const hemFade = Math.exp(-Math.pow(v / 0.35, 2));
      const hemWave = 0.014 * Math.sin(s * Math.PI * 3.5) * hemFade * cosA;
      const waistFold =
        0.01 *
        Math.sin((v * 14 + Math.abs(s) * 6)) *
        Math.exp(-Math.pow((v - 0.42) / 0.25, 2)) *
        cosA;

      z = (z + hemWave + waistFold) * zSign;

      // Neckline dip at the top center (front dips lower than back)
      let y = yBase;
      const centerWeight = Math.pow(Math.max(0, 1 - Math.pow(s / 0.65, 2)), 1.4);
      if (v > 0.72) {
        const neckFactor = (v - 0.72) / 0.28;
        const dipDepth = isFront ? 0.29 : 0.09;
        y -= dipDepth * centerWeight * Math.pow(neckFactor, 1.7);
      }

      // Drop-tail curved bottom hem
      if (v < 0.15) {
        const hemFactor = 1 - v / 0.15;
        y -= (isFront ? 0.06 : 0.09) * Math.cos(s * (Math.PI / 2)) * hemFactor;
      }

      positions.push(x, y, z);

      // Map UVs cleanly to the ShirtSvg torso area:
      // In ShirtSvg (400x520), torso x is [96..304] -> u in [0.24..0.76]
      // y is [54..486] -> v_svg in [1 - 54/520 .. 1 - 486/520] = [0.896 .. 0.065]
      const uvU = isFront ? 0.245 + uNorm * 0.51 : 0.755 - uNorm * 0.51;
      const uvV = 0.07 + v * 0.825;
      uvs.push(uvU, uvV);
    }
  }

  for (let iv = 0; iv < vSegments; iv += 1) {
    for (let iu = 0; iu < uSegments; iu += 1) {
      const a = iv * (uSegments + 1) + iu;
      const b = a + 1;
      const c = a + (uSegments + 1);
      const d = c + 1;

      if (isFront) {
        indices.push(a, b, d);
        indices.push(a, d, c);
      } else {
        indices.push(a, d, b);
        indices.push(a, c, d);
      }
    }
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * Generates a realistic 3D cylindrical/tubular sleeve starting at the deltoid shoulder socket
 * and angling downward at ~38 degrees with natural arm taper and cloth folds.
 */
function createSculptedSleeveGeometry(side = 'left') {
  const isLeft = side === 'left';
  const sign = isLeft ? -1 : 1;
  const lengthSegments = 36;
  const radialSegments = 48;
  const geometry = new THREE.BufferGeometry();

  const positions = [];
  const uvs = [];
  const indices = [];

  for (let il = 0; il <= lengthSegments; il += 1) {
    const t = il / lengthSegments; // 0 = shoulder socket, 1 = sleeve cuff

    // Spine curve of the sleeve from shoulder socket to cuff
    const cx = sign * (0.76 + t * 0.94);
    const cy = 1.02 - t * 0.82 + 0.05 * Math.sin(t * Math.PI);
    const cz = 0.03 * Math.sin(t * Math.PI);

    // Taper radius from deltoid/armhole to bicep cuff
    const rVert = THREE.MathUtils.lerp(0.41, 0.26, Math.pow(t, 0.85));
    const rDepth = THREE.MathUtils.lerp(0.35, 0.25, Math.pow(t, 0.85));

    // Sleeve axis tangent angle (~39 deg downward)
    const tiltAngle = sign * 0.66;
    const cosTilt = Math.cos(tiltAngle);
    const sinTilt = Math.sin(tiltAngle);

    for (let ir = 0; ir <= radialSegments; ir += 1) {
      const u = ir / radialSegments;
      const theta = u * Math.PI * 2;

      // Local cross-section circle + subtle cloth crease
      const fold = 0.008 * Math.sin(theta * 3 + t * 5) * Math.sin(t * Math.PI);
      const localPerp = (rVert + fold) * Math.cos(theta);
      const localZ = (rDepth + fold) * Math.sin(theta);

      // Rotate perpendicular vector by sleeve tilt angle
      const vx = cx - localPerp * sinTilt;
      const vy = cy + localPerp * cosTilt;
      const vz = cz + localZ;

      positions.push(vx, vy, vz);
      uvs.push(t, u);
    }
  }

  for (let il = 0; il < lengthSegments; il += 1) {
    for (let ir = 0; ir < radialSegments; ir += 1) {
      const a = il * (radialSegments + 1) + ir;
      const b = a + 1;
      const c = a + (radialSegments + 1);
      const d = c + 1;

      if (isLeft) {
        indices.push(a, b, d);
        indices.push(a, d, c);
      } else {
        indices.push(a, d, b);
        indices.push(a, c, d);
      }
    }
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * Generates a 3D saddle-shaped collar ring that follows the exact anatomical neckline
 * (higher on the back nape, dipping down on the front chest).
 */
function createCollarGeometry(collarType = 'round') {
  const radialSegments = 72;
  const heightSegments = 16;
  const geometry = new THREE.BufferGeometry();

  const positions = [];
  const indices = [];

  const isV = collarType === 'vneck' || collarType === 'overlap';
  const isPolo = collarType === 'polo';

  for (let ih = 0; ih <= heightSegments; ih += 1) {
    const v = ih / heightSegments; // 0 = neck seam, 1 = top/outer edge of collar

    for (let ir = 0; ir <= radialSegments; ir += 1) {
      const u = ir / radialSegments;
      const theta = u * Math.PI * 2; // 0 = right, pi/2 = front, pi = left, 3pi/2 = back

      const frontWeight = Math.max(0, Math.sin(theta));
      const vSharpness = isV ? Math.pow(frontWeight, 2.6) : Math.pow(frontWeight, 1.5);

      let rx = 0.45;
      let rz = 0.32;

      if (isPolo) {
        // Folded polo collar flares outward as v goes from 0.4 to 1
        const foldFlare = v > 0.45 ? (v - 0.45) * 0.16 : v * 0.04;
        rx += foldFlare;
        rz += foldFlare;
      } else {
        rx += (1 - v) * 0.025;
        rz += (1 - v) * 0.025;
      }

      const x = rx * Math.cos(theta);
      let z = rz * Math.sin(theta);
      if (isV && frontWeight > 0) {
        z += 0.06 * Math.pow(frontWeight, 2);
      }

      const dipDepth = isV ? 0.31 : 0.25;
      const baseNeckY = 1.41 - dipDepth * vSharpness - (frontWeight === 0 ? 0.04 * (1 - Math.abs(Math.sin(theta))) : 0);
      const collarHeight = isPolo ? (v <= 0.5 ? v * 0.22 : 0.11 - (v - 0.5) * 0.18) : v * 0.11;
      const y = baseNeckY + collarHeight;

      positions.push(x, y, z);
    }
  }

  for (let ih = 0; ih < heightSegments; ih += 1) {
    for (let ir = 0; ir < radialSegments; ir += 1) {
      const a = ih * (radialSegments + 1) + ir;
      const b = a + 1;
      const c = a + (radialSegments + 1);
      const d = c + 1;
      indices.push(a, d, b);
      indices.push(a, c, d);
    }
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * Generates realistic 3D tubular shorts leg geometry with cloth folds.
 */
function createShortsLegGeometry(side = 'left') {
  const sign = side === 'left' ? -1 : 1;
  const vSegments = 32;
  const rSegments = 40;
  const geometry = new THREE.BufferGeometry();
  const positions = [];
  const uvs = [];
  const indices = [];

  for (let iv = 0; iv <= vSegments; iv += 1) {
    const v = iv / vSegments; // 0 = bottom leg opening, 1 = hip/waist
    const y = -1.15 + v * 1.15;
    const cx = sign * THREE.MathUtils.lerp(0.46, 0.34, Math.pow(v, 1.3));
    const rx = THREE.MathUtils.lerp(0.43, 0.52, v);
    const rz = THREE.MathUtils.lerp(0.41, 0.49, v);

    for (let ir = 0; ir <= rSegments; ir += 1) {
      const u = ir / rSegments;
      const theta = u * Math.PI * 2;
      const fold = 0.012 * Math.sin(theta * 5 + v * 4) * (1 - v * 0.5);
      const x = cx + (rx + fold) * Math.cos(theta);
      const z = (rz + fold) * Math.sin(theta);

      positions.push(x, y, z);
      uvs.push(u, v);
    }
  }

  for (let iv = 0; iv < vSegments; iv += 1) {
    for (let ir = 0; ir < rSegments; ir += 1) {
      const a = iv * (rSegments + 1) + ir;
      const b = a + 1;
      const c = a + (rSegments + 1);
      const d = c + 1;
      indices.push(a, d, b);
      indices.push(a, c, d);
    }
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function imageToTexture(image) {
  const width = image.naturalWidth || image.width;
  const height = image.naturalHeight || image.height;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  context.clearRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

function createMicroFabricNormalTexture() {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  const image = context.createImageData(size, size);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const idx = (y * size + x) * 4;
      const knit = Math.sin((x / 2) * Math.PI) * Math.cos((y / 2) * Math.PI) * 18;
      const pore = (x % 4 === 0 && y % 4 === 0) ? -22 : 0;
      const val = THREE.MathUtils.clamp(128 + knit + pore, 0, 255);
      image.data[idx] = val;
      image.data[idx + 1] = val;
      image.data[idx + 2] = val;
      image.data[idx + 3] = 255;
    }
  }

  context.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(16, 20);
  texture.colorSpace = THREE.NoColorSpace;
  return texture;
}

function StudioEnvironment() {
  const { gl, scene } = useThree();
  const sceneRef = useRef(null);

  useEffect(() => {
    sceneRef.current = scene;
    const target = sceneRef.current;
    const pmrem = new THREE.PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const texture = pmrem.fromScene(room, 0.04).texture;
    target.environment = texture;
    target.environmentIntensity = 0.55;
    pmrem.dispose();

    return () => {
      target.environment = null;
      texture.dispose();
      room.traverse((child) => {
        child.geometry?.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else {
          child.material?.dispose();
        }
      });
    };
  }, [gl, scene]);

  return null;
}

function CameraRig({ preset, autoRotate, displayMode }) {
  const { camera, gl } = useThree();
  const controlsRef = useRef(null);

  useEffect(() => {
    const controls = new OrbitControls(camera, gl.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.enablePan = true;
    controls.minDistance = 2.4;
    controls.maxDistance = 14;
    controls.minPolarAngle = Math.PI / 5;
    controls.maxPolarAngle = Math.PI / 1.65;
    controls.target.set(0, 0.55, 0);
    controls.autoRotateSpeed = 0.85;
    controlsRef.current = controls;

    return () => {
      controls.dispose();
      controlsRef.current = null;
    };
  }, [camera, gl]);

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
    }
  }, [autoRotate]);

  useEffect(() => {
    const targetConfig = CAMERA_PRESETS.find((item) => item.id === preset) || CAMERA_PRESETS[0];
    if (targetConfig && controlsRef.current) {
      if (displayMode === 'kit' && preset !== 'closeup') {
        camera.position.set(
          targetConfig.position[0] * 1.15,
          targetConfig.position[1] - 0.6,
          targetConfig.position[2] * 1.45,
        );
        controlsRef.current.target.set(0, -0.45, 0);
      } else {
        camera.position.set(...targetConfig.position);
        controlsRef.current.target.set(...targetConfig.target);
      }
      controlsRef.current.update();
    }
  }, [camera, preset, displayMode]);

  useFrame(() => {
    controlsRef.current?.update();
  });

  return null;
}

function Capture({ onReady, ready }) {
  const { gl, scene, camera } = useThree();

  useEffect(() => {
    if (!onReady) return;
    onReady(() => {
      if (!ready) return null;
      gl.render(scene, camera);
      const source = gl.domElement;
      const canvas = document.createElement('canvas');
      canvas.width = source.width;
      canvas.height = source.height;
      const context = canvas.getContext('2d');
      const gradient = context.createRadialGradient(
        canvas.width / 2,
        canvas.height * 0.4,
        50,
        canvas.width / 2,
        canvas.height * 0.5,
        canvas.width * 0.8,
      );
      gradient.addColorStop(0, '#161F33');
      gradient.addColorStop(1, '#050811');
      context.fillStyle = gradient;
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(source, 0, 0);
      return canvas.toDataURL('image/png');
    });
  }, [camera, gl, onReady, ready, scene]);

  return null;
}

function SculptedShirt3D({ design, textures, fabricBump }) {
  const frontGeo = useMemo(() => createTorsoHalfGeometry(true), []);
  const backGeo = useMemo(() => createTorsoHalfGeometry(false), []);
  const leftSleeveGeo = useMemo(() => createSculptedSleeveGeometry('left'), []);
  const rightSleeveGeo = useMemo(() => createSculptedSleeveGeometry('right'), []);
  const collarGeo = useMemo(() => createCollarGeometry(design.collar), [design.collar]);

  const sleeveBaseColor =
    design.sleeveStyle === 'classic'
      ? design.primary
      : design.sleeveColor || design.panelColor || design.primary;

  const innerColor = useMemo(
    () => new THREE.Color(design.primary).multiplyScalar(0.32),
    [design.primary],
  );

  return (
    <group position={[0, 0.65, 0]}>
      {/* Dark interior mannequin core / inner lining so neck & sleeve holes have realistic depth */}
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.42, 0.88, 2.55, 48, 1, false]} />
        <meshStandardMaterial color={innerColor} roughness={0.98} side={THREE.BackSide} />
      </mesh>

      {/* Front Sculpted Torso */}
      <mesh geometry={frontGeo} castShadow receiveShadow>
        <meshPhysicalMaterial
          map={textures.shirtFront}
          roughness={0.78}
          metalness={0.02}
          sheen={0.35}
          sheenRoughness={0.75}
          sheenColor="#ffffff"
          bumpMap={fabricBump}
          bumpScale={0.008}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Back Sculpted Torso */}
      <mesh geometry={backGeo} castShadow receiveShadow>
        <meshPhysicalMaterial
          map={textures.shirtBack}
          roughness={0.78}
          metalness={0.02}
          sheen={0.35}
          sheenRoughness={0.75}
          sheenColor="#ffffff"
          bumpMap={fabricBump}
          bumpScale={0.008}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Left Tubular 3D Sleeve */}
      <mesh geometry={leftSleeveGeo} castShadow receiveShadow>
        <meshPhysicalMaterial
          color={sleeveBaseColor}
          roughness={0.8}
          metalness={0.02}
          sheen={0.3}
          bumpMap={fabricBump}
          bumpScale={0.009}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Right Tubular 3D Sleeve */}
      <mesh geometry={rightSleeveGeo} castShadow receiveShadow>
        <meshPhysicalMaterial
          color={sleeveBaseColor}
          roughness={0.8}
          metalness={0.02}
          sheen={0.3}
          bumpMap={fabricBump}
          bumpScale={0.009}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Left & Right 3D Ribbed Cuffs */}
      <mesh position={[-1.68, 0.21, 0.01]} rotation={[0, 0, -0.91]} castShadow>
        <torusGeometry args={[0.26, 0.026, 16, 48]} />
        <meshStandardMaterial color={design.accent} roughness={0.65} />
      </mesh>
      <mesh position={[1.68, 0.21, 0.01]} rotation={[0, 0, 0.91]} castShadow>
        <torusGeometry args={[0.26, 0.026, 16, 48]} />
        <meshStandardMaterial color={design.accent} roughness={0.65} />
      </mesh>

      {/* Optional Captain Armband on Left 3D Sleeve */}
      {design.captainArmband && (
        <mesh position={[-1.38, 0.48, 0.02]} rotation={[0, 0, -0.91]} castShadow>
          <cylinderGeometry args={[0.315, 0.30, 0.22, 40, 1, true]} />
          <meshStandardMaterial color={design.captainColor || '#FACC15'} roughness={0.5} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* 3D Saddle Collar */}
      <mesh geometry={collarGeo} castShadow receiveShadow>
        <meshStandardMaterial
          color={design.accent}
          roughness={0.68}
          metalness={0.04}
          bumpMap={fabricBump}
          bumpScale={0.005}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

function SculptedShortsAndSocks3D({ design, fabricBump }) {
  const leftLegGeo = useMemo(() => createShortsLegGeometry('left'), []);
  const rightLegGeo = useMemo(() => createShortsLegGeometry('right'), []);

  return (
    <group position={[0, -0.82, 0]}>
      {/* Gathered elastic waistband */}
      <mesh position={[0, 0.02, 0]} scale={[1, 1, 0.58]} castShadow>
        <cylinderGeometry args={[0.92, 0.95, 0.2, 56]} />
        <meshStandardMaterial
          color={design.shortsColor}
          roughness={0.82}
          bumpMap={fabricBump}
          bumpScale={0.01}
        />
      </mesh>

      {/* Left & Right Tubular Shorts Legs */}
      <mesh geometry={leftLegGeo} castShadow receiveShadow>
        <meshPhysicalMaterial
          color={design.shortsColor}
          roughness={0.8}
          sheen={0.28}
          bumpMap={fabricBump}
          bumpScale={0.009}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh geometry={rightLegGeo} castShadow receiveShadow>
        <meshPhysicalMaterial
          color={design.shortsColor}
          roughness={0.8}
          sheen={0.28}
          bumpMap={fabricBump}
          bumpScale={0.009}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Shorts Hem Accent Rings */}
      <mesh position={[-0.46, -1.13, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 0.95, 1]}>
        <torusGeometry args={[0.43, 0.018, 12, 48]} />
        <meshStandardMaterial color={design.accent} roughness={0.65} />
      </mesh>
      <mesh position={[0.46, -1.13, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 0.95, 1]}>
        <torusGeometry args={[0.43, 0.018, 12, 48]} />
        <meshStandardMaterial color={design.accent} roughness={0.65} />
      </mesh>

      {/* Anatomical Calves & Socks */}
      {[-0.46, 0.46].map((xPos, idx) => (
        <group key={idx} position={[xPos, -1.25, 0]}>
          {/* Top Sock Fold Cuff */}
          <mesh position={[0, -0.12, 0]} castShadow>
            <cylinderGeometry args={[0.22, 0.215, 0.24, 36]} />
            <meshStandardMaterial color={design.socksStripeColor || design.secondary} roughness={0.85} />
          </mesh>
          {/* Accent Stripe */}
          <mesh position={[0, -0.25, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.214, 0.014, 12, 36]} />
            <meshStandardMaterial color={design.accent} roughness={0.6} />
          </mesh>
          {/* Main Anatomical Calf Sock */}
          <mesh position={[0, -0.82, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.21, 0.145, 1.15, 36]} />
            <meshPhysicalMaterial
              color={design.socksColor}
              roughness={0.85}
              sheen={0.25}
              bumpMap={fabricBump}
              bumpScale={0.008}
            />
          </mesh>
          {/* Sleek Sculpted Foot Form (organic capsule, not a blocky box) */}
          <mesh position={[0, -1.42, 0.12]} rotation={[Math.PI / 2.15, 0, 0]} castShadow>
            <capsuleGeometry args={[0.135, 0.28, 16, 28]} />
            <meshStandardMaterial color={design.socksColor} roughness={0.82} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export default function KitPreview3D({
  design,
  crestDataUrl,
  shirtFrontRef,
  shirtBackRef,
  shortsFrontRef,
  shortsBackRef,
  onCaptureReady,
  className = '',
}) {
  const [textures, setTextures] = useState(null);
  const [textureError, setTextureError] = useState(false);
  const [preset, setPreset] = useState('hero');
  const [displayMode, setDisplayMode] = useState('shirt');
  const [autoRotate, setAutoRotate] = useState(true);
  const texturesRef = useRef(null);
  const fabricBump = useMemo(() => createMicroFabricNormalTexture(), []);
  const webgl = useMemo(() => supportsWebGL(), []);

  useEffect(() => () => fabricBump.dispose(), [fabricBump]);

  useEffect(() => {
    let cancelled = false;

    const timer = window.setTimeout(async () => {
      if (!shirtFrontRef.current || !shirtBackRef.current) {
        return;
      }

      setTextureError(false);

      try {
        const [frontImage, backImage] = await Promise.all([
          svgToImage(shirtFrontRef.current, 1024, 1330),
          svgToImage(shirtBackRef.current, 1024, 1330),
        ]);

        if (cancelled) return;

        const nextTextures = {
          shirtFront: imageToTexture(frontImage),
          shirtBack: imageToTexture(backImage),
        };

        if (texturesRef.current) {
          Object.values(texturesRef.current).forEach((texture) => texture.dispose());
        }
        texturesRef.current = nextTextures;
        setTextures(nextTextures);
      } catch {
        if (!cancelled) setTextureError(true);
      }
    }, 90);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [crestDataUrl, design, shirtBackRef, shirtFrontRef, shortsBackRef, shortsFrontRef]);

  useEffect(
    () => () => {
      if (texturesRef.current) {
        Object.values(texturesRef.current).forEach((texture) => texture.dispose());
        texturesRef.current = null;
      }
    },
    [],
  );

  if (!webgl) {
    return (
      <div className="flex h-full min-h-[420px] items-center justify-center rounded-2xl border border-dashed border-card-border bg-muted/5 p-6 text-center">
        <p className="max-w-sm text-sm font-bold text-muted-foreground">
          Tu navegador no tiene WebGL activo. La vista 2D fotorrealista sigue disponible.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`relative h-full min-h-[560px] overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_50%_30%,rgba(30,41,59,0.85),rgba(5,8,17,0.98)_72%)] ${className}`}
    >
      {/* Subtle FIFA Kit Creator studio vignette & floor reflection */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(217,25,41,0.12),transparent_55%)]" />

      <Canvas
        shadows
        dpr={[1, 1.75]}
        camera={{ position: [2.6, 0.85, 5.4], fov: 32, near: 0.1, far: 100 }}
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.08;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
        }}
      >
        <StudioEnvironment />
        <CameraRig preset={preset} autoRotate={autoRotate} displayMode={displayMode} />

        {/* 3-Point Studio Garment Lighting */}
        <ambientLight intensity={0.42} />
        <directionalLight
          castShadow
          position={[4, 6, 5]}
          intensity={2.4}
          shadow-mapSize-width={1536}
          shadow-mapSize-height={1536}
          shadow-normalBias={0.02}
        />
        <directionalLight position={[-4.5, 3, -3.5]} intensity={1.35} color="#E2E8F0" />
        <directionalLight position={[3.5, 2, -4.5]} intensity={1.1} color="#C9A259" />
        <pointLight position={[0, -1.5, 3.5]} intensity={0.45} color="#FFFFFF" />

        {textures ? (
          <group>
            <SculptedShirt3D design={design} textures={textures} fabricBump={fabricBump} />
            {displayMode === 'kit' && (
              <SculptedShortsAndSocks3D design={design} fabricBump={fabricBump} />
            )}
          </group>
        ) : null}

        <Capture onReady={onCaptureReady} ready={Boolean(textures)} />
      </Canvas>

      {/* Top-Left Camera Angle Bar */}
      <div className="absolute left-3 top-3 z-10 flex flex-wrap items-center gap-1 rounded-xl border border-white/10 bg-slate-950/80 p-1 backdrop-blur-md">
        {CAMERA_PRESETS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setPreset(item.id)}
            className={`rounded-lg px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] transition ${
              preset === item.id
                ? 'bg-re-rojo text-white shadow-sm'
                : 'text-white/65 hover:bg-white/10 hover:text-white'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Top-Right Display Mode (Shirt vs Full Kit) + Auto-Rotate */}
      <div className="absolute right-3 top-3 z-10 flex flex-wrap items-center gap-1.5">
        <div className="flex rounded-xl border border-white/10 bg-slate-950/80 p-1 backdrop-blur-md">
          {DISPLAY_MODES.map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => setDisplayMode(mode.id)}
              className={`rounded-lg px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] transition ${
                displayMode === mode.id
                  ? 'bg-white/15 text-white'
                  : 'text-white/55 hover:text-white'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setAutoRotate((prev) => !prev)}
          className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] backdrop-blur-md transition ${
            autoRotate
              ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300'
              : 'border-white/10 bg-slate-950/80 text-white/65 hover:text-white'
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${autoRotate ? 'animate-pulse bg-emerald-400' : 'bg-white/40'}`} />
          {autoRotate ? 'Giro 360°' : 'Pausado'}
        </button>
      </div>

      {!textures && !textureError ? (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/30 backdrop-blur-[2px]">
          <div className="flex items-center gap-3 rounded-full border border-white/10 bg-slate-950/80 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-white/85">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-re-dorado border-t-transparent" />
            Renderizando tejido 3D...
          </div>
        </div>
      ) : null}

      {textureError ? (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/75 p-6 text-center">
          <p className="max-w-sm text-sm font-bold text-white/80">
            No se pudo generar la textura 3D. Cambia a la vista 2D o recarga la página.
          </p>
        </div>
      ) : null}

      <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-black/45 px-3.5 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-white/55 backdrop-blur-sm">
        Arrastra para rotar · Rueda para zoom · Clic derecho para desplazar
      </div>
    </div>
  );
}
