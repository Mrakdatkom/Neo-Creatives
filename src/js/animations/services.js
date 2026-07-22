// src/js/animations/services.js
import ScrollTrigger from "gsap/ScrollTrigger";
import gsap from "gsap";
gsap.registerPlugin(ScrollTrigger);

export function animateServices() {
  const section = document.querySelector("#services");
  const header = document.querySelector(".services-header");
  const groups = gsap.utils.toArray(".service-group");

  if (!section || !groups.length) {
    console.warn("Services section or groups not found in DOM");
    return;
  }

  // 1. Build all group timelines FIRST — their pins add spacer height
  groups.forEach((group) => {
    const text = group.querySelector(".group-text");
    const cards = group.querySelectorAll(".service-card");
    if (!text || !cards.length) return;

    gsap.set(cards, { yPercent: 100, opacity: 0 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: group,
        start: "top top",
        end: "+=200%",
        scrub: 1,
        pin: true,
        pinSpacing: true,
        anticipatePin: 1,
      },
    });

    tl.to(text, { scale: 0.2, ease: "none", duration: 0.2 }, 0)
      .to(cards, { yPercent: 0, opacity: 1, ease: "power2.out", duration: 0.4 }, 0.15)
      .to(cards, { yPercent: -140, ease: "none", duration: 0.3 }, 0.55)
      .to(text, { opacity: 0, ease: "none", duration: 0.1 }, 0.8);
  });

  // 2. NOW pin the header — section's true (inflated) height is already known
  if (header) {
    ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: "bottom bottom",
      pin: header,
      pinSpacing: false,
    });
  }

  // 3. Force GSAP to remeasure everything cleanly, no stale values
  ScrollTrigger.refresh();
}