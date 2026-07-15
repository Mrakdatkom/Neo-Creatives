import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

/**
 * Builds a more realistic placeholder laptop: rounded-edge aluminum-style
 * base + lid on a hinge cylinder, keyboard deck + trackpad detail, and a
 * bezelled screen with a video texture mapped onto it.
 *
 * SWAPPING IN A REAL MODEL LATER:
 *   import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
 *   const loader = new GLTFLoader();
 *   loader.load('/models/laptop.glb', (gltf) => {
 *     const laptop = gltf.scene;
 *     const screenMesh = laptop.getObjectByName('Screen'); // name from your model
 *     screenMesh.material = buildScreenMaterial(videoEl).material;
 *     group.add(laptop);
 *   });
 * The rest of the scroll-animation code targets `group`, so it doesn't care
 * whether the mesh underneath is procedural or a loaded model.
 */

// ---- Shared metal material (brushed-aluminum-ish, matches a dark chassis) ----
function metalMaterial(color = 0x1c1d20) {
  return new THREE.MeshPhysicalMaterial({
    color,
    metalness: 0.85,
    roughness: 0.32,
    clearcoat: 0.5,
    clearcoatRoughness: 0.3,
  });
}

function buildScreenMaterial(videoEl) {
  let texture;
  let usingVideo = false;

  try {
    texture = new THREE.VideoTexture(videoEl);
    texture.colorSpace = THREE.SRGBColorSpace;
    usingVideo = true;
  } catch (err) {
    texture = null;
  }

  const material = new THREE.MeshBasicMaterial({
    // Bright placeholder glow (not near-black) so the screen reads as a lit
    // panel even before a real video is dropped into public/demo-reel.mp4
    color: usingVideo ? 0xffffff : 0x3a6ea8,
    map: usingVideo ? texture : null,
  });

  return { material, usingVideo };
}

// Draws a simple keyboard grid onto a canvas so the deck isn't a blank slab.
function buildKeyboardTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 320;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#141416';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const cols = 15;
  const rows = 5;
  const pad = 18;
  const gap = 6;
  const keyW = (canvas.width - pad * 2 - gap * (cols - 1)) / cols;
  const keyH = 30;
  const startY = 24;

  ctx.fillStyle = '#232427';
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = pad + c * (keyW + gap);
      const y = startY + r * (keyH + gap);
      const rad = 3;
      ctx.beginPath();
      ctx.roundRect(x, y, keyW, keyH, rad);
      ctx.fill();
    }
  }

  // Trackpad area beneath the keys
  ctx.fillStyle = '#1a1b1e';
  const tpW = 160;
  const tpH = 100;
  ctx.beginPath();
  ctx.roundRect((canvas.width - tpW) / 2, startY + rows * (keyH + gap) + 14, tpW, tpH, 8);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createLaptop(videoEl) {
  const group = new THREE.Group();
  const chassisMat = metalMaterial();

  // ---- Dimensions (roughly a 15" laptop's proportions) ----
  const width = 3.4;
  const depth = 2.3;
  const baseThickness = 0.11;
  const lidThickness = 0.07;
  const lidHeight = 2.15;
  const cornerRadius = 0.06;

  // ---- Base ----
  const baseGeo = new RoundedBoxGeometry(width, baseThickness, depth, 3, cornerRadius);
  const base = new THREE.Mesh(baseGeo, chassisMat);
  base.position.y = -0.55;
  group.add(base);

  // Keyboard deck: a thin inset panel on top of the base with a keyboard
  // texture, sitting just above the chassis surface to avoid z-fighting.
  const deckTexture = buildKeyboardTexture();
  const deckMat = new THREE.MeshStandardMaterial({
    map: deckTexture,
    roughness: 0.7,
    metalness: 0.1,
  });
  const deckGeo = new THREE.PlaneGeometry(width - 0.28, depth - 0.32);
  const deck = new THREE.Mesh(deckGeo, deckMat);
  deck.rotation.x = -Math.PI / 2;
  deck.position.set(0, -0.55 + baseThickness / 2 + 0.001, -0.06);
  group.add(deck);

  // ---- Hinge cylinder ----
  const hingeGeo = new THREE.CylinderGeometry(0.05, 0.05, width - 0.2, 16);
  const hinge = new THREE.Mesh(hingeGeo, metalMaterial(0x0d0d0f));
  hinge.rotation.z = Math.PI / 2;
  hinge.position.set(0, -0.55 + baseThickness / 2 - 0.01, -depth / 2 + 0.06);
  group.add(hinge);

  // ---- Lid group (pivots at the hinge) ----
  const lidPivot = new THREE.Group();
  lidPivot.position.set(0, -0.55 + baseThickness / 2, -depth / 2 + 0.06);
  group.add(lidPivot);

  const lidGeo = new RoundedBoxGeometry(width, lidHeight, lidThickness, 3, cornerRadius);
  const lid = new THREE.Mesh(lidGeo, chassisMat);
  lid.position.set(0, lidHeight / 2, -lidThickness / 2);
  lidPivot.add(lid);

  // Screen bezel: slightly larger than the video plane, sunk a hair behind
  // it, so the video reads as an inset panel rather than a face pasted on
  // the front of the lid.
  const bezelGeo = new THREE.PlaneGeometry(width - 0.16, lidHeight - 0.16);
  const bezelMat = new THREE.MeshStandardMaterial({ color: 0x030303, roughness: 0.6 });
  const bezel = new THREE.Mesh(bezelGeo, bezelMat);
  bezel.position.set(0, lidHeight / 2, 0.008);
  lidPivot.add(bezel);

  // Screen face (video texture)
  const { material: screenMat, usingVideo } = buildScreenMaterial(videoEl);
  const screenGeo = new THREE.PlaneGeometry(width - 0.32, lidHeight - 0.3);
  const screen = new THREE.Mesh(screenGeo, screenMat);
  screen.position.set(0, lidHeight / 2, 0.01);
  lidPivot.add(screen);

  // Thin camera notch for realism
  const notchGeo = new THREE.CircleGeometry(0.02, 12);
  const notchMat = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.9 });
  const notch = new THREE.Mesh(notchGeo, notchMat);
  notch.position.set(0, lidHeight - 0.1, 0.009);
  lidPivot.add(notch);

  // Hinge math: at rotation.x = 0 the lid stands straight up (screen vertical,
  // facing the camera). Positive rotation folds it CLOSED (forward, flat onto
  // the base at +90°). A small NEGATIVE angle tilts the screen back slightly
  // past vertical — the natural "in-use" laptop pose, and it also angles the
  // screen's normal upward toward a camera positioned above the object.
  lidPivot.rotation.x = THREE.MathUtils.degToRad(-10);

  // Tilt + yaw the whole assembly for a 3/4 product-shot angle instead of a
  // flat-on view — lets the camera read it as a 3D object, not a flat card.
  group.rotation.x = THREE.MathUtils.degToRad(10);
  group.rotation.y = THREE.MathUtils.degToRad(-20);

  group.userData.screen = screen;
  group.userData.usingVideo = usingVideo;

  return group;
}
