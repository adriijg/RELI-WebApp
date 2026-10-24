import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { svgToImage, supportsWebGL } from '../../utils/kit';

const SHIRT_SCALE = 0.01;
const SHIRT_CENTER = { x: 200, y: 250 };
const SHIRT_VIEW = { width: 400, height: 520 };
const SHIRT_DEPTH = 0.18;
const SHIRT_BEVEL = 0.026;
const SHIRT_FRONT_Z = SHIRT_DEPTH / 2 + SHIRT_BEVEL;
const SHIRT_DECAL_Z = SHIRT_FRONT_Z + 0.004;
const SHIRT_HALF = (SHIRT_VIEW.width / 2) * SHIRT_SCALE;

const SHORTS_SCALE = 0.011;
const SHORTS_CENTER = { x: 150, y: 110 };
const SHORTS_VIEW = { width: 300, height: 220 };
const SHORTS_DEPTH = 0.16;
const SHORTS_BEVEL = 0.022;
const SHORTS_FRONT_Z = SHORTS_DEPTH / 2 + SHORTS_BEVEL;
const SHORTS_DECAL_Z = SHORTS_FRONT_Z + 0.004;
const SHORTS_HALF = (SHORTS_VIEW.width / 2) * SHORTS_SCALE;

function shirtPoint(x, y) {
  return [(x - SHIRT_CENTER.x) * SHIRT_SCALE, (SHIRT_CENTER.y - y) * SHIRT_SCALE];
}

function shortsPoint(x, y) {
  return [(x - SHORTS_CENTER.x) * SHORTS_SCALE, (SHORTS_CENTER.y - y) * SHORTS_SCALE];
}

function shirtBulge(x, y) {
  const nx = THREE.MathUtils.clamp(x / SHIRT_HALF, -1, 1);
  const edge = Math.pow(Math.cos((nx * Math.PI) / 2), 1.6);
  const chest = 0.055 * Math.exp(-Math.pow((y - 0.25) / 0.7, 2));
  const waist = -0.015 * Math.exp(-Math.pow((y + 0.55) / 0.5, 2));
  return (0.16 + chest + waist) * edge;
}

function shortsBulge(x) {
  const nx = THREE.MathUtils.clamp(x / SHORTS_HALF, -1, 1);
  return 0.075 * Math.pow(Math.cos((nx * Math.PI) / 2), 1.5);
}

function createShirtShape() {
  const shape = new THREE.Shape();
  let point = shirtPoint(132, 84);
  shape.moveTo(point[0], point[1]);
  shape.bezierCurveTo(...shirtPoint(132, 84), ...shirtPoint(156, 68), ...shirtPoint(200, 68));
  shape.bezierCurveTo(...shirtPoint(244, 68), ...shirtPoint(268, 84), ...shirtPoint(268, 84));
  point = shirtPoint(322, 102);
  shape.lineTo(point[0], point[1]);
  point = shirtPoint(372, 176);
  shape.lineTo(point[0], point[1]);
  point = shirtPoint(330, 206);
  shape.lineTo(point[0], point[1]);
  point = shirtPoint(300, 166);
  shape.lineTo(point[0], point[1]);
  point = shirtPoint(300, 462);
  shape.lineTo(point[0], point[1]);
  shape.bezierCurveTo(...shirtPoint(300, 480), ...shirtPoint(278, 492), ...shirtPoint(200, 492));
  shape.bezierCurveTo(...shirtPoint(122, 492), ...shirtPoint(100, 480), ...shirtPoint(100, 462));
  point = shirtPoint(100, 166);
  shape.lineTo(point[0], point[1]);
  point = shirtPoint(70, 206);
  shape.lineTo(point[0], point[1]);
  point = shirtPoint(28, 176);
  shape.lineTo(point[0], point[1]);
  point = shirtPoint(78, 102);
  shape.lineTo(point[0], point[1]);
  shape.closePath();
  return shape;
}

function createShortsShape() {
  const shape = new THREE.Shape();
  const points = [
    [70, 20], [230, 20], [238, 80], [205, 80], [198, 200],
    [158, 200], [150, 112], [142, 200], [102, 200], [95, 80], [62, 80],
  ];
  points.forEach(([x, y], index) => {
    const point = shortsPoint(x, y);
    if (index === 0) shape.moveTo(point[0], point[1]);
    else shape.lineTo(point[0], point[1]);
  });
  shape.closePath();
  return shape;
}

