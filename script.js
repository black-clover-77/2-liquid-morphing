// ===== LIQUID MORPHING - ENHANCED JAVASCRIPT =====

const audio = document.getElementById("bg-audio");
const audioToggle = document.getElementById("audio-toggle");
const mergeSound = document.getElementById("merge-sound");
const splitSound = document.getElementById("split-sound");
let audioPlaying = false;

// Settings
let settings = {
  gravity: 1.0,
  viscosity: 0.5,
  blobSize: 70,
  metaballBlur: 18,
  trails: false,
  soundEffects: true,
  rainbowMode: false
};

let mergeCount = 0;
let frozen = false;

// Audio control
document.addEventListener("click", function startAudio() {
  audio.play().then(() => {
    audioPlaying = true;
    audioToggle.innerHTML = '<i class="fas fa-volume-up"></i>';
  }).catch(() => {});
  document.removeEventListener("click", startAudio);
}, { once: true });

audioToggle.addEventListener("click", (e) => {
  e.stopPropagation();
  if (audioPlaying) {
    audio.pause();
    audioToggle.innerHTML = '<i class="fas fa-volume-mute"></i>';
    audioPlaying = false;
  } else {
    audio.play();
    audioToggle.innerHTML = '<i class="fas fa-volume-up"></i>';
    audioPlaying = true;
  }
});

// Loader
window.addEventListener("load", () => {
  setTimeout(() => document.getElementById("loader").classList.add("hidden"), 1500);
});

// Custom cursor
const cursorDot = document.createElement("div");
cursorDot.className = "cursor-dot";
document.body.appendChild(cursorDot);

let cursorX = window.innerWidth / 2;
let cursorY = window.innerHeight / 2;

document.addEventListener("mousemove", (e) => {
  cursorX = e.clientX;
  cursorY = e.clientY;
  cursorDot.style.left = e.clientX + "px";
  cursorDot.style.top = e.clientY + "px";
});

// Blob container
const container = document.getElementById("blob-container");
const blobs = [];
let mouseSpeed = 0;
let lastCX = 0;
let lastCY = 0;

// Blob class
class Blob {
  constructor(x, y, size) {
    this.x = x || Math.random() * window.innerWidth;
    this.y = y || Math.random() * window.innerHeight;
    this.size = size || settings.blobSize + Math.random() * 40;
    this.vx = 0;
    this.vy = 0;
    this.targetX = this.x;
    this.targetY = this.y;
    this.el = document.createElement("div");
    this.el.className = "blob";
    this.el.style.width = this.size + "px";
    this.el.style.height = this.size + "px";
    
    // Color selection
    if (settings.rainbowMode) {
      this.baseColor = `hsl(${Math.random() * 360}, 70%, 60%)`;
    } else {
      const roll = Math.random();
      if (roll < 0.33) this.baseColor = "#FF9933"; // Saffron
      else if (roll < 0.66) this.baseColor = "#FFFFFF"; // White
      else this.baseColor = "#138808"; // Green
    }
    
    this.el.style.background = this.baseColor;
    this.el.style.boxShadow = `inset -${this.size / 4}px -${this.size / 4}px ${this.size / 2}px rgba(0,0,0,0.3), inset ${this.size / 6}px ${this.size / 6}px ${this.size / 3}px rgba(255,255,255,0.3)`;
    container.appendChild(this.el);
    
    this.dragging = false;
    this.offsetX = 0;
    this.offsetY = 0;
    this.trail = [];
    this.setupDrag();
  }

  setupDrag() {
    const onDown = (e) => {
      e.preventDefault();
      this.dragging = true;
      const pt = e.touches ? e.touches[0] : e;
      this.offsetX = pt.clientX - this.x;
      this.offsetY = pt.clientY - this.y;
    };

    const onMove = (e) => {
      if (!this.dragging) return;
      const pt = e.touches ? e.touches[0] : e;
      this.targetX = pt.clientX - this.offsetX;
      this.targetY = pt.clientY - this.offsetY;
    };

    const onUp = () => (this.dragging = false);

    this.el.addEventListener("mousedown", onDown);
    this.el.addEventListener("touchstart", onDown, { passive: false });
    document.addEventListener("mousemove", onMove);
    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("mouseup", onUp);
    document.addEventListener("touchend", onUp);
  }

