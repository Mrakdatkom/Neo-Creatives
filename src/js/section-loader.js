// src/js/section-loader.js
export async function loadSection(path, containerId) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.warn(`Container #${containerId} not found`);
    return false;
  }

  try {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Failed to load ${path}: ${response.status}`);
    }
    const html = await response.text();
    container.innerHTML = html;
    return true;
  } catch (error) {
    console.error(`Error loading ${path}:`, error);
    return false;
  }
}