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

  const mm = gsap.matchMedia();

  // ── DESKTOP ONLY: full pin + scrub sequence ──
  mm.add("(min-width: 768px)", () => {
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

    if (header) {
      ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "bottom bottom",
        pin: header,
        pinSpacing: false,
      });
    }

    // cleanup returned from matchMedia handler runs automatically
    // when the media query no longer matches (e.g. resize to mobile)
    return () => {
      groups.forEach((group) => {
        const cards = group.querySelectorAll(".service-card");
        const text = group.querySelector(".group-text");
        gsap.set(cards, { clearProps: "all" });
        gsap.set(text, { clearProps: "all" });
      });
    };
  });

  // ── MOBILE / TABLET: no animation, just make sure everything is visible ──
  mm.add("(max-width: 767px)", () => {
    groups.forEach((group) => {
      const text = group.querySelector(".group-text");
      const cards = group.querySelectorAll(".service-card");
      gsap.set(text, { clearProps: "all" });
      gsap.set(cards, { clearProps: "all" });
    });
  });

  ScrollTrigger.refresh();
}