  update(temp) {
    if (frozen) return;

    // Attraction to cursor
    if (!this.dragging) {
      const dx = cursorX - this.x;
      const dy = cursorY - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 1) {
        const force = Math.min(1, 100 / dist) * settings.gravity;
        this.targetX = this.x + (dx / dist) * force;
        this.targetY = this.y + (dy / dist) * force;
      }
    }

    // Apply viscosity
    const damping = 0.06 * (1 - settings.viscosity * 0.5);
    this.x += (this.targetX - this.x) * damping;
    this.y += (this.targetY - this.y) * damping;

    // Trail effect
    if (settings.trails) {
      this.trail.push({ x: this.x, y: this.y });
      if (this.trail.length > 10) this.trail.shift();
      
      this.trail.forEach((pos, i) => {
        const trailEl = document.createElement("div");
        trailEl.className = "blob-trail";
        trailEl.style.cssText = `
          position: absolute;
          width: ${this.size * (i / this.trail.length)}px;
          height: ${this.size * (i / this.trail.length)}px;
          left: ${pos.x}px;
          top: ${pos.y}px;
          background: ${this.baseColor};
          border-radius: 50%;
          opacity: ${i / this.trail.length * 0.3};
          pointer-events: none;
        `;
        container.appendChild(trailEl);
        setTimeout(() => trailEl.remove(), 100);
      });
    }

    // Color shift based on temperature
    if (this.baseColor === "#FFFFFF") {
      this.el.style.background = `hsl(200, 10%, ${85 + temp / 2}%)`;
    } else if (!settings.rainbowMode) {
      this.el.style.filter = `hue-rotate(${temp}deg)`;
    }

    // Pulsing animation
    const s = this.size + Math.sin(Date.now() * 0.003 + this.size) * 3;
    this.el.style.width = s + "px";
    this.el.style.height = s + "px";
    this.el.style.left = this.x - s / 2 + "px";
    this.el.style.top = this.y - s / 2 + "px";
  }

  remove() {
    this.el.remove();
  }
}

// Initialize blobs
for (let i = 0; i < 8; i++) blobs.push(new Blob());

// Update blob count
function updateBlobCount() {
  document.getElementById("blob-count").textContent = blobs.length;
}

