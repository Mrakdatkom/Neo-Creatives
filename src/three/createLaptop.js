// createLaptop.js
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

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

// Updated to handle both video AND image elements
function buildScreenMaterial(imageOrVideoEl) {
  let texture;
  let usingImage = false;

  try {
    // Check if it's a video element
    if (imageOrVideoEl.tagName === 'VIDEO') {
      texture = new THREE.VideoTexture(imageOrVideoEl);
      texture.colorSpace = THREE.SRGBColorSpace;
      usingImage = false;
    }
    // Check if it's an image element
    else if (imageOrVideoEl.tagName === 'IMG') {
      texture = new THREE.Texture(imageOrVideoEl);
      texture.colorSpace = THREE.SRGBColorSpace;

      // Important: Handle image loading
      if (imageOrVideoEl.complete) {
        texture.needsUpdate = true;
      } else {
        imageOrVideoEl.onload = () => {
          texture.needsUpdate = true;
        };
      }
      usingImage = true;
    }
  } catch (err) {
    console.warn('Failed to create texture, using fallback color');
    texture = null;
  }

  const material = new THREE.MeshBasicMaterial({
    color: texture ? 0xffffff : 0x3a6ea8,
    map: texture || null,
  });

  return { material, usingImage };
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

export function createLaptop(imageOrVideoEl) {
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

  // Keyboard deck
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

  // ---- Lid group ----
  const lidPivot = new THREE.Group();
  lidPivot.position.set(0, -0.55 + baseThickness / 2, -depth / 2 + 0.06);
  group.add(lidPivot);

  const lidGeo = new RoundedBoxGeometry(width, lidHeight, lidThickness, 3, cornerRadius);
  const lid = new THREE.Mesh(lidGeo, chassisMat);
  lid.position.set(0, lidHeight / 2, -lidThickness / 2);
  lidPivot.add(lid);

  // Screen bezel
  const bezelGeo = new THREE.PlaneGeometry(width - 0.16, lidHeight - 0.16);
  const bezelMat = new THREE.MeshStandardMaterial({ color: 0x030303, roughness: 0.6 });
  const bezel = new THREE.Mesh(bezelGeo, bezelMat);
  bezel.position.set(0, lidHeight / 2, 0.008);
  lidPivot.add(bezel);

  // Screen face with texture
  const { material: screenMat, usingImage } = buildScreenMaterial(imageOrVideoEl);
  const screenGeo = new THREE.PlaneGeometry(width - 0.32, lidHeight - 0.3);
  const screen = new THREE.Mesh(screenGeo, screenMat);
  screen.position.set(0, lidHeight / 2, 0.01);
  lidPivot.add(screen);

  // Thin camera notch
  const notchGeo = new THREE.CircleGeometry(0.02, 12);
  const notchMat = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.9 });
  const notch = new THREE.Mesh(notchGeo, notchMat);
  notch.position.set(0, lidHeight - 0.1, 0.009);
  lidPivot.add(notch);

  // Hinge math: screen tilted back slightly past vertical
  lidPivot.rotation.x = THREE.MathUtils.degToRad(-10);

  // Tilt + yaw the whole assembly for a 3/4 product-shot angle
  group.rotation.x = THREE.MathUtils.degToRad(10);
  group.rotation.y = THREE.MathUtils.degToRad(-20);

  group.userData.screen = screen;
  group.userData.usingImage = usingImage;

  return group;
}