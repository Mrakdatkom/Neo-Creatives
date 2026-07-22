// src\js\main.js
import '../styles/main.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { loadSection } from './section-loader.js';
import * as THREE from 'three';
import { animateServices } from './animations/services.js';
import { animateComparison } from './animations/comparison.js';

gsap.registerPlugin(ScrollTrigger);

let smoother = null;

function refreshScroll() {
  if (smoother) {
    smoother.refresh();
  }
  ScrollTrigger.refresh();
}

// ── SECTION LOADER ──
async function init() {
  // Load main hero content
  await loadSection('/src/sections/hero.html', 'section-hero');

  // Load remaining sections
  const sections = [
    { path: '/src/sections/about.html', id: 'section-about' },
    { path: '/src/sections/services.html', id: 'section-services', animate: animateServices },
    { path: '/src/sections/comparison.html', id: 'section-comparison', animate: animateComparison },
    { path: '/src/sections/contact.html', id: 'section-contact' },
  ];

  for (const section of sections) {
    const loaded = await loadSection(section.path, section.id);
    if (loaded) {
      // Only animate if the section has an animate function
      if (section.animate) {
        section.animate();
      }
      refreshScroll();
    }
  }

  // ── INITIALIZE 3D SCENE ──
  initThreeScene();

  // ── SETUP MENU ──
  setupMenu();
}

// ── 3D SCENE SETUP ──
async function initThreeScene() {
  const { setupScene } = await import('../three/setupScene.js');
  const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
  const { createLaptop } = await import('../three/createLaptop.js');

  const stage = document.getElementById('canvas-stage');
  const imageEl = document.getElementById('screen-image');

  if (!stage) return;

  const { scene, camera, renderer } = setupScene(stage);
  const loader = new GLTFLoader();
  let laptop;

  loader.load('/models/laptop.gltf', (gltf) => {
    laptop = gltf.scene;
    const screenMesh = laptop.getObjectByName('Screen') ||
      laptop.getObjectByName('screen') ||
      laptop.getObjectByName('Display');

    if (screenMesh) {
      const texture = new THREE.Texture(imageEl);
      texture.colorSpace = THREE.SRGBColorSpace;

      if (imageEl.complete) {
        texture.needsUpdate = true;
      } else {
        imageEl.onload = () => {
          texture.needsUpdate = true;
          screenMesh.material.map = texture;
          screenMesh.material.needsUpdate = true;
        };
      }

      screenMesh.material = new THREE.MeshBasicMaterial({
        map: texture,
        color: 0xffffff,
      });
      laptop.userData.screen = screenMesh;
    }

    laptop.scale.setScalar(0.9);
    laptop.position.set(0, 0.1, 0);
    laptop.rotation.x = THREE.MathUtils.degToRad(10);
    laptop.rotation.y = THREE.MathUtils.degToRad(-20);

    scene.add(laptop);
    setupAnimations(laptop);
    console.log('Laptop model loaded successfully!');

  }, undefined, (error) => {
    console.error('Error loading laptop model:', error);
    const fallbackLaptop = createLaptop(imageEl);
    laptop = fallbackLaptop;
    laptop.scale.setScalar(0.9);
    laptop.position.set(0, 0.1, 0);
    scene.add(laptop);
    setupAnimations(laptop);
    console.log('Using fallback procedural laptop');
  });

  function setupAnimations(laptop) {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    gsap.from(laptop.scale, {
      x: 0.7,
      y: 0.7,
      z: 0.7,
      duration: 1.4,
      ease: 'power3.out',
    });
    gsap.from(laptop.position, {
      y: -0.6,
      duration: 1.4,
      ease: 'power3.out',
    });

    if (!prefersReducedMotion) {
      gsap.timeline({
        scrollTrigger: {
          trigger: '#hero',
          start: 'top top',
          end: 'bottom top',
          scrub: 1,
        },
      })
        .to(laptop.rotation, { y: Math.PI * 0.35, x: -0.15 }, 0)
        .to(laptop.position, { y: 0.9, z: 1.2 }, 0)
        .to(camera.position, { y: 0.9 }, 0);
    }

    gsap.to(laptop.rotation, {
      y: '+=0.06',
      duration: 3.2,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
    });
  }

  function tick() {
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  tick();
}

// ── MENU SETUP ──
function setupMenu() {
  const menuBtn = document.querySelector('.menu-btn');
  const closeMenuBtn = document.getElementById('closeMenuBtn');
  const menuPopup = document.getElementById('menuPopup');
  const menuLinks = document.querySelectorAll('.menu-link');

  if (!menuBtn || !menuPopup) return;

  function openMenu() {
    menuPopup.classList.remove('pointer-events-none', 'opacity-0');
    menuPopup.classList.add('pointer-events-auto', 'opacity-100');
    const panel = menuPopup.querySelector('.bg-white');
    if (panel) {
      panel.classList.remove('scale-90');
      panel.classList.add('scale-100');
    }
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    menuPopup.classList.remove('pointer-events-auto', 'opacity-100');
    menuPopup.classList.add('pointer-events-none', 'opacity-0');
    const panel = menuPopup.querySelector('.bg-white');
    if (panel) {
      panel.classList.remove('scale-100');
      panel.classList.add('scale-90');
    }
    document.body.style.overflow = '';
  }

  menuBtn.addEventListener('click', openMenu);
  if (closeMenuBtn) closeMenuBtn.addEventListener('click', closeMenu);
  menuPopup.addEventListener('click', (e) => {
    if (e.target === menuPopup || e.target.classList.contains('bg-black/40')) {
      closeMenu();
    }
  });
  menuLinks.forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });
}

// ── START ──
document.addEventListener('DOMContentLoaded', init);