/**
 * ==================================================
 * ██╗     ██╗██╗   ██╗ █████╗
 * ██║     ██║╚██╗ ██╔╝██╔══██╗
 * ██║     ██║ ╚████╔╝ ███████║
 * ██║     ██║  ╚██╔╝  ██╔══██║
 * ███████╗██║   ██║   ██║  ██║
 * ╚══════╝╚═╝   ╚═╝   ╚═╝  ╚═╝
 *        AI Assistant
 * ==================================================
 * Author / Creator : Mahmut Denizli (With help of LiyaAi)
 * License          : MIT
 * Connect          : liyalabs.com, info@liyalabs.com
 * ==================================================
 */
import React, {
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
} from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import "./AvatarScene.css";
import { logger } from "../../utils/logger";

export interface AvatarSceneProps {
  modelUrl?: string;
  width?: number;
  height?: number;
  backgroundColor?: string;
  isSpeaking?: boolean;
  visemes?: Array<{ time: number; viseme: number; duration: number }>;
  currentTime?: number;
  lipSyncSpeed?: number;
  lipSyncIntensity?: number;
  blinkSpeed?: number;
  blinkIntervalMin?: number;
  blinkIntervalMax?: number;
  eyeMoveSpeed?: number;
  eyeMoveIntervalMin?: number;
  eyeMoveIntervalMax?: number;
  eyeMoveRange?: number;
  breathingSpeed?: number;
  breathingIntensity?: number;
  microExpressionSpeed?: number;
  microExpressionIntensity?: number;
  speakingBrowIntensity?: number;
  speakingSmileIntensity?: number;
  handGestureSpeed?: number;
  handGestureIntensity?: number;
  onLoaded?: () => void;
  onError?: (error: Error) => void;
}

export interface AvatarSceneHandle {
  applyOutfitColors: (colors: {
    top: string;
    bottom: string;
    footwear: string;
  }) => void;
}

const VISEME_MORPH_MAP: Record<number, string[]> = {
  0: [],
  1: ["mouthClose", "mouthPressLeft", "mouthPressRight"],
  2: ["mouthFunnel", "mouthLowerDownLeft", "mouthLowerDownRight"],
  3: ["mouthLowerDownLeft", "mouthLowerDownRight", "tongueOut"],
  4: ["mouthLowerDownLeft", "mouthLowerDownRight"],
  5: ["mouthLowerDownLeft", "mouthLowerDownRight"],
  6: ["mouthFunnel", "mouthShrugUpper"],
  7: [
    "mouthSmileLeft",
    "mouthSmileRight",
    "mouthLowerDownLeft",
    "mouthLowerDownRight",
  ],
  8: ["mouthLowerDownLeft", "mouthLowerDownRight"],
  9: ["mouthLowerDownLeft", "mouthLowerDownRight", "mouthRollLower"],
  10: [
    "mouthLowerDownLeft",
    "mouthLowerDownRight",
    "mouthUpperUpLeft",
    "mouthUpperUpRight",
  ],
  11: [
    "mouthSmileLeft",
    "mouthSmileRight",
    "mouthLowerDownLeft",
    "mouthLowerDownRight",
  ],
  12: [
    "mouthSmileLeft",
    "mouthSmileRight",
    "mouthStretchLeft",
    "mouthStretchRight",
  ],
  13: ["mouthFunnel", "mouthLowerDownLeft", "mouthLowerDownRight"],
  14: ["mouthPucker", "mouthFunnel"],
};

const isSafari =
  typeof navigator !== "undefined" &&
  /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