function createShellGeometry(shape, depth, bevel, bulgeFn) {
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 3,
    curveSegments: 32,
  });
  geometry.translate(0, 0, -depth / 2);
  geometry.computeVertexNormals();
  const position = geometry.attributes.position;
  const normal = geometry.attributes.normal;

  for (let index = 0; index < position.count; index += 1) {
    const z = position.getZ(index);
    const nz = normal.getZ(index);
    const bulge = bulgeFn(position.getX(index), position.getY(index));
    position.setZ(index, z + nz * bulge);
  }

  position.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

function createDecalGeometry(view, scale, bulgeFn, widthSegments, heightSegments) {
  const geometry = new THREE.PlaneGeometry(
    view.width * scale,
    view.height * scale,
    widthSegments,
    heightSegments,
  );
  const position = geometry.attributes.position;

  for (let index = 0; index < position.count; index += 1) {
    position.setZ(index, bulgeFn(position.getX(index), position.getY(index)));
  }

  position.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

function createSurfaceTube(points, pointFn, bulgeFn, zBase, zSign, radius) {
  const curvePoints = points.map(([x, y]) => {
    const [worldX, worldY] = pointFn(x, y);
    return new THREE.Vector3(
      worldX,
      worldY,
      zSign * (zBase + bulgeFn(worldX, worldY) + 0.004),
    );
  });
  const curve = new THREE.CatmullRomCurve3(curvePoints);
  return new THREE.TubeGeometry(curve, Math.max(12, points.length * 6), radius, 8, false);
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

function createFabricBumpTexture() {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  const image = context.createImageData(size, size);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const index = (y * size + x) * 4;
      const weave = ((x + y) % 4 < 2 ? 18 : 0) + ((x - y + size) % 6 < 3 ? 8 : 0);
      const value = Math.min(255, 108 + weave + Math.random() * 16);
      image.data[index] = value;
      image.data[index + 1] = value;
      image.data[index + 2] = value;
      image.data[index + 3] = 255;
    }
  }

  context.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(7, 9);
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
    target.environmentIntensity = 0.5;
    pmrem.dispose();

    return () => {
      target.environment = null;
      texture.dispose();
      room.traverse((child) => {
        child.geometry?.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((material) => material.dispose());
        } else {
          child.material?.dispose();
        }
      });
    };
  }, [gl, scene]);

  return null;
}

function Controls() {
  const { camera, gl } = useThree();
  const controlsRef = useRef(null);

  useEffect(() => {
    const controls = new OrbitControls(camera, gl.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.minDistance = 9;
    controls.maxDistance = 20;
    controls.minPolarAngle = Math.PI / 3.1;
    controls.maxPolarAngle = Math.PI / 1.85;
    controls.target.set(0, 0.45, 0);
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.6;
    controls.update();
    controlsRef.current = controls;

    return () => {
      controls.dispose();
      controlsRef.current = null;
    };
  }, [camera, gl]);

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
      const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#111827');
      gradient.addColorStop(1, '#020617');
      context.fillStyle = gradient;
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(source, 0, 0);
      return canvas.toDataURL('image/png');
    });
  }, [camera, gl, onReady, ready, scene]);

  return null;
}

function Collar({ design }) {
  return (
    <group position={[0, 1.83, 0]}>
      <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.24, 40]} />
        <meshStandardMaterial color="#05070d" roughness={1} metalness={0} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.22, 0.34, 48]} />
        <meshStandardMaterial color={design.primary} roughness={0.92} metalness={0} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.34, 0.045, 14, 64]} />
        <meshStandardMaterial color={design.accent} roughness={0.62} metalness={0.08} envMapIntensity={0.8} />
      </mesh>
    </group>
  );
}