// Check for merges
function checkMerges() {
  for (let i = 0; i < blobs.length; i++) {
    for (let j = i + 1; j < blobs.length; j++) {
      const dx = blobs[i].x - blobs[j].x;
      const dy = blobs[i].y - blobs[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const minDist = (blobs[i].size + blobs[j].size) / 3;
      
      if (dist < minDist) {
        mergeCount++;
        document.getElementById("merge-count").textContent = mergeCount;
        if (settings.soundEffects) {
          mergeSound.currentTime = 0;
          mergeSound.play().catch(() => {});
        }
      }
    }
  }
}

// Temperature gauge
function updateTemp() {
  const dx = cursorX - lastCX;
  const dy = cursorY - lastCY;
  mouseSpeed = mouseSpeed * 0.9 + Math.sqrt(dx * dx + dy * dy) * 0.1;
  lastCX = cursorX;
  lastCY = cursorY;
  const temp = Math.min(100, mouseSpeed * 2);
  document.getElementById("gauge-fill").style.height = temp + "%";
  document.getElementById("temp-value").textContent = Math.round(20 + temp * 0.8) + "°C";
  return temp;
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  const temp = updateTemp();
  blobs.forEach((b) => b.update(temp));
}
animate();

// Merge check interval
setInterval(checkMerges, 1000);

// ===== CONTROLS =====

// Freeze button
document.getElementById("freeze-btn").addEventListener("click", (e) => {
  e.stopPropagation();
  frozen = !frozen;
  document.getElementById("freeze-btn").innerHTML = frozen
    ? '<i class="fas fa-fire"></i> Unfreeze'
    : '<i class="fas fa-snowflake"></i> Freeze';
  
  blobs.forEach((b) => {
    b.el.style.transition = frozen ? "all 0.5s" : "background 0.5s";
    if (frozen) b.el.style.filter = "brightness(1.3) saturate(0.3)";
    else b.el.style.filter = "";
  });
  
  showNotification(frozen ? "Blobs frozen! ❄️" : "Blobs unfrozen! 🔥");
});

// Scatter button
document.getElementById("scatter-btn").addEventListener("click", (e) => {
  e.stopPropagation();
  blobs.forEach((b) => {
    b.targetX = Math.random() * window.innerWidth;
    b.targetY = Math.random() * window.innerHeight;
  });
  showNotification("Blobs scattered! 💨");
});

// Add blob button
document.getElementById("add-btn").addEventListener("click", (e) => {
  e.stopPropagation();
  if (blobs.length < 20) {
    blobs.push(new Blob(cursorX, cursorY, settings.blobSize + Math.random() * 40));
    updateBlobCount();
    showNotification("Blob added! ➕");
  } else {
    showNotification("Maximum blobs reached! (20)");
  }
});

// Split blob button
document.getElementById("split-btn").addEventListener("click", (e) => {
  e.stopPropagation();
  if (blobs.length > 0 && blobs.length < 18) {
    const blob = blobs[Math.floor(Math.random() * blobs.length)];
    blobs.push(new Blob(blob.x + 30, blob.y + 30, blob.size * 0.7));
    blobs.push(new Blob(blob.x - 30, blob.y - 30, blob.size * 0.7));
    updateBlobCount();
    if (settings.soundEffects) {
      splitSound.currentTime = 0;
      splitSound.play().catch(() => {});
    }
    showNotification("Blob split! ✂️");
  }
});

// Rainbow mode button
document.getElementById("rainbow-btn").addEventListener("click", (e) => {
  e.stopPropagation();
  settings.rainbowMode = !settings.rainbowMode;
  document.getElementById("rainbow-btn").innerHTML = settings.rainbowMode
    ? '<i class="fas fa-rainbow"></i> Rainbow ON'
    : '<i class="fas fa-rainbow"></i> Rainbow';
  
  if (settings.rainbowMode) {
    blobs.forEach((b, i) => {
      b.baseColor = `hsl(${(i * 360) / blobs.length}, 70%, 60%)`;
      b.el.style.background = b.baseColor;
      b.el.style.filter = "none";
    });
    showNotification("Rainbow mode activated! 🌈");
  } else {
    blobs.forEach((b) => {
      const roll = Math.random();
      if (roll < 0.33) b.baseColor = "#FF9933";
      else if (roll < 0.66) b.baseColor = "#FFFFFF";
      else b.baseColor = "#138808";
      b.el.style.background = b.baseColor;
    });
    showNotification("Rainbow mode deactivated!");
  }
});

// Export GIF button (placeholder)
document.getElementById("export-btn").addEventListener("click", (e) => {
  e.stopPropagation();
  showNotification("GIF export feature coming soon! 📸");
  // TODO: Implement with gif.js library
});

// ===== SETTINGS PANEL =====

const settingsPanel = document.getElementById("settings-panel");
const settingsBtn = document.getElementById("settings-btn");
const closeSettingsBtn = document.getElementById("close-settings-btn");
const resetLabBtn = document.getElementById("reset-lab-btn");

settingsBtn.addEventListener("click", () => {
  settingsPanel.style.display = "block";
});

closeSettingsBtn.addEventListener("click", () => {
  settingsPanel.style.display = "none";
});

resetLabBtn.addEventListener("click", () => {
  // Reset all settings
  settings = {
    gravity: 1.0,
    viscosity: 0.5,
    blobSize: 70,
    metaballBlur: 18,
    trails: false,
    soundEffects: true,
    rainbowMode: false
  };
  
  // Reset UI
  document.getElementById("gravity-slider").value = 1;
  document.getElementById("viscosity-slider").value = 50;
  document.getElementById("size-slider").value = 70;
  document.getElementById("blur-slider").value = 18;
  document.getElementById("trails-toggle").checked = false;
  document.getElementById("sound-effects-toggle").checked = true;
  
  // Reset blobs
  blobs.forEach(b => b.remove());
  blobs.length = 0;
  for (let i = 0; i < 8; i++) blobs.push(new Blob());
  
  updateBlobCount();
  mergeCount = 0;
  document.getElementById("merge-count").textContent = 0;
  
  showNotification("Lab reset! 🔄");
});

// Gravity slider
document.getElementById("gravity-slider").addEventListener("input", (e) => {
  settings.gravity = parseFloat(e.target.value);
  document.getElementById("gravity-val").textContent = settings.gravity.toFixed(1) + "x";
});

// Viscosity slider
document.getElementById("viscosity-slider").addEventListener("input", (e) => {
  settings.viscosity = parseInt(e.target.value) / 100;
  document.getElementById("viscosity-slider-val").textContent = e.target.value + "%";
  document.getElementById("viscosity-val").textContent = e.target.value + "%";
});

// Size slider
document.getElementById("size-slider").addEventListener("input", (e) => {
  settings.blobSize = parseInt(e.target.value);
  const sizes = {
    30: "Tiny",
    40: "Small",
    50: "Small",
    60: "Medium",
    70: "Medium",
    80: "Large",
    90: "Large",
    100: "Huge",
    110: "Huge",
    120: "Giant",
    130: "Giant",
    140: "Giant",
    150: "Giant"
  };
  document.getElementById("size-val").textContent = sizes[e.target.value] || "Medium";
});

// Blur slider
document.getElementById("blur-slider").addEventListener("input", (e) => {
  settings.metaballBlur = parseInt(e.target.value);
  document.getElementById("blur-val").textContent = e.target.value + "px";
  document.querySelector("#metaball feGaussianBlur").setAttribute("stdDeviation", e.target.value);
});

// Trails toggle
document.getElementById("trails-toggle").addEventListener("change", (e) => {
  settings.trails = e.target.checked;
  showNotification(settings.trails ? "Trails enabled! ✨" : "Trails disabled!");
});

// Sound effects toggle
document.getElementById("sound-effects-toggle").addEventListener("change", (e) => {
  settings.soundEffects = e.target.checked;
});

// ===== PRESET PATTERNS =====

document.querySelectorAll(".pattern-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const pattern = btn.dataset.pattern;
    applyPattern(pattern);
  });
});

