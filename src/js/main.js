// src/js/main.js
import '../styles/main.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import * as THREE from 'three';
import { animateServices } from './animations/services.js';
import { animateComparison } from './animations/comparison.js';

gsap.registerPlugin(ScrollTrigger);

const fallbackHTML = `<div class="min-h-screen flex items-center justify-center text-white/50">Loading...</div>`;

async function loadSectionHTML(containerId, path) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.warn(`Container #${containerId} not found`);
    return false;
  }

  try {
    console.log(`📥 Fetching ${path}...`);
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const html = await response.text();
    container.innerHTML = html;
    console.log(`✅ Loaded ${containerId} from ${path} (${html.length} chars)`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to load ${containerId}:`, error);
    container.innerHTML = fallbackHTML;
    return false;
  }
}

// ── INIT ──
async function init() {
  try {
    console.log('🚀 Initializing app...');
    console.log('📍 Loading sections from /sections/');

    // Load all sections from public folder
    await loadSectionHTML('section-hero', '/sections/hero.html');
    await loadSectionHTML('section-about', '/sections/about.html');
    await loadSectionHTML('section-services', '/sections/services.html');
    await loadSectionHTML('section-comparison', '/sections/comparison.html');
    await loadSectionHTML('section-contact', '/sections/contact.html');

    // Wait for DOM to update
    await new Promise(resolve => setTimeout(resolve, 300));

    // Check if hero exists after loading
    const hero = document.getElementById('hero');
    console.log('Hero element exists:', !!hero);

    // Initialize everything
    initThreeScene();
    setupMenu();
    setupAnimations();

    // Final refresh
    setTimeout(() => {
      ScrollTrigger.refresh();
      console.log('🔄 ScrollTrigger refreshed');
    }, 500);

  } catch (error) {
    console.error('Error initializing app:', error);
  }
}

// ── 3D SCENE SETUP ──
// In main.js - Updated Three.js loading with better error handling
async function initThreeScene() {
  try {
    const { setupScene } = await import('../three/setupScene.js');
    const { createLaptop } = await import('../three/createLaptop.js');

    const stage = document.getElementById('canvas-stage');
    const imageEl = document.getElementById('screen-image');

    if (!stage) {
      console.warn('Canvas stage not found');
      return;
    }

    console.log('✅ Canvas stage found, initializing Three.js...');

    const { scene, camera, renderer } = setupScene(stage);
    let laptop;

    // Try loading the GLTF model
    if (imageEl) {
      const fallbackLaptop = createLaptop(imageEl);
      laptop = fallbackLaptop;
      laptop.scale.setScalar(0.9);
      laptop.position.set(0, 0.1, 0);
      scene.add(laptop);
      setupLaptopAnimations(laptop, camera);
      console.log('✅ Using procedural laptop');
    }

    function setupLaptopAnimations(laptop, camera) {
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
        const hero = document.getElementById('hero');
        if (hero) {
          gsap.timeline({
            scrollTrigger: {
              trigger: hero,
              start: 'top top',
              end: 'bottom top',
              scrub: 1,
            },
          })
            .to(laptop.rotation, { y: Math.PI * 0.35, x: -0.15 }, 0)
            .to(laptop.position, { y: 0.9, z: 1.2 }, 0)
            .to(camera.position, { y: 0.9 }, 0);
        }
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

  } catch (error) {
    console.error('Error initializing Three.js scene:', error);
  }
}

// ── MENU SETUP ──
function setupMenu() {
  const menuBtn = document.querySelector('.menu-btn');
  const closeMenuBtn = document.getElementById('closeMenuBtn');
  const menuPopup = document.getElementById('menuPopup');
  const menuLinks = document.querySelectorAll('.menu-link');

  if (!menuBtn || !menuPopup) {
    console.warn('Menu elements not found');
    return;
  }

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

// ── SETUP ANIMATIONS ──
function setupAnimations() {
  try {
    animateServices();
    animateComparison();
  } catch (error) {
    console.warn('Error setting up animations:', error);
  }
}

// ── START ──
document.addEventListener('DOMContentLoaded', init);