function ShirtModel({ design, textures, fabricBump }) {
  const shape = useMemo(() => createShirtShape(), []);
  const shellGeometry = useMemo(
    () => createShellGeometry(shape, SHIRT_DEPTH, SHIRT_BEVEL, shirtBulge),
    [shape],
  );
  const decalGeometry = useMemo(
    () => createDecalGeometry(SHIRT_VIEW, SHIRT_SCALE, shirtBulge, 56, 72),
    [],
  );
  const cuffsFront = useMemo(
    () => [
      createSurfaceTube([[330, 206], [351, 191], [372, 176]], shirtPoint, shirtBulge, SHIRT_FRONT_Z, 1, 0.022),
      createSurfaceTube([[70, 206], [49, 191], [28, 176]], shirtPoint, shirtBulge, SHIRT_FRONT_Z, 1, 0.022),
    ],
    [],
  );
  const cuffsBack = useMemo(
    () => [
      createSurfaceTube([[330, 206], [351, 191], [372, 176]], shirtPoint, shirtBulge, SHIRT_FRONT_Z, -1, 0.022),
      createSurfaceTube([[70, 206], [49, 191], [28, 176]], shirtPoint, shirtBulge, SHIRT_FRONT_Z, -1, 0.022),
    ],
    [],
  );
  const hemPoints = useMemo(
    () => [[100, 462], [120, 480], [160, 490], [200, 492], [240, 490], [280, 480], [300, 462]],
    [],
  );
  const hemFront = useMemo(
    () => createSurfaceTube(hemPoints, shirtPoint, shirtBulge, SHIRT_FRONT_Z, 1, 0.012),
    [hemPoints],
  );
  const hemBack = useMemo(
    () => createSurfaceTube(hemPoints, shirtPoint, shirtBulge, SHIRT_FRONT_Z, -1, 0.012),
    [hemPoints],
  );
  const shellColor = useMemo(
    () => new THREE.Color(design.primary).multiplyScalar(0.68),
    [design.primary],
  );

  return (
    <group>
      <mesh geometry={shellGeometry} castShadow receiveShadow>
        <meshStandardMaterial
          color={shellColor}
          roughness={0.95}
          metalness={0}
          bumpMap={fabricBump}
          bumpScale={0.012}
          envMapIntensity={0.35}
        />
      </mesh>
      <mesh geometry={decalGeometry} position={[0, 0, SHIRT_DECAL_Z]} receiveShadow>
        <meshStandardMaterial
          map={textures.shirtFront}
          transparent
          alphaTest={0.06}
          roughness={0.92}
          metalness={0}
          bumpMap={fabricBump}
          bumpScale={0.006}
          envMapIntensity={0.25}
        />
      </mesh>
      <mesh geometry={decalGeometry} position={[0, 0, -SHIRT_DECAL_Z]} rotation={[0, Math.PI, 0]} receiveShadow>
        <meshStandardMaterial
          map={textures.shirtBack}
          transparent
          alphaTest={0.06}
          roughness={0.92}
          metalness={0}
          bumpMap={fabricBump}
          bumpScale={0.006}
          envMapIntensity={0.25}
        />
      </mesh>
      {cuffsFront.map((geometry, index) => (
        <mesh key={`cuff-front-${index}`} geometry={geometry} castShadow>
          <meshStandardMaterial color={design.accent} roughness={0.62} metalness={0.08} envMapIntensity={0.8} />
        </mesh>
      ))}
      {cuffsBack.map((geometry, index) => (
        <mesh key={`cuff-back-${index}`} geometry={geometry} castShadow>
          <meshStandardMaterial color={design.accent} roughness={0.62} metalness={0.08} envMapIntensity={0.8} />
        </mesh>
      ))}
      <mesh geometry={hemFront} castShadow>
        <meshStandardMaterial color={design.secondary} roughness={0.75} metalness={0} envMapIntensity={0.4} />
      </mesh>
      <mesh geometry={hemBack} castShadow>
        <meshStandardMaterial color={design.secondary} roughness={0.75} metalness={0} envMapIntensity={0.4} />
      </mesh>
      <Collar design={design} />
    </group>
  );
}