function applyPattern(pattern) {
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;
  const radius = Math.min(window.innerWidth, window.innerHeight) * 0.3;

  switch (pattern) {
    case "circle":
      blobs.forEach((b, i) => {
        const angle = (i / blobs.length) * Math.PI * 2;
        b.targetX = centerX + Math.cos(angle) * radius;
        b.targetY = centerY + Math.sin(angle) * radius;
      });
      break;

    case "square":
      const side = Math.ceil(Math.sqrt(blobs.length));
      blobs.forEach((b, i) => {
        const x = i % side;
        const y = Math.floor(i / side);
        b.targetX = centerX - radius + (x * (radius * 2)) / (side - 1);
        b.targetY = centerY - radius + (y * (radius * 2)) / (side - 1);
      });
      break;

    case "heart":
      blobs.forEach((b, i) => {
        const t = (i / blobs.length) * Math.PI * 2;
        const x = 16 * Math.pow(Math.sin(t), 3);
        const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
        b.targetX = centerX + x * 12;
        b.targetY = centerY + y * 12;
      });
      break;

    case "star":
      blobs.forEach((b, i) => {
        const angle = (i / blobs.length) * Math.PI * 2;
        const r = i % 2 === 0 ? radius : radius * 0.5;
        b.targetX = centerX + Math.cos(angle) * r;
        b.targetY = centerY + Math.sin(angle) * r;
      });
      break;

    case "spiral":
      blobs.forEach((b, i) => {
        const angle = (i / blobs.length) * Math.PI * 6;
        const r = (i / blobs.length) * radius;
        b.targetX = centerX + Math.cos(angle) * r;
        b.targetY = centerY + Math.sin(angle) * r;
      });
      break;

    case "wave":
      blobs.forEach((b, i) => {
        b.targetX = (i / blobs.length) * window.innerWidth;
        b.targetY = centerY + Math.sin((i / blobs.length) * Math.PI * 4) * 100;
      });
      break;
  }

  showNotification(`Pattern: ${pattern.toUpperCase()} applied! ✨`);
}

// ===== UTILITY FUNCTIONS =====

