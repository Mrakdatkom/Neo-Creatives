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

// Add this before your form handler
function validateForm(data) {
  const errors = [];

  if (!data.name || data.name.trim().length < 2) {
    errors.push('Name must be at least 2 characters');
  }

  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Please enter a valid email');
  }

  if (!data.message || data.message.trim().length < 10) {
    errors.push('Message must be at least 10 characters');
  }

  return errors;
}

// Updated form handler
document.addEventListener('submit', async (e) => {
  if (!e.target.matches('#contact-form')) return;

  console.log('📝 Form submission detected!');
  e.preventDefault();

  const form = e.target;
  const submitBtn = form.querySelector('button[type="submit"]');
  const successMsg = document.getElementById('success-message');
  const errorMsg = document.getElementById('error-message');

  // Hide previous messages
  if (successMsg) {
    successMsg.classList.add('hidden');
    gsap.set(successMsg, { opacity: 0, y: 20 });
  }
  if (errorMsg) {
    errorMsg.classList.add('hidden');
    gsap.set(errorMsg, { opacity: 0, y: 20 });
  }

  const formData = new FormData(form);
  const data = Object.fromEntries(formData);

  // Client-side validation
  const validationErrors = validateForm(data);
  if (validationErrors.length > 0) {
    if (errorMsg) {
      errorMsg.textContent = validationErrors.join('. ');
      errorMsg.classList.remove('hidden');
      gsap.to(errorMsg, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' });
    }
    return;
  }

  // Disable button
  submitBtn.disabled = true;
  const originalText = submitBtn.textContent;
  submitBtn.textContent = 'Sending...';

  console.log('📤 Sending data:', data);

  try {
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        message: data.message.trim()
      })
    });

    console.log('📨 Response status:', response.status);
    const result = await response.json();
    console.log('📨 Response data:', result);

    if (response.ok) {
      form.reset();

      if (successMsg) {
        successMsg.textContent = result.message || '✓ Message sent successfully! We\'ll get back to you soon.';
        successMsg.classList.remove('hidden');
        gsap.to(successMsg, {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: 'power2.out'
        });
        console.log('✅ Success message shown');
      }

      // Auto-hide after 6 seconds
      setTimeout(() => {
        if (successMsg) {
          gsap.to(successMsg, {
            opacity: 0,
            y: -10,
            duration: 0.3,
            onComplete: () => successMsg.classList.add('hidden')
          });
        }
      }, 6000);

    } else {
      if (errorMsg) {
        errorMsg.textContent = result.error || 'Something went wrong';
        errorMsg.classList.remove('hidden');
        gsap.to(errorMsg, {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: 'power2.out'
        });
      }
      console.error('❌ Server error:', result.error);
    }
  } catch (error) {
    console.error('❌ Submission failed:', error);
    if (errorMsg) {
      errorMsg.textContent = 'Network error. Please try again.';
      errorMsg.classList.remove('hidden');
      gsap.to(errorMsg, {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: 'power2.out'
      });
    }
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
});

// ── START ──
document.addEventListener('DOMContentLoaded', init);