function ShortsModel({ design, textures, fabricBump }) {
  const shape = useMemo(() => createShortsShape(), []);
  const shellGeometry = useMemo(
    () => createShellGeometry(shape, SHORTS_DEPTH, SHORTS_BEVEL, shortsBulge),
    [shape],
  );
  const decalGeometry = useMemo(
    () => createDecalGeometry(SHORTS_VIEW, SHORTS_SCALE, shortsBulge, 48, 36),
    [],
  );
  const waistbandFront = useMemo(
    () => createSurfaceTube([[70, 20], [150, 20], [230, 20]], shortsPoint, shortsBulge, SHORTS_FRONT_Z, 1, 0.018),
    [],
  );
  const waistbandBack = useMemo(
    () => createSurfaceTube([[70, 20], [150, 20], [230, 20]], shortsPoint, shortsBulge, SHORTS_FRONT_Z, -1, 0.018),
    [],
  );
  const hemsFront = useMemo(
    () => [
      createSurfaceTube([[102, 200], [122, 200], [142, 200]], shortsPoint, shortsBulge, SHORTS_FRONT_Z, 1, 0.01),
      createSurfaceTube([[158, 200], [178, 200], [198, 200]], shortsPoint, shortsBulge, SHORTS_FRONT_Z, 1, 0.01),
    ],
    [],
  );
  const hemsBack = useMemo(
    () => [
      createSurfaceTube([[102, 200], [122, 200], [142, 200]], shortsPoint, shortsBulge, SHORTS_FRONT_Z, -1, 0.01),
      createSurfaceTube([[158, 200], [178, 200], [198, 200]], shortsPoint, shortsBulge, SHORTS_FRONT_Z, -1, 0.01),
    ],
    [],
  );
  const shellColor = useMemo(
    () => new THREE.Color(design.shortsColor).multiplyScalar(0.68),
    [design.shortsColor],
  );

  return (
    <group>
      <mesh geometry={shellGeometry} castShadow receiveShadow>
        <meshStandardMaterial
          color={shellColor}
          roughness={0.95}
          metalness={0}
          bumpMap={fabricBump}
          bumpScale={0.012}
          envMapIntensity={0.35}
        />
      </mesh>
      <mesh geometry={decalGeometry} position={[0, 0, SHORTS_DECAL_Z]} receiveShadow>
        <meshStandardMaterial
          map={textures.shortsFront}
          transparent
          alphaTest={0.06}
          roughness={0.92}
          metalness={0}
          bumpMap={fabricBump}
          bumpScale={0.006}
          envMapIntensity={0.25}
        />
      </mesh>
      <mesh geometry={decalGeometry} position={[0, 0, -SHORTS_DECAL_Z]} rotation={[0, Math.PI, 0]} receiveShadow>
        <meshStandardMaterial
          map={textures.shortsBack}
          transparent
          alphaTest={0.06}
          roughness={0.92}
          metalness={0}
          bumpMap={fabricBump}
          bumpScale={0.006}
          envMapIntensity={0.25}
        />
      </mesh>
      <mesh geometry={waistbandFront} castShadow>
        <meshStandardMaterial color={design.accent} roughness={0.7} metalness={0.05} envMapIntensity={0.6} />
      </mesh>
      <mesh geometry={waistbandBack} castShadow>
        <meshStandardMaterial color={design.accent} roughness={0.7} metalness={0.05} envMapIntensity={0.6} />
      </mesh>
      {hemsFront.map((geometry, index) => (
        <mesh key={`hem-front-${index}`} geometry={geometry} castShadow>
          <meshStandardMaterial color={design.secondary} roughness={0.78} metalness={0} envMapIntensity={0.4} />
        </mesh>
      ))}
      {hemsBack.map((geometry, index) => (
        <mesh key={`hem-back-${index}`} geometry={geometry} castShadow>
          <meshStandardMaterial color={design.secondary} roughness={0.78} metalness={0} envMapIntensity={0.4} />
        </mesh>
      ))}
    </group>
  );
}