const AvatarScene = forwardRef<AvatarSceneHandle, AvatarSceneProps>(
  (
    {
      modelUrl = "",
      width = 400,
      height = 500,
      backgroundColor = "#1a1a2e",
      isSpeaking = false,
      visemes = [],
      currentTime = 0,
      lipSyncSpeed = 0.02,
      lipSyncIntensity = 0.5,
      blinkSpeed = 0.25,
      blinkIntervalMin = 1500,
      blinkIntervalMax = 3500,
      eyeMoveSpeed = 0.12,
      eyeMoveIntervalMin = 500,
      eyeMoveIntervalMax = 1500,
      eyeMoveRange = 0.4,
      breathingSpeed = 0.4,
      breathingIntensity = 0.015,
      microExpressionSpeed = 0.4,
      microExpressionIntensity = 0.08,
      speakingBrowIntensity = 0.05,
      speakingSmileIntensity = 0.2,
      handGestureSpeed = 0.5,
      handGestureIntensity = 0.2,
      onLoaded,
      onError,
    },
    ref,
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    // Keep latest prop values accessible inside stable callbacks without re-creating them
    const propsRef = useRef({
      modelUrl,
      backgroundColor,
      width,
      height,
      isSpeaking,
      visemes,
      currentTime,
      lipSyncSpeed,
      lipSyncIntensity,
      blinkSpeed,
      blinkIntervalMin,
      blinkIntervalMax,
      eyeMoveSpeed,
      eyeMoveIntervalMin,
      eyeMoveIntervalMax,
      eyeMoveRange,
      breathingSpeed,
      breathingIntensity,
      microExpressionSpeed,
      microExpressionIntensity,
      speakingBrowIntensity,
      speakingSmileIntensity,
      handGestureSpeed,
      handGestureIntensity,
      onLoaded,
      onError,
    });
    // Sync propsRef on every render (no re-render triggered)
    propsRef.current = {
      modelUrl,
      backgroundColor,
      width,
      height,
      isSpeaking,
      visemes,
      currentTime,
      lipSyncSpeed,
      lipSyncIntensity,
      blinkSpeed,
      blinkIntervalMin,
      blinkIntervalMax,
      eyeMoveSpeed,
      eyeMoveIntervalMin,
      eyeMoveIntervalMax,
      eyeMoveRange,
      breathingSpeed,
      breathingIntensity,
      microExpressionSpeed,
      microExpressionIntensity,
      speakingBrowIntensity,
      speakingSmileIntensity,
      handGestureSpeed,
      handGestureIntensity,
      onLoaded,
      onError,
    };

    // Three.js State - stored in ref to persist across renders without triggering them
    const tState = useRef({
      scene: null as THREE.Scene | null,
      camera: null as THREE.PerspectiveCamera | null,
      renderer: null as THREE.WebGLRenderer | null,
      model: null as THREE.Object3D | null,
      mixer: null as THREE.AnimationMixer | null,
      morphTargetMeshes: [] as THREE.Mesh[],
      animationFrameId: null as number | null,
      clock: null as THREE.Clock | null,
      isAnimating: false,
      currentMorphValues: {} as Record<string, number>,
      lastBlinkTime: 0,
      isBlinking: false,
      blinkProgress: 0,
      nextBlinkInterval: 3000,
      eyeLookTarget: { x: 0, y: 0 },
      eyeLookCurrent: { x: 0, y: 0 },
      lastEyeMoveTime: 0,
      nextEyeMoveInterval: 2000,
      breathPhase: 0,
      microExpressionPhase: 0,
      handGesturePhase: 0,
      leftHandBone: null as THREE.Object3D | null,
      rightHandBone: null as THREE.Object3D | null,
      leftHandBaseRotation: null as THREE.Quaternion | null,
      rightHandBaseRotation: null as THREE.Quaternion | null,
      leftEyeBone: null as THREE.Object3D | null,
      rightEyeBone: null as THREE.Object3D | null,
      leftEyeBaseScale: null as THREE.Vector3 | null,
      rightEyeBaseScale: null as THREE.Vector3 | null,
      hasEyeBlinkMorphs: false,
      outfitTopMesh: null as THREE.Mesh | null,
      outfitBottomMesh: null as THREE.Mesh | null,
      outfitFootwearMesh: null as THREE.Mesh | null,
      modelUrl: "",
    });

    // Helper: apply color to a mesh, handling both single and array materials
    const applyColorToMesh = (mesh: THREE.Mesh, colorHex: string) => {
      const materials = Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material];
      materials.forEach((m) => {
        const mat = m as THREE.MeshStandardMaterial;
        // Clear all texture maps that could bleed through and mix with the new color
        if (mat.map) mat.map = null;
        if (mat.emissiveMap) mat.emissiveMap = null;
        if (mat.normalMap) mat.normalMap = null;
        if (mat.roughnessMap) mat.roughnessMap = null;
        if (mat.metalnessMap) mat.metalnessMap = null;
        if (mat.aoMap) mat.aoMap = null;
        mat.color.set(colorHex);
        mat.emissive.set("#000000"); // reset emissive so it doesn't tint the color
        mat.needsUpdate = true;
      });
    };

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
      applyOutfitColors: (colors) => {
        const s = tState.current;
        if (s.outfitTopMesh) applyColorToMesh(s.outfitTopMesh, colors.top);
        if (s.outfitBottomMesh)
          applyColorToMesh(s.outfitBottomMesh, colors.bottom);
        if (s.outfitFootwearMesh)
          applyColorToMesh(s.outfitFootwearMesh, colors.footwear);
      },
    }));

    const applySize = (w: number, h: number) => {
      const s = tState.current;
      // Container boyutunu CSS'e bırak — JS ile override etme.
      // Canvas position:absolute + left:50% + translateX(-50%) ile ortalanıyor.
      // Sadece renderer canvas boyutunu ve camera aspect ratio'sunu güncelle.
      if (containerRef.current) {
        // Sadece yüksekliği yaz — genişlik CSS %100'den gelecek
        containerRef.current.style.height = `${h}px`;
      }
      if (s.renderer) {
        s.renderer.setSize(w, h);
        const maxPixelRatio = isSafari ? 1.5 : 2;
        s.renderer.setPixelRatio(
          Math.min(window.devicePixelRatio, maxPixelRatio),
        );
      }
      if (s.camera) {
        s.camera.aspect = w / h;
        s.camera.updateProjectionMatrix();
      }
    };

    // Animation Loop — stable ref, reads latest props via propsRef
    const animateRef = useRef<() => void>(null as any);
    animateRef.current = () => {
      const s = tState.current;
      if (!s.isAnimating) return;
      s.animationFrameId = requestAnimationFrame(() => animateRef.current());

      if (!s.scene || !s.camera || !s.renderer) return;

      const p = propsRef.current;
      const {
        isSpeaking,
        visemes,
        currentTime,
        lipSyncSpeed,
        lipSyncIntensity,
        blinkSpeed,
        blinkIntervalMin,
        blinkIntervalMax,
        eyeMoveSpeed,
        eyeMoveIntervalMin,
        eyeMoveIntervalMax,
        eyeMoveRange,
        breathingSpeed,
        breathingIntensity,
        microExpressionSpeed,
        microExpressionIntensity,
        speakingBrowIntensity,
        speakingSmileIntensity,
        handGestureSpeed,
        handGestureIntensity,
      } = p;

      const delta = s.clock?.getDelta() || 0;
      const now = performance.now();

      if (s.mixer) s.mixer.update(delta);

      // Update Idle Animations
      s.breathPhase += delta * breathingSpeed;
      const breathAmount = Math.sin(s.breathPhase) * breathingIntensity;
      s.microExpressionPhase += delta * microExpressionSpeed;
      s.handGesturePhase += delta * handGestureSpeed;

      // Blinking logic
      const speakingMultiplier = isSpeaking ? 0.6 : 1.0;
      const adjustedInterval = s.nextBlinkInterval * speakingMultiplier;
      if (!s.isBlinking && now - s.lastBlinkTime > adjustedInterval) {
        s.isBlinking = true;
        s.blinkProgress = 0;
        s.lastBlinkTime = now;
        s.nextBlinkInterval =
          blinkIntervalMin +
          Math.random() * (blinkIntervalMax - blinkIntervalMin);
      }
      if (s.isBlinking) {
        s.blinkProgress += blinkSpeed;
        if (s.blinkProgress >= 1) {
          s.isBlinking = false;
          s.blinkProgress = 0;
        }
      }
      let blinkValue = 0;
      if (s.isBlinking) {
        blinkValue =
          s.blinkProgress < 0.4
            ? s.blinkProgress / 0.4
            : 1 - (s.blinkProgress - 0.4) / 0.6;
      }

      // Eye Movement logic
      if (now - s.lastEyeMoveTime > s.nextEyeMoveInterval) {
        s.eyeLookTarget.x = (Math.random() - 0.5) * eyeMoveRange * 2;
        s.eyeLookTarget.y = (Math.random() - 0.5) * eyeMoveRange * 1.3;
        s.lastEyeMoveTime = now;
        s.nextEyeMoveInterval =
          eyeMoveIntervalMin +
          Math.random() * (eyeMoveIntervalMax - eyeMoveIntervalMin);
      }
      s.eyeLookCurrent.x +=
        (s.eyeLookTarget.x - s.eyeLookCurrent.x) * eyeMoveSpeed;
      s.eyeLookCurrent.y +=
        (s.eyeLookTarget.y - s.eyeLookCurrent.y) * eyeMoveSpeed;

      // Update Hand Gestures
      if (s.leftHandBone || s.rightHandBone) {
        const gIntensity = handGestureIntensity || 0;
        if (gIntensity > 0) {
          const speakingBoost = isSpeaking ? 1.4 : 1;
          const wave =
            Math.sin(s.handGesturePhase) * gIntensity * speakingBoost;
          const lift =
            (Math.sin(s.handGesturePhase * 0.6) + 1) *
            0.5 *
            gIntensity *
            speakingBoost;
          if (s.leftHandBone && s.leftHandBaseRotation) {
            s.leftHandBone.quaternion.copy(s.leftHandBaseRotation);
            s.leftHandBone.rotateZ(wave);
            s.leftHandBone.rotateX(lift * 0.6);
          }
          if (s.rightHandBone && s.rightHandBaseRotation) {
            s.rightHandBone.quaternion.copy(s.rightHandBaseRotation);
            s.rightHandBone.rotateZ(-wave);
            s.rightHandBone.rotateX(lift * 0.6);
          }
        }
      }

      // Apply Morph Targets (Blink, Eyes, Breath, Micro, Speech)
      const morphTargetsToApply: Record<string, number> = {};

      // Blink morphs
      if (s.hasEyeBlinkMorphs) {
        morphTargetsToApply["eyeBlinkLeft"] = blinkValue;
        morphTargetsToApply["eyeBlinkRight"] = blinkValue;
      } else if (
        s.leftEyeBone &&
        s.rightEyeBone &&
        s.leftEyeBaseScale &&
        s.rightEyeBaseScale
      ) {
        const scaleY = 1 - blinkValue * 0.9;
        s.leftEyeBone.scale.y = s.leftEyeBaseScale.y * scaleY;
        s.rightEyeBone.scale.y = s.rightEyeBaseScale.y * scaleY;
      }

      // Eye look morphs
      if (s.eyeLookCurrent.x > 0) {
        morphTargetsToApply["eyeLookOutLeft"] = s.eyeLookCurrent.x;
        morphTargetsToApply["eyeLookInRight"] = s.eyeLookCurrent.x;
      } else {
        morphTargetsToApply["eyeLookInLeft"] = -s.eyeLookCurrent.x;
        morphTargetsToApply["eyeLookOutRight"] = -s.eyeLookCurrent.x;
      }
      if (s.eyeLookCurrent.y > 0) {
        morphTargetsToApply["eyeLookUpLeft"] = s.eyeLookCurrent.y;
        morphTargetsToApply["eyeLookUpRight"] = s.eyeLookCurrent.y;
      } else {
        morphTargetsToApply["eyeLookDownLeft"] = -s.eyeLookCurrent.y;
        morphTargetsToApply["eyeLookDownRight"] = -s.eyeLookCurrent.y;
      }

      // Breathing & Micro expressions
      if (s.model) {
        s.model.position.y = -0.3 + breathAmount * 0.08;
        s.model.scale.y = s.model.scale.x * (1 + breathAmount * 0.05);
      }
      const microSmile =
        Math.sin(s.microExpressionPhase) * microExpressionIntensity +
        microExpressionIntensity;
      morphTargetsToApply["mouthSmileLeft"] = microSmile;
      morphTargetsToApply["mouthSmileRight"] = microSmile;
      morphTargetsToApply["browInnerUp"] = Math.max(
        0,
        Math.sin(s.microExpressionPhase * 0.7) * microExpressionIntensity * 0.6,
      );
      morphTargetsToApply["cheekPuff"] = Math.max(
        0,
        Math.sin(s.breathPhase) * breathingIntensity * 0.5,
      );

      // Speech morphs (Lip-Sync)
      if (isSpeaking && visemes && visemes.length > 0) {
        let currentViseme = 0;
        let found = false;
        for (const v of visemes) {
          if (currentTime >= v.time && currentTime < v.time + v.duration) {
            currentViseme = v.viseme;
            found = true;
            break;
          }
        }
        if (!found) {
          const lastV = visemes[visemes.length - 1];
          if (currentTime < lastV.time + lastV.duration + 0.5)
            currentViseme = 10;
        }

        // Map viseme to targets
        const visemeMorphs = VISEME_MORPH_MAP[currentViseme] || [];
        visemeMorphs.forEach((name) => {
          morphTargetsToApply[name] = lipSyncIntensity;
        });

        // Speaking expressions
        const exprPhase = now * 0.003;
        morphTargetsToApply["browInnerUp"] =
          Math.sin(exprPhase) * speakingBrowIntensity +
          speakingBrowIntensity * 0.67;
        morphTargetsToApply["eyeSquintLeft"] = speakingSmileIntensity;
        morphTargetsToApply["eyeSquintRight"] = speakingSmileIntensity;
        morphTargetsToApply["mouthSmileLeft"] = speakingSmileIntensity;
        morphTargetsToApply["mouthSmileRight"] = speakingSmileIntensity;
      }

      // Apply all collected morph targets smoothly
      s.morphTargetMeshes.forEach((mesh) => {
        if (!mesh.morphTargetDictionary || !mesh.morphTargetInfluences) return;
        Object.keys(mesh.morphTargetDictionary).forEach((name) => {
          const index = mesh.morphTargetDictionary![name];
          if (index === undefined) return;
          const targetValue = morphTargetsToApply[name] || 0;
          const currentValue = s.currentMorphValues[name] || 0;
          const diff = targetValue - currentValue;
          const smoothFactor = Math.min(
            lipSyncSpeed * (0.5 + Math.abs(diff) * 0.5),
            0.08,
          );
          let newValue = currentValue + diff * smoothFactor;
          if (Math.abs(newValue) < 0.005) newValue = 0;
          mesh.morphTargetInfluences![index] = newValue;
          s.currentMorphValues[name] = newValue;
        });
      });

      s.renderer.render(s.scene, s.camera);
    };

    const createDefaultAvatar = (s: any) => {
      const headGroup = new THREE.Group();
      const headGeom = new THREE.SphereGeometry(0.35, 32, 32);
      headGeom.scale(1, 1.1, 1);
      const headMat = new THREE.MeshStandardMaterial({
        color: 0xf5d0c5,
        roughness: 0.6,
      });
      const head = new THREE.Mesh(headGeom, headMat);
      head.position.y = 1.55;
      headGroup.add(head);

      // Simple mouth mesh for default avatar
      const mouthGeom = new THREE.TorusGeometry(0.06, 0.015, 8, 16, Math.PI);
      const mouthMat = new THREE.MeshStandardMaterial({ color: 0xcc7777 });
      const mouth = new THREE.Mesh(mouthGeom, mouthMat);
      mouth.position.set(0, 1.4, 0.3);
      mouth.rotation.x = Math.PI;
      mouth.name = "mouth";
      headGroup.add(mouth);

      s.scene.add(headGroup);
      s.model = headGroup;
      setIsLoading(false);
      onLoaded?.();
    };

    const loadModel = (url: string) => {
      logger.log("[AvatarScene] 📡 loadModel called with URL:", url);
      const s = tState.current;
      const loader = new GLTFLoader();
      loader.load(
        url,
        (gltf) => {
          logger.log("[AvatarScene] ✅ GLTF loaded successfully", {
            url,
            animations: gltf.animations.map((a) => a.name),
            sceneChildren: gltf.scene.children.length,
          });
          if (!s.scene) return;
          s.model = gltf.scene;
          s.scene.add(s.model);
          s.morphTargetMeshes = [];
          s.model.traverse((child) => {
            if (
              child instanceof THREE.Mesh &&
              child.morphTargetInfluences &&
              child.morphTargetDictionary
            ) {
              s.morphTargetMeshes.push(child);
            }
            const name = child.name?.toLowerCase() || "";
            if (name.includes("hand_l")) {
              s.leftHandBone = child;
              s.leftHandBaseRotation = child.quaternion.clone();
            }
            if (name.includes("hand_r")) {
              s.rightHandBone = child;
              s.rightHandBaseRotation = child.quaternion.clone();
            }
            if (child.name === "Wolf3D_Outfit_Top")
              s.outfitTopMesh = child as THREE.Mesh;
            if (child.name === "Wolf3D_Outfit_Bottom")
              s.outfitBottomMesh = child as THREE.Mesh;
            if (child.name === "Wolf3D_Outfit_Footwear")
              s.outfitFootwearMesh = child as THREE.Mesh;
          });
          s.hasEyeBlinkMorphs = s.morphTargetMeshes.some(
            (m) =>
              m.morphTargetDictionary &&
              "eyeBlinkLeft" in m.morphTargetDictionary,
          );
          logger.log("[AvatarScene] 🎭 Model traversal done", {
            morphTargetMeshes: s.morphTargetMeshes.length,
            hasEyeBlinkMorphs: s.hasEyeBlinkMorphs,
            hasLeftHand: !!s.leftHandBone,
            hasRightHand: !!s.rightHandBone,
            hasOutfitTop: !!s.outfitTopMesh,
          });
          if (gltf.animations.length > 0) {
            s.mixer = new THREE.AnimationMixer(s.model);
            const idle = gltf.animations.find((a) =>
              a.name.toLowerCase().includes("idle"),
            );
            if (idle) {
              s.mixer.clipAction(idle).play();
              logger.log("[AvatarScene] 🎬 Playing idle animation:", idle.name);
            }
          }
          const box = new THREE.Box3().setFromObject(s.model);
          const size = box.getSize(new THREE.Vector3());
          s.model.scale.setScalar(1.8 / size.y);
          s.model.position.set(0, -0.3, 0);
          setIsLoading(false);
          onLoaded?.();
        },
        (progress) => {
          if (progress.total > 0) {
            const pct = Math.round((progress.loaded / progress.total) * 100);
            if (pct % 25 === 0) {
              logger.log(
                `[AvatarScene] ⏳ Loading progress: ${pct}% (${progress.loaded}/${progress.total})`,
              );
            }
          }
        },
        (err) => {
          logger.error("[AvatarScene] ❌ GLTF load error:", {
            url,
            error: err,
            message: (err as any)?.message,
          });
          setLoadError("Failed to load avatar model");
          setIsLoading(false);
          createDefaultAvatar(s);
          onError?.(err as Error);
        },
      );
    };

    // ─── Scene init: runs ONCE on mount ───────────────────────────────────────
    useEffect(() => {
      const s = tState.current;
      const { modelUrl, backgroundColor, width, height } = propsRef.current;
      logger.log("[AvatarScene] 🎬 Scene init useEffect", {
        modelUrl,
        backgroundColor,
        width,
        height,
        hasContainer: !!containerRef.current,
      });
      if (!containerRef.current) {
        logger.error(
          "[AvatarScene] ❌ containerRef is null — cannot init scene",
        );
        return;
      }
      // Guard: prevent double-init (React Strict Mode)
      // If scene already exists AND renderer is still attached to the DOM, skip.
      if (
        s.scene &&
        s.renderer &&
        containerRef.current.contains(s.renderer.domElement)
      ) {
        logger.warn(
          "[AvatarScene] ⚠️ Scene already initialised — skipping duplicate init",
        );
        return;
      }
      // Clean up any stale state from a previous (StrictMode) mount
      if (s.renderer) {
        try {
          s.renderer.dispose();
        } catch (_) {}
        if (containerRef.current.contains(s.renderer.domElement)) {
          containerRef.current.removeChild(s.renderer.domElement);
        }
        s.renderer = null;
      }
      s.scene = null;
      s.camera = null;
      s.model = null;
      s.mixer = null;
      s.morphTargetMeshes = [];
      s.modelUrl = "";
      s.scene = new THREE.Scene();
      s.camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 1000);
      s.camera.position.set(0, 1.48, 1.5);
      s.camera.lookAt(0, 1.4, 0);

      // Support transparent background
      const isTransparent = backgroundColor === "transparent";
      s.renderer = new THREE.WebGLRenderer({
        antialias: !isSafari,
        alpha: isTransparent,
      });

      // Set clear color based on backgroundColor prop
      if (isTransparent) {
        s.renderer.setClearColor(0x000000, 0); // Transparent
        // Force canvas element itself to be transparent (cross-browser)
        s.renderer.domElement.style.background = "transparent";
      } else {
        // Parse hex color or use default
        const colorInt = backgroundColor.startsWith("#")
          ? parseInt(backgroundColor.slice(1), 16)
          : 0x1a1a2e;
        s.renderer.setClearColor(colorInt, 1);
        s.renderer.domElement.style.background = backgroundColor;
      }

      // Append canvas FIRST so applySize can read container dimensions
      containerRef.current.appendChild(s.renderer.domElement);
      applySize(width, height);
      s.renderer.outputColorSpace = THREE.SRGBColorSpace;
      s.scene.add(new THREE.AmbientLight(0xffffff, 0.6));
      const keyL = new THREE.DirectionalLight(0xffffff, 1.2);
      keyL.position.set(2, 3, 2);
      s.scene.add(keyL);
      s.clock = new THREE.Clock();
      if (modelUrl) {
        logger.log(
          "[AvatarScene] 🔗 modelUrl present on init, loading:",
          modelUrl,
        );
        s.modelUrl = modelUrl;
        loadModel(modelUrl);
      } else {
        logger.warn(
          "[AvatarScene] ⚠️ modelUrl is EMPTY on init — using default avatar placeholder",
        );
        createDefaultAvatar(s);
      }
      s.isAnimating = true;
      animateRef.current();
      return () => {
        s.isAnimating = false;
        if (s.animationFrameId) {
          cancelAnimationFrame(s.animationFrameId);
          s.animationFrameId = null;
        }
        if (s.renderer) {
          // Remove canvas from DOM BEFORE dispose to avoid WebGL context loss
          // leaving a blank/white canvas attached.
          if (
            containerRef.current &&
            containerRef.current.contains(s.renderer.domElement)
          ) {
            containerRef.current.removeChild(s.renderer.domElement);
          }
          s.renderer.dispose();
          // forceContextLoss() is intentionally OMITTED here — it permanently
          // destroys the GL context so a remount (StrictMode) cannot reuse it.
          s.renderer = null;
        }
        s.scene = null;
        s.camera = null;
        s.model = null;
        s.mixer = null;
        s.morphTargetMeshes = [];
        s.modelUrl = "";
        s.isAnimating = false;
      };
    }, []); // ← mount-only, intentionally empty deps

    // ─── backgroundColor change handler ───────────────────────────────────────
    useEffect(() => {
      const s = tState.current;
      if (!s.renderer) return;
      const isTransparent = backgroundColor === "transparent";
      if (isTransparent) {
        s.renderer.setClearColor(0x000000, 0);
      } else {
        const colorInt = backgroundColor.startsWith("#")
          ? parseInt(backgroundColor.slice(1), 16)
          : 0x1a1a2e;
        s.renderer.setClearColor(colorInt, 1);
      }
    }, [backgroundColor]);

    // ─── modelUrl change handler ───────────────────────────────────────────────
    useEffect(() => {
      const s = tState.current;
      logger.log("[AvatarScene] 🔄 modelUrl useEffect triggered", {
        modelUrl,
        prevModelUrl: s.modelUrl,
        hasScene: !!s.scene,
        willLoad: !!(modelUrl && s.scene && s.modelUrl !== modelUrl),
      });
      // Scene may not be ready yet on first render (init effect runs after)
      if (!s.scene) return;
      if (modelUrl && s.modelUrl !== modelUrl) {
        logger.log("[AvatarScene] 🔁 Reloading model — URL changed:", {
          from: s.modelUrl,
          to: modelUrl,
        });
        if (s.model) s.scene.remove(s.model);
        s.modelUrl = modelUrl;
        loadModel(modelUrl);
      } else if (!modelUrl) {
        logger.warn(
          "[AvatarScene] ⚠️ modelUrl is empty — avatar will NOT be loaded",
        );
      }
    }, [modelUrl]);

    return (
      <div className="liya-ai-3d-avatar-react-avatar-scene" ref={containerRef}>
        {isLoading && (
          <div className="liya-ai-3d-avatar-react-avatar-loading">
            <div className="liya-ai-3d-avatar-react-avatar-loading__spinner" />
            <span>Avatar yükleniyor...</span>
          </div>
        )}
        {loadError && (
          <div className="liya-ai-3d-avatar-react-avatar-error">
            {loadError}
          </div>
        )}
      </div>
    );
  },
);

export default AvatarScene;
