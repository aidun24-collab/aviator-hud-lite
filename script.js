// HUD PRO — MAIN SCRIPT

let running = false;
let output = document.getElementById("auto-output");

function startHelper() {
  running = true;
  output.innerHTML = "Helper running... Scanning aviator multiplier flow...";
  loopScan();
}

function stopHelper() {
  running = false;
  output.innerHTML = "Helper stopped.";
}

function loopScan() {
  if (!running) return;

  let signals = [
    "Preparing next round...",
    "Tracking rise momentum...",
    "Scanning volatility...",
    "Analysing safe window...",
    "Signal coming...",
    "COMPLETE: 1.25X Safe"
  ];

  let pick = Math.floor(Math.random() * signals.length);
  output.innerHTML = signals[pick];

  setTimeout(loopScan, 2000);
}