// Screenshot
function captureScreenshot() {
  const canvas = document.createElement("canvas");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext("2d");

  // Draw background
  ctx.fillStyle = getComputedStyle(document.body).backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw blobs
  blobs.forEach((b) => {
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.size / 2, 0, Math.PI * 2);
    ctx.fillStyle = b.baseColor;
    ctx.fill();
  });

  const link = document.createElement("a");
  link.download = `liquid-morphing-${Date.now()}.png`;
  link.href = canvas.toDataURL();
  link.click();
  showNotification("Screenshot saved! 📸");
}

// Notification system
function showNotification(message) {
  const notif = document.createElement("div");
  notif.textContent = message;
  notif.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    background: rgba(79, 195, 247, 0.1);
    border: 1px solid rgba(79, 195, 247, 0.3);
    padding: 12px 20px;
    border-radius: 8px;
    color: #4fc3f7;
    font-size: 0.8rem;
    z-index: 10000;
    backdrop-filter: blur(10px);
    animation: slideInRight 0.3s ease;
    font-family: 'Space Mono', monospace;
  `;
  document.body.appendChild(notif);
  setTimeout(() => {
    notif.style.animation = "slideOutRight 0.3s ease";
    setTimeout(() => notif.remove(), 300);
  }, 3000);
}

// Add animation CSS
const animStyle = document.createElement("style");
animStyle.textContent = `
  @keyframes slideInRight {
    from { transform: translateX(400px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOutRight {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(400px); opacity: 0; }
  }
`;
document.head.appendChild(animStyle);

// ===== FULLSCREEN & SCREENSHOT BUTTONS =====

const fullscreenBtn = document.getElementById("fullscreen-btn");
const screenshotBtn = document.getElementById("screenshot-btn");

fullscreenBtn.addEventListener("click", () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
    fullscreenBtn.innerHTML = '<i class="fas fa-compress"></i>';
  } else {
    document.exitFullscreen();
    fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
  }
});

screenshotBtn.addEventListener("click", captureScreenshot);

// ===== KEYBOARD SHORTCUTS =====

const shortcutsHelp = document.getElementById("shortcuts-help");
const closeHelpBtn = document.getElementById("close-help-btn");

closeHelpBtn.addEventListener("click", () => {
  shortcutsHelp.style.display = "none";
});

document.addEventListener("keydown", (e) => {
  if (e.key === "s" || e.key === "S") {
    e.preventDefault();
    captureScreenshot();
  }
  if (e.key === "f" || e.key === "F") {
    e.preventDefault();
    fullscreenBtn.click();
  }
  if (e.key === "m" || e.key === "M") {
    e.preventDefault();
    audioToggle.click();
  }
  if (e.key === " ") {
    e.preventDefault();
    document.getElementById("freeze-btn").click();
  }
  if (e.key === "a" || e.key === "A") {
    e.preventDefault();
    document.getElementById("add-btn").click();
  }
  if (e.key === "r" || e.key === "R") {
    e.preventDefault();
    document.getElementById("rainbow-btn").click();
  }
  if (e.key === "c" || e.key === "C") {
    e.preventDefault();
    blobs.forEach((b) => b.remove());
    blobs.length = 0;
    for (let i = 0; i < 8; i++) blobs.push(new Blob());
    updateBlobCount();
    mergeCount = 0;
    document.getElementById("merge-count").textContent = 0;
    showNotification("All blobs cleared! 🗑️");
  }
  if (e.key === "?") {
    e.preventDefault();
    shortcutsHelp.style.display = shortcutsHelp.style.display === "none" ? "flex" : "none";
  }
});

// ===== MOBILE TOUCH SUPPORT =====

// Handle touch for cursor position
document.addEventListener("touchmove", (e) => {
  if (e.touches.length === 1) {
    cursorX = e.touches[0].clientX;
    cursorY = e.touches[0].clientY;
  }
});

// ===== WINDOW RESIZE =====

window.addEventListener("resize", () => {
  // Keep blobs within bounds
  blobs.forEach((b) => {
    b.x = Math.min(Math.max(b.x, 0), window.innerWidth);
    b.y = Math.min(Math.max(b.y, 0), window.innerHeight);
    b.targetX = b.x;
    b.targetY = b.y;
  });
});

// ===== INITIALIZE =====

updateBlobCount();
audio.volume = 0.3;
mergeSound.volume = 0.5;
splitSound.volume = 0.5;

console.log("🧪 Liquid Mercury Lab initialized!");
console.log("Press ? for keyboard shortcuts");
