import React, { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import type { Viseme } from '../types';

// Viseme index → morph target name (ARKit-compatible)
const VISEME_MAP: Record<number, string> = {
  0: 'viseme_sil',
  1: 'viseme_PP',
  2: 'viseme_FF',
  3: 'viseme_TH',
  4: 'viseme_DD',
  5: 'viseme_kk',
  6: 'viseme_CH',
  7: 'viseme_SS',
  8: 'viseme_nn',
  9: 'viseme_RR',
  10: 'viseme_aa',
  11: 'viseme_E',
  12: 'viseme_I',
  13: 'viseme_O',
  14: 'viseme_U',
};

interface Props {
  modelUrl?: string;
  width?: number;
  height?: number;
  backgroundColor?: string;
  isSpeaking?: boolean;
  visemes?: Viseme[];
  lipSyncIntensity?: number;
  onLoaded?: () => void;
  onError?: (err: Error) => void;
}

function buildFallbackAvatar(): THREE.Group {
  const group = new THREE.Group();
  const headGeo = new THREE.SphereGeometry(0.5, 32, 32);
  const mat = new THREE.MeshStandardMaterial({ color: 0xf5cba7 });
  const head = new THREE.Mesh(headGeo, mat);
  group.add(head);

  const eyeGeo = new THREE.SphereGeometry(0.06, 16, 16);
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x2c3e50 });
  [-0.18, 0.18].forEach((x) => {
    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    eye.position.set(x, 0.12, 0.46);
    group.add(eye);
  });

  const mouthGeo = new THREE.TorusGeometry(0.12, 0.03, 8, 16, Math.PI);
  const mouthMat = new THREE.MeshStandardMaterial({ color: 0x922b21 });
  const mouth = new THREE.Mesh(mouthGeo, mouthMat);
  mouth.position.set(0, -0.18, 0.46);
  mouth.rotation.z = Math.PI;
  mouth.name = 'mouth';
  group.add(mouth);

  return group;
}

export function AvatarScene({
  modelUrl,
  width = 300,
  height = 400,
  backgroundColor = 'transparent',
  isSpeaking = false,
  visemes = [],
  lipSyncIntensity = 1.0,
  onLoaded,
  onError,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const avatarRef = useRef<THREE.Object3D | null>(null);
  const rafRef = useRef<number>(0);
  const clockRef = useRef(new THREE.Clock());
  const speakingRef = useRef(isSpeaking);
  const visemesRef = useRef(visemes);

  speakingRef.current = isSpeaking;
  visemesRef.current = visemes;

  const applyViseme = useCallback((visemeIdx: number, intensity: number) => {
    if (!avatarRef.current) return;
    const name = VISEME_MAP[visemeIdx];
    if (!name) return;
    avatarRef.current.traverse((obj) => {
      if ((obj as THREE.SkinnedMesh).morphTargetDictionary) {
        const mesh = obj as THREE.SkinnedMesh;
        const idx = mesh.morphTargetDictionary?.[name];
        if (idx !== undefined && mesh.morphTargetInfluences) {
          mesh.morphTargetInfluences[idx] = intensity * lipSyncIntensity;
        }
      }
    });
  }, [lipSyncIntensity]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    if (backgroundColor !== 'transparent') {
      scene.background = new THREE.Color(backgroundColor);
    }
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0.3, 2);
    cameraRef.current = camera;

    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(1, 2, 3);
    scene.add(dirLight);

    if (modelUrl) {
      import('three/examples/jsm/loaders/GLTFLoader.js').then(({ GLTFLoader }) => {
        const loader = new GLTFLoader();
        loader.load(
          modelUrl,
          (gltf) => {
            avatarRef.current = gltf.scene;
            scene.add(gltf.scene);
            onLoaded?.();
          },
          undefined,
          (err) => onError?.(err instanceof Error ? err : new Error(String(err))),
        );
      });
    } else {
      const fallback = buildFallbackAvatar();
      avatarRef.current = fallback;
      scene.add(fallback);
      onLoaded?.();
    }

    let blinkTimer = 0;
    let blinkInterval = 2 + Math.random() * 3;
    let breathPhase = 0;

    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);
      const delta = clockRef.current.getDelta();
      const elapsed = clockRef.current.getElapsedTime();

      // Breathing
      breathPhase += delta * 0.5;
      if (avatarRef.current) {
        avatarRef.current.position.y = Math.sin(breathPhase) * 0.005;
      }

      // Blink
      blinkTimer += delta;
      if (blinkTimer >= blinkInterval) {
        blinkTimer = 0;
        blinkInterval = 2 + Math.random() * 3;
        avatarRef.current?.traverse((obj) => {
          const mesh = obj as THREE.SkinnedMesh;
          if (mesh.morphTargetDictionary?.['eyeBlinkLeft'] !== undefined && mesh.morphTargetInfluences) {
            const li = mesh.morphTargetDictionary['eyeBlinkLeft'];
            const ri = mesh.morphTargetDictionary['eyeBlinkRight'];
            mesh.morphTargetInfluences[li] = 1;
            if (ri !== undefined) mesh.morphTargetInfluences[ri] = 1;
            setTimeout(() => {
              if (mesh.morphTargetInfluences) {
                mesh.morphTargetInfluences[li] = 0;
                if (ri !== undefined) mesh.morphTargetInfluences[ri] = 0;
              }
            }, 120);
          }
        });
      }

      // Lip-sync
      if (speakingRef.current && visemesRef.current.length > 0) {
        const t = elapsed % (visemesRef.current[visemesRef.current.length - 1]?.time + 0.5 || 2);
        const current = visemesRef.current.find((v) => t >= v.time && t < v.time + v.duration);
        if (current) applyViseme(current.viseme, 1.0);
        else applyViseme(0, 0);
      } else if (!speakingRef.current) {
        applyViseme(0, 0);
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(rafRef.current);
      renderer.dispose();
    };
  }, [modelUrl]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ display: 'block', width, height }}
    />
  );
}
