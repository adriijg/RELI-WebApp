import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { svgToImage, supportsWebGL } from '../../utils/kit';

const DISPLAY_MODES = [
  { id: 'full', label: '🧍 Kit Completo' },
  { id: 'shirt', label: '👕 Solo Camiseta' },
  { id: 'shorts', label: '🩳 Camiseta + Short' },
];

const CAMERA_PRESETS = [
  { id: 'hero', label: '3/4 Estudio', position: [1.95, 0.15, 5.2], target: [0, 0.02, 0] },
  { id: 'front', label: 'Frontal', position: [0, 0.1, 5.4], target: [0, 0.02, 0] },
  { id: 'back', label: 'Espalda', position: [0, 0.1, -5.4], target: [0, 0.02, 0] },
  { id: 'side', label: 'Lateral', position: [-4.8, 0.1, 1.6], target: [0, 0.02, 0] },
  { id: 'closeup', label: 'Detalle Pecho', position: [0.2, 0.42, 2.9], target: [0, 0.32, 0] },
  { id: 'bottoms', label: 'Short & Medias', position: [1.3, -1.9, 4.8], target: [0, -1.9, 0] },
];

/**
 * 1. Builds the 2048x2048 UV Texture Atlas for `T_Shirt_male`
 */
function buildShirtUvAtlasTexture(frontImage, backImage, design) {
  const size = 2048;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  ctx.fillStyle = design.primary;
  ctx.fillRect(0, 0, size, size);

  const imgW = frontImage.naturalWidth || frontImage.width;
  const imgH = frontImage.naturalHeight || frontImage.height;

  const sx = Math.round((60 / 400) * imgW);
  const sy = Math.round((42 / 520) * imgH);
  const sw = Math.round((280 / 400) * imgW);
  const sh = Math.round((448 / 520) * imgH);

  // Front Torso Island
  ctx.drawImage(frontImage, sx, sy, sw, sh, 42, 37, 983, 1436);

  // Back Torso Island
  ctx.drawImage(backImage, sx, sy, sw, sh, 1036, 43, 982, 1430);

  // Right & Left Sleeves
  const sleeveFill =
    design.sleeveStyle === 'classic'
      ? design.primary
      : design.sleeveColor || design.panelColor || design.primary;

  const sleeves = [
    { x: 24, w: 764, ridgeX: 426, isRightSleeve: true },
    { x: 790, w: 760, ridgeX: 1178, isRightSleeve: false },
  ];

  sleeves.forEach((slv) => {
    ctx.save();
    ctx.beginPath();
    ctx.rect(slv.x, 1478, slv.w, 444);
    ctx.clip();

    if (design.patternOnSleeves) {
      ctx.drawImage(frontImage, sx, sy, sw, Math.round(sh * 0.55), slv.x, 1478, slv.w, 444);
    } else {
      ctx.fillStyle = sleeveFill;
      ctx.fillRect(slv.x, 1478, slv.w, 444);
    }

    if (design.shoulderStripes === 'three-stripes') {
      ctx.fillStyle = design.accent;
      [-24, 0, 24].forEach((offset) => {
        ctx.fillRect(slv.ridgeX + offset - 6, 1478, 12, 365);
      });
    } else if (design.shoulderStripes === 'panel') {
      ctx.fillStyle = design.secondary;
      ctx.fillRect(slv.ridgeX - 42, 1478, 84, 340);
    } else if (design.shoulderStripes === 'piping') {
      ctx.fillStyle = design.accent;
      ctx.fillRect(slv.x, 1478, slv.w, 16);
    }

    if (slv.isRightSleeve && design.sleeveBadge && design.sleeveBadge !== 'none') {
      const bx = slv.ridgeX - 45;
      const by = 1715;
      ctx.beginPath();
      ctx.arc(bx, by, 44, 0, Math.PI * 2);
      ctx.fillStyle =
        design.sleeveBadge === 'champions'
          ? '#C9A259'
          : design.sleeveBadge === 'respect'
            ? '#0284C7'
            : '#FFFFFF';
      ctx.fill();
      ctx.lineWidth = 6;
      ctx.strokeStyle = '#0F172A';
      ctx.stroke();

      ctx.fillStyle = '#0F172A';
      ctx.font = '900 22px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        design.sleeveBadge === 'champions' ? 'CHAMP' : design.sleeveBadge === 'respect' ? 'FAIR' : 'FFM',
        bx,
        by,
      );
    }

    if (!slv.isRightSleeve && design.captainArmband) {
      ctx.fillStyle = design.captainColor || '#FACC15';
      ctx.fillRect(slv.x, 1685, slv.w, 92);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(slv.x, 1685, slv.w, 12);
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(slv.x, 1765, slv.w, 12);

      ctx.fillStyle = '#0F172A';
      ctx.font = '900 54px Arial Black, Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('C', slv.ridgeX - 40, 1732);
    }

    ctx.fillStyle = design.accent;
    ctx.fillRect(slv.x, 1852, slv.w, 70);

    if (design.cuffStyle === 'double') {
      ctx.fillStyle = design.secondary;
      ctx.fillRect(slv.x, 1880, slv.w, 14);
    } else if (design.cuffStyle === 'tricolor') {
      ctx.fillStyle = design.secondary;
      ctx.fillRect(slv.x, 1868, slv.w, 16);
      ctx.fillStyle = design.tertiary || '#0F172A';
      ctx.fillRect(slv.x, 1886, slv.w, 16);
    }

    ctx.restore();
  });

  // Collar Ribbed Band Island
  ctx.fillStyle = design.accent;
  ctx.fillRect(0, 1925, size, 123);
  if (design.cuffStyle !== 'solid' || design.collar !== 'round') {
    ctx.fillStyle = design.secondary;
    ctx.fillRect(0, 1952, size, 12);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.flipY = false;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

/**
 * 2. Builds the 1024x1024 360-degree UV Texture Atlas for `Shorts_Mesh`
 * (No 2D mockup border or flat image projection: true wrap-around garment UV map)
 */
function buildShortsUvAtlasTexture(design, crestImg) {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Base shorts fabric
  ctx.fillStyle = design.shortsColor;
  ctx.fillRect(0, 0, size, size);

  // Side ventilation panels along outer thigh seams:
  // In Shorts_Mesh, u = 0.50 on each leg is the outer hip/thigh seam -> x = 256 (left leg) and x = 768 (right leg)
  if (design.panelStyle !== 'none') {
    ctx.fillStyle = design.panelColor;
    ctx.fillRect(256 - 28, 120, 56, 840);
    ctx.fillRect(768 - 28, 120, 56, 840);
  }

  // Elasticated top waistband (y = 0..120)
  ctx.fillStyle = 'rgba(0,0,0,0.16)';
  ctx.fillRect(0, 0, size, 120);
  ctx.fillStyle = design.accent;
  ctx.fillRect(0, 116, size, 10);

  // Bottom leg hem trim (y = 956..1024)
  ctx.fillStyle = design.accent;
  ctx.fillRect(0, 956, size, 68);
  if (design.cuffStyle === 'double' || design.cuffStyle === 'tricolor') {
    ctx.fillStyle = design.secondary;
    ctx.fillRect(0, 982, size, 14);
  }

  // Viewer's Left Thigh Front is at u = 0.75 of Leg 0 -> uv_u = 0.375 -> x = 384
  // Viewer's Right Thigh Front is at u = 0.75 of Leg 1 -> uv_u = 0.875 -> x = 896
  // Note: In football kits, the club crest goes on the wearer's right leg (viewer's left, x = 384)
  // and the player number goes on the wearer's left leg (viewer's right, x = 896).
  if (design.shortsCrest !== false && crestImg) {
    ctx.drawImage(crestImg, 384 - 46, 680, 92, 112);
  }

  if (design.shortsNumber && design.number) {
    ctx.save();
    ctx.translate(896, 745);
    ctx.scale(-1, 1);
    ctx.font = '900 120px Impact, Arial Black, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (design.showNumberOutline) {
      ctx.lineWidth = 9;
      ctx.strokeStyle = design.accent;
      ctx.strokeText(design.number, 0, 0);
    }
    ctx.fillStyle = design.numberColor;
    ctx.fillText(design.number, 0, 0);
    ctx.restore();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.flipY = false;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

/**
 * 3. Builds the 512x512 360-degree UV Texture Atlas for `Socks_Mesh`
 */
function buildSocksUvAtlasTexture(design) {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Main sock body
  ctx.fillStyle = design.socksColor;
  ctx.fillRect(0, 0, size, size);

  // Top turn-down ribbed cuff (y = 0..84)
  ctx.fillStyle = design.socksStripeColor || design.secondary;
  ctx.fillRect(0, 0, size, 84);
  ctx.fillStyle = design.accent;
  ctx.fillRect(0, 84, size, 18);
  ctx.fillStyle = design.socksStripeColor || design.secondary;
  ctx.fillRect(0, 110, size, 10);

  // Bottom ankle cuff trim (y = 482..512)
  ctx.fillStyle = design.accent;
  ctx.fillRect(0, 486, size, 26);

  // Front shin RELI monogram on both legs (x = 192 for viewer left leg, x = 448 flipped for viewer right leg)
  ctx.fillStyle = design.brandColor || design.accent;
  ctx.font = '900 26px Impact, Arial Black, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('RELI', 192, 230);

  ctx.save();
  ctx.translate(448, 230);
  ctx.scale(-1, 1);
  ctx.fillText('RELI', 0, 0);
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.flipY = false;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
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
          child.material.forEach((m) => m.dispose());
        } else {
          child.material?.dispose();
        }
      });
    };
  }, [gl, scene]);

  return null;
}

function CameraRig({ preset, displayMode, autoRotate }) {
  const { camera, gl } = useThree();
  const controlsRef = useRef(null);

  useEffect(() => {
    const controls = new OrbitControls(camera, gl.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.enablePan = true;
    controls.minDistance = 2.0;
    controls.maxDistance = 15;
    controls.minPolarAngle = Math.PI / 5;
    controls.maxPolarAngle = Math.PI / 1.65;
    controls.target.set(0, -0.6, 0);
    controls.autoRotateSpeed = 0.7;
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
    if (!targetConfig || !controlsRef.current) return;

    if (preset === 'closeup' || preset === 'bottoms') {
      camera.position.set(...targetConfig.position);
      controlsRef.current.target.set(...targetConfig.target);
    } else if (displayMode === 'full') {
      camera.position.set(
        targetConfig.position[0] * 1.32,
        -0.95,
        targetConfig.position[2] * 1.52,
      );
      controlsRef.current.target.set(0, -1.15, 0);
    } else if (displayMode === 'shorts') {
      camera.position.set(
        targetConfig.position[0] * 1.15,
        -0.45,
        targetConfig.position[2] * 1.25,
      );
      controlsRef.current.target.set(0, -0.55, 0);
    } else {
      camera.position.set(...targetConfig.position);
      controlsRef.current.target.set(...targetConfig.target);
    }
    controlsRef.current.update();
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
        canvas.height * 0.42,
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

function TailoredGlbUniform({ glbData, textures, displayMode }) {
  const normalMap = glbData.normalMap;

  return (
    <group position={[0, 0.25, 0]} scale={3.4}>
      {/* 1. Tailored 3D Shirt */}
      <mesh geometry={glbData.meshes.T_Shirt_male} castShadow receiveShadow>
        <meshPhysicalMaterial
          map={textures.shirt}
          normalMap={normalMap}
          normalScale={new THREE.Vector2(0.28, 0.28)}
          roughness={0.76}
          metalness={0.02}
          sheen={0.3}
          sheenRoughness={0.8}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 2. Tailored 3D Shorts */}
      {(displayMode === 'shorts' || displayMode === 'full') && glbData.meshes.Shorts_Mesh && (
        <mesh geometry={glbData.meshes.Shorts_Mesh} castShadow receiveShadow>
          <meshPhysicalMaterial
            map={textures.shorts}
            normalMap={normalMap}
            normalScale={new THREE.Vector2(0.25, 0.25)}
            roughness={0.78}
            metalness={0.02}
            sheen={0.26}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* 3. Tailored 3D Socks & Boots */}
      {displayMode === 'full' && glbData.meshes.Socks_Mesh && (
        <mesh geometry={glbData.meshes.Socks_Mesh} castShadow receiveShadow>
          <meshPhysicalMaterial
            map={textures.socks}
            normalMap={normalMap}
            normalScale={new THREE.Vector2(0.22, 0.22)}
            roughness={0.75}
            metalness={0.05}
            sheen={0.22}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
}

export default function KitPreview3D({
  design,
  crestDataUrl,
  shirtFrontRef,
  shirtBackRef,
  onCaptureReady,
  className = '',
}) {
  const [glbData, setGlbData] = useState(null);
  const [textures, setTextures] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [preset, setPreset] = useState('hero');
  const [displayMode, setDisplayMode] = useState('shirt');
  const [autoRotate, setAutoRotate] = useState(true);
  const texturesRef = useRef(null);
  const webgl = useMemo(() => supportsWebGL(), []);

  // 1. Load `/models/shirt_baked.glb` containing `T_Shirt_male`, `Shorts_Mesh`, and `Socks_Mesh`
  useEffect(() => {
    let cancelled = false;
    const loader = new GLTFLoader();

    loader.load(
      '/models/shirt_baked.glb',
      (gltf) => {
        if (cancelled) return;
        const meshes = {};
        let normalMap = null;

        gltf.scene.traverse((child) => {
          if (child.isMesh && child.name) {
            meshes[child.name] = child.geometry;
            if (!normalMap && child.material?.normalMap) {
              normalMap = child.material.normalMap;
              normalMap.wrapS = THREE.RepeatWrapping;
              normalMap.wrapT = THREE.RepeatWrapping;
              normalMap.repeat.set(8, 8);
            }
          }
        });

        if (!meshes.T_Shirt_male) {
          setLoadError(true);
          return;
        }
        setGlbData({ meshes, normalMap });
      },
      undefined,
      () => {
        if (!cancelled) setLoadError(true);
      },
    );

    return () => {
      cancelled = true;
    };
  }, []);

  // 2. Build 360-degree UV Atlases for Shirt, Shorts, and Socks
  useEffect(() => {
    let cancelled = false;

    const timer = window.setTimeout(async () => {
      if (!shirtFrontRef?.current || !shirtBackRef?.current) {
        return;
      }

      try {
        const [frontImage, backImage] = await Promise.all([
          svgToImage(shirtFrontRef.current, 1024, 1331),
          svgToImage(shirtBackRef.current, 1024, 1331),
        ]);

        let crestImg = null;
        const activeCrestSrc = design.customCrestUrl || crestDataUrl;
        if (activeCrestSrc) {
          crestImg = await new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null);
            img.src = activeCrestSrc;
          });
        }

        if (cancelled) return;

        const nextTextures = {
          shirt: buildShirtUvAtlasTexture(frontImage, backImage, design),
          shorts: buildShortsUvAtlasTexture(design, crestImg),
          socks: buildSocksUvAtlasTexture(design),
        };

        if (texturesRef.current) {
          Object.values(texturesRef.current).forEach((t) => t?.dispose());
        }
        texturesRef.current = nextTextures;
        setTextures(nextTextures);
      } catch {
        if (!cancelled) setLoadError(true);
      }
    }, 80);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [crestDataUrl, design, shirtBackRef, shirtFrontRef]);

  useEffect(
    () => () => {
      if (texturesRef.current) {
        Object.values(texturesRef.current).forEach((t) => t?.dispose());
        texturesRef.current = null;
      }
    },
    [],
  );

  const handleSelectPreset = (presetId) => {
    setPreset(presetId);
    if (presetId === 'bottoms' && displayMode === 'shirt') {
      setDisplayMode('full');
    }
  };

  if (!webgl) {
    return (
      <div className="flex h-full min-h-[420px] items-center justify-center rounded-2xl border border-dashed border-card-border bg-muted/5 p-6 text-center">
        <p className="max-w-sm text-sm font-bold text-muted-foreground">
          Tu navegador no tiene WebGL activo. La vista 2D sigue disponible.
        </p>
      </div>
    );
  }

  const ready = Boolean(glbData && textures);

  return (
    <div
      className={`relative h-full min-h-[560px] overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_50%_32%,rgba(30,41,59,0.88),rgba(5,8,17,0.99)_74%)] ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_16%,rgba(217,25,41,0.12),transparent_55%)]" />

      <Canvas
        shadows
        dpr={[1, 1.75]}
        camera={{ position: [1.95, 0.15, 5.2], fov: 32, near: 0.1, far: 100 }}
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.06;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
        }}
      >
        <StudioEnvironment />
        <CameraRig preset={preset} displayMode={displayMode} autoRotate={autoRotate} />

        <ambientLight intensity={0.54} />
        <directionalLight
          castShadow
          position={[3.5, 5, 4.5]}
          intensity={2.05}
          shadow-mapSize-width={1536}
          shadow-mapSize-height={1536}
          shadow-normalBias={0.02}
        />
        <directionalLight position={[-3.5, 4, -4.5]} intensity={1.85} color="#F8FAFC" />
        <directionalLight position={[3, 2, -3.5]} intensity={0.95} color="#C9A259" />
        <pointLight position={[0, -1.5, 3]} intensity={0.45} color="#FFFFFF" />

        {ready && (
          <TailoredGlbUniform
            glbData={glbData}
            textures={textures}
            displayMode={displayMode}
          />
        )}

        <Capture onReady={onCaptureReady} ready={ready} />
      </Canvas>

      {/* Top-Left Camera Angle Presets */}
      <div className="absolute left-3 top-3 z-10 flex flex-wrap items-center gap-1 rounded-xl border border-white/10 bg-slate-950/80 p-1 backdrop-blur-md">
        {CAMERA_PRESETS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => handleSelectPreset(item.id)}
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

      {/* Top-Right Display Mode + Auto-Rotate */}
      <div className="absolute right-3 top-3 z-10 flex flex-wrap items-center gap-1.5">
        <div className="flex rounded-xl border border-white/10 bg-slate-950/80 p-1 backdrop-blur-md">
          {DISPLAY_MODES.map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => setDisplayMode(mode.id)}
              className={`rounded-lg px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] transition ${
                displayMode === mode.id
                  ? 'bg-re-rojo text-white shadow-sm'
                  : 'text-white/65 hover:bg-white/10 hover:text-white'
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

      {!ready && !loadError && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/35 backdrop-blur-[2px]">
          <div className="flex items-center gap-3 rounded-full border border-white/10 bg-slate-950/85 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-white/85">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-re-dorado border-t-transparent" />
            Cargando estudio 3D...
          </div>
        </div>
      )}

      {loadError && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/75 p-6 text-center">
          <p className="max-w-sm text-sm font-bold text-white/80">
            No se pudo cargar el modelo 3D. Cambia a la vista 2D o recarga la página.
          </p>
        </div>
      )}

      <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-black/45 px-3.5 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-white/55 backdrop-blur-sm">
        Arrastra para rotar · Rueda para zoom · Clic derecho para mover
      </div>
    </div>
  );
}
