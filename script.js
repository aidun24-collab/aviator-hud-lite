// Utility: random float with 2 decimals
function randRange(min, max) {
    return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

// Simulate next "crash" value using last value as a guide
function simulateNextRound() {
    const last = roundHistory[roundHistory.length - 1] || 2.0;

    // bias: sometimes small, sometimes spike
    let factor;
    const roll = Math.random();

    if (roll < 0.55) {
        // normal zone: small move
        factor = randRange(0.7, 1.4);
    } else if (roll < 0.8) {
        // helper / mid spikes
        factor = randRange(1.5, 2.8);
    } else {
        // ultra spike
        factor = randRange(3.0, 8.0);
    }

    let candidate = last * factor;

    // clamp between config min & max
    if (candidate < HUD_CONFIG.minCrash) candidate = HUD_CONFIG.minCrash;
    if (candidate > HUD_CONFIG.maxCrash) candidate = HUD_CONFIG.maxCrash;

    const value = Math.round(candidate * 100) / 100;
    roundHistory.push(value);

    // keep only last N
    if (roundHistory.length > HUD_CONFIG.historyLength) {
        roundHistory = roundHistory.slice(-HUD_CONFIG.historyLength);
    }

    return value;
}

// Analyse recent rounds for status & momentum
function analyseRounds() {
    const last = roundHistory[roundHistory.length - 1] || 1.0;
    const avg =
        roundHistory.reduce((a, b) => a + b, 0) / roundHistory.length;

    const highCount = roundHistory.filter((v) => v >= 5).length;
    const lowCount = roundHistory.filter((v) => v <= 1.2).length;

    // ---- Status (safety) ----
    let status = "NEUTRAL";
    let statusCaption =
        "Waiting for clearer signals from the last waves.";
    let statusClass = "neutral";

    if (lowCount >= 5 && highCount === 0) {
        status = "DANGEROUS";
        statusCaption =
            "Too many low crashes clustered together. Treat this as a dead / dangerous zone.";
        statusClass = "risky";
    } else if (highCount >= 3 && lowCount <= 3 && avg >= 2.2) {
        status = "FAVORABLE";
        statusCaption =
            "Good mix of helpers and high / ultra waves. This is the kind of structure you want to trade.";
        statusClass = "safe";
    } else if (avg < 1.7) {
        status = "CAUTION";
        statusCaption =
            "Mostly short waves with weak relief. Better to observe than rush entries.";
        statusClass = "caution";
    } else {
        status = "NEUTRAL";
        statusCaption =
            "Structure is mixed. You need more confirmation before trusting any pattern.";
        statusClass = "caution";
    }

    // ---- Momentum ----
    let momentum = "NEUTRAL";
    let momentumCaption = "Momentum is flat – no clear push up or down.";
    let momentumClass = "neutral";

    if (highCount >= 3 && avg >= 3) {
        momentum = "HOT";
        momentumCaption =
            "Market is in a hot phase with frequent higher multipliers.";
        momentumClass = "hot";
    } else if (avg >= 2.2) {
        momentum = "WARM";
        momentumCaption =
            "Helpers are doing their job – decent structure, but not explosive.";
        momentumClass = "warm";
    } else if (lowCount >= 5 && avg < 1.7) {
        momentum = "COLD";
        momentumCaption =
            "Cold zone. Short dumps dominating the wave structure.";
        momentumClass = "cold";
    }

    // ---- Next Multiplier Estimate ----
    let nextEstimate;
    let nextClass = "mid";
    const lastIsUltra = last >= 8;
    const lastIsLow = last <= 1.2;

    if (lastIsUltra) {
        // after big ultra often short or mid
        nextEstimate = randRange(1.1, 2.5);
        nextClass = "low";
    } else if (lastIsLow && avg > 2.0) {
        // relief after several lows
        nextEstimate = randRange(2.0, 5.0);
        nextClass = "mid";
    } else if (highCount >= 3 && avg >= 3) {
        nextEstimate = randRange(3.0, 7.0);
        nextClass = "high";
    } else {
        nextEstimate = randRange(1.1, 3.5);
        nextClass = "mid";
    }

    nextEstimate = Math.round(nextEstimate * 100) / 100;

    return {
        status,
        statusCaption,
        statusClass,
        momentum,
        momentumCaption,
        momentumClass,
        nextEstimate,
        nextClass
    };
}

// Render functions
function renderHistory() {
    const list = document.getElementById("historyList");
    list.innerHTML = "";

    roundHistory
        .slice()
        .reverse()
        .forEach((value, idx) => {
            const li = document.createElement("li");
            li.className = "list-item";

            const indexSpan = document.createElement("span");
            indexSpan.textContent = `-${idx + 1}`;

            const valueSpan = document.createElement("span");
            valueSpan.textContent = `${value.toFixed(2)}x`;

            li.appendChild(indexSpan);
            li.appendChild(valueSpan);
            list.appendChild(li);
        });
}

function renderAnalysis(analysis) {
    const statusTag = document.getElementById("statusTag");
    const statusCaption = document.getElementById("statusCaption");
    const momentumTag = document.getElementById("momentumTag");
    const momentumCaption = document.getElementById("momentumCaption");
    const nextMulti = document.getElementById("nextMulti");

    // Clear previous classes
    statusTag.className = "tag tag-status";
    momentumTag.className = "tag tag-momentum";
    nextMulti.className = "tag tag-next";

    // Apply new classes
    statusTag.classList.add(analysis.statusClass);
    momentumTag.classList.add(analysis.momentumClass);
    nextMulti.classList.add(analysis.nextClass);

    // Set text
    statusTag.textContent = analysis.status;
    statusCaption.textContent = analysis.statusCaption;

    momentumTag.textContent = analysis.momentum;
    momentumCaption.textContent = analysis.momentumCaption;

    nextMulti.textContent = `${analysis.nextEstimate.toFixed(2)}x`;
}

// Main tick – called every interval
function tick() {
    simulateNextRound();
    renderHistory();
    const analysis = analyseRounds();
    renderAnalysis(analysis);
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
    // First render with seed data
    renderHistory();
    const analysis = analyseRounds();
    renderAnalysis(analysis);

    // Then begin simulator loop
    setInterval(tick, HUD_CONFIG.updateIntervalMs);
});
