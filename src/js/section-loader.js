// src/js/section-loader.js

export async function loadSection(sectionPath, targetId) {
  const target = document.getElementById(targetId);
  if (!target) return false;

  try {
    const res = await fetch(sectionPath);
    const html = await res.text();
    target.innerHTML = html;
    return true;
  } catch (err) {
    console.warn(`Could not load section "${sectionPath}":`, err);
    return false;
  }
}