function Podium() {
  return (
    <group position={[0, -3.45, 0]}>
      <mesh receiveShadow>
        <cylinderGeometry args={[2.7, 2.85, 0.3, 72]} />
        <meshStandardMaterial color="#0a1220" roughness={0.52} metalness={0.4} envMapIntensity={0.7} />
      </mesh>
      <mesh position={[0, 0.155, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.68, 0.018, 8, 96]} />
        <meshStandardMaterial color="#C19A5B" roughness={0.32} metalness={0.85} envMapIntensity={1.1} />
      </mesh>
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
  const texturesRef = useRef(null);
  const fabricBump = useMemo(() => createFabricBumpTexture(), []);
  const webgl = useMemo(() => supportsWebGL(), []);

  useEffect(() => () => fabricBump.dispose(), [fabricBump]);

  useEffect(() => {
    let cancelled = false;

    const timer = window.setTimeout(async () => {
      if (!shirtFrontRef.current || !shirtBackRef.current || !shortsFrontRef.current || !shortsBackRef.current) {
        return;
      }

      setTextureError(false);

      try {
        const [frontImage, backImage, shortsFrontImage, shortsBackImage] = await Promise.all([
          svgToImage(shirtFrontRef.current, 900, 1170),
          svgToImage(shirtBackRef.current, 900, 1170),
          svgToImage(shortsFrontRef.current, 660, 484),
          svgToImage(shortsBackRef.current, 660, 484),
        ]);

        if (cancelled) return;

        const nextTextures = {
          shirtFront: imageToTexture(frontImage),
          shirtBack: imageToTexture(backImage),
          shortsFront: imageToTexture(shortsFrontImage),
          shortsBack: imageToTexture(shortsBackImage),
        };

        if (texturesRef.current) {
          Object.values(texturesRef.current).forEach((texture) => texture.dispose());
        }
        texturesRef.current = nextTextures;
        setTextures(nextTextures);
      } catch {
        if (!cancelled) setTextureError(true);
      }
    }, 140);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [crestDataUrl, design, shirtBackRef, shirtFrontRef, shortsBackRef, shortsFrontRef]);

  useEffect(() => () => {
    if (texturesRef.current) {
      Object.values(texturesRef.current).forEach((texture) => texture.dispose());
      texturesRef.current = null;
    }
  }, []);

  if (!webgl) {
    return (
      <div className="flex h-full min-h-[420px] items-center justify-center rounded-2xl border border-dashed border-card-border bg-muted/5 p-6 text-center">
        <p className="max-w-sm text-sm font-bold text-muted-foreground">
          Tu navegador no tiene WebGL activo. La vista 2D sigue disponible.
        </p>
      </div>
    );
  }

  return (
    <div className={`relative h-full min-h-[520px] overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_50%_22%,rgba(226,29,44,0.16),transparent_58%),linear-gradient(145deg,rgba(15,23,42,0.96),rgba(2,6,23,0.99))] ${className}`}>
      <Canvas
        shadows
        dpr={[1, 1.6]}
        camera={{ position: [4.2, 1.3, 12.5], fov: 34, near: 0.1, far: 100 }}
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.06;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
        }}
      >
        <StudioEnvironment />
        <Controls />
        <ambientLight intensity={0.32} />
        <directionalLight
          castShadow
          position={[4.5, 7.5, 6]}
          intensity={2.6}
          shadow-mapSize-width={1536}
          shadow-mapSize-height={1536}
          shadow-camera-near={1}
          shadow-camera-far={30}
          shadow-camera-left={-6}
          shadow-camera-right={6}
          shadow-camera-top={8}
          shadow-camera-bottom={-6}
          shadow-normalBias={0.03}
        />
        <directionalLight position={[-5, 3, -4]} intensity={1.25} color="#C19A5B" />
        <directionalLight position={[-4, 4, -7]} intensity={1.6} color="#BFDBFE" />
        <pointLight position={[0, -2, 5]} intensity={0.55} color="#FFFFFF" />
        <spotLight position={[0, 8, 1]} angle={0.55} penumbra={1} intensity={1.1} color="#FFFFFF" />

        {textures ? (
          <>
            <group position={[0, 2.2, 0]}>
              <ShirtModel design={design} textures={textures} fabricBump={fabricBump} />
            </group>
            <group position={[0, -0.85, 0]}>
              <ShortsModel design={design} textures={textures} fabricBump={fabricBump} />
            </group>
          </>
        ) : null}

        <Podium />

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3.29, 0]} receiveShadow>
          <planeGeometry args={[7, 7]} />
          <shadowMaterial transparent opacity={0.24} />
        </mesh>

        <Capture onReady={onCaptureReady} ready={Boolean(textures)} />
      </Canvas>

      {!textures && !textureError ? (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/20 backdrop-blur-[1px]">
          <div className="flex items-center gap-3 rounded-full border border-white/10 bg-slate-950/70 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-white/80">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-re-dorado border-t-transparent" />
            Preparando 3D
          </div>
        </div>
      ) : null}

      {textureError ? (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/70 p-6 text-center">
          <p className="max-w-sm text-sm font-bold text-white/80">
            No se pudo generar la textura 3D. Prueba a recargar o usa la vista 2D.
          </p>
        </div>
      ) : null}

      <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-white/60 backdrop-blur-sm">
        Arrastra para girar
      </div>
    </div>
  );
}
