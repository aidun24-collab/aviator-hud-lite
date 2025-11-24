//
// ===============================
// 1. CSV FILE → LOAD + VALIDATE + PARSE
// ===============================
document.getElementById("loadCsvBtn").addEventListener("click", () => {
    const fileInput = document.getElementById("csvFile");
    const file = fileInput.files[0];

    if (!file) {
        showError("❌ Please choose a CSV file.");
        return;
    }

    const reader = new FileReader();

    reader.onload = function (event) {
        const text = event.target.result;

        // Validate CSV
        const check = validateCSV(text);
        if (!check.ok) {
            showError("❌ CSV Error: " + check.msg);
            return;
        }

        // Parse CSV → numbers
        const values = parseCsv(text, check.separator);

        if (values.length === 0) {
            showError("❌ No valid numbers found in CSV.");
            return;
        }

        updateHUD(values);
    };

    reader.readAsText(file);
});


//
// ===============================
// 2. CSV SAFETY CHECKER
// ===============================
function validateCSV(text) {
    const raw = text.trim();

    if (raw.length === 0) {
        return { ok: false, msg: "CSV is empty." };
    }

    const lines = raw.split("\n");
    if (lines.length < 6) {
        return { ok: false, msg: "CSV must contain at least 5 rounds." };
    }

    const header = lines[0];
    const separator = header.includes(";") ? ";" : ",";

    for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(separator);

        if (cols.length < 2) {
            return { ok: false, msg: "A row is missing data." };
        }

        const value = parseFloat(cols[1]);
        if (isNaN(value)) {
            return { ok: false, msg: `Row ${i + 1} has invalid multiplier.` };
        }
    }

    return { ok: true, separator };
}


//
// ===============================
// 3. PARSE CSV
// ===============================
function parseCsv(text, separator = ",") {
    const lines = text.trim().split("\n");
    let multipliers = [];

    for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(separator);
        const v = parseFloat(cols[1]);
        if (!isNaN(v)) multipliers.push(v);
    }

    return multipliers;
}


// ===============================
// 4. LIVE PASTE MODE
// ===============================
function parseLiveRounds(text) {
    if (!text) return [];

    return text
        .split(/\r?\n/)
        .map(v => parseFloat(v.trim()))
        .filter(v => !isNaN(v));
}

const applyLiveBtn = document.getElementById("applyLiveBtn");
const liveInput = document.getElementById("liveInput");

if (applyLiveBtn) {
    applyLiveBtn.addEventListener("click", () => {
        const raw = liveInput.value.trim();
        if (!raw) {
            showError("Paste live rounds first.");
            return;
        }

        const rounds = parseLiveRounds(raw);

        if (rounds.length < 5) {
            showError("Need at least 5 valid rounds.");
            return;
        }

        updateHUD(rounds);

        applyLiveBtn.textContent = "Applied ✔";
        setTimeout(() => applyLiveBtn.textContent = "Apply Live Rounds", 1500);
    });
}


//
// ===============================
// 5. UPDATE HUD (Unified engine)
// ===============================
function updateHUD(rounds) {

    // ---- HISTORY (Last 10) ----
    const history = rounds.slice(-10).reverse();
    const historyList = document.getElementById("historyList");
    historyList.innerHTML = "";

    history.forEach((v, i) => {
        const li = document.createElement("li");
        li.className = "list-item";
        li.innerHTML = `<span>-${i + 1}</span><span>${v.toFixed(2)}x</span>`;
        historyList.appendChild(li);
    });

    // ---- PATTERN SCANNER ----
    const patterns = runPatternScanner(rounds);
    const patternList = document.getElementById("patternList");
    patternList.innerHTML = "";

    patterns.forEach(p => {
        const li = document.createElement("li");
        li.className = "pattern-item";
        li.innerHTML = `
            <span class="pattern-icon">${p.split(" ")[0]}</span>
            <span class="pattern-text">${p.substring(p.indexOf(" ") + 1)}</span>
        `;
        patternList.appendChild(li);
    });

    // ---- MARKET ANALYSIS ----
    const analysis = analyzeMarketV30(rounds);

    document.getElementById("riskLevel").textContent = analysis.risk;
    document.getElementById("confidenceScore").textContent = analysis.confidence + "%";

    const adviceList = document.getElementById("adviceList");
    adviceList.innerHTML = "";
    analysis.advice.forEach(a => {
        const li = document.createElement("li");
        li.textContent = a;
        adviceList.appendChild(li);
    });

    const scoreList = document.getElementById("scoredPatternsList");
    scoreList.innerHTML = "";
    analysis.scoredPatterns.forEach(p => {
        const li = document.createElement("li");
        li.textContent = `${p.pattern} — ${p.confidence}%`;
        scoreList.appendChild(li);
    });

    // ---- NEXT-BIAS ----
    const last = rounds.slice(-6);
    let bias = "NEUTRAL";

    if (last.length >= 3) {
        const avg3 = average(last.slice(-3));
        const avg6 = average(last);

        if (avg3 > avg6) bias = "UPWARD";
        else if (avg3 < avg6) bias = "DOWNWARD";
    }

    document.getElementById("nextBias").textContent = bias;

    // ---- MOMENTUM ----
    const momentumAvg = average(history);
    const tag = document.getElementById("momentumTag");
    const caption = document.getElementById("momentumCaption");

    let mLabel, mClass, mText;

    if (momentumAvg >= 5) {
        mLabel = "HOT"; mClass = "hot"; mText = "Strong upward momentum.";
    } else if (momentumAvg >= 3) {
        mLabel = "WARM"; mClass = "warm"; mText = "Healthy active waves.";
    } else if (momentumAvg >= 2) {
        mLabel = "NEUTRAL"; mClass = "neutral"; mText = "Mixed momentum.";
    } else {
        mLabel = "COLD"; mClass = "cold"; mText = "Cold market structure.";
    }

    tag.textContent = mLabel;
    caption.textContent = mText;
    tag.className = "tag tag-momentum " + mClass;

    // ---- NEXT MULTIPLIER ----
    const next = parseFloat((momentumAvg * 0.42).toFixed(2));
    const nextTag = document.getElementById("nextMulti");

    let band = next <= 1.5 ? "low" : next <= 3 ? "mid" : "high";

    nextTag.textContent = next.toFixed(2) + "x";
    nextTag.className = "tag tag-next " + band;

    // ---- STATUS TAG ----
    const status = document.getElementById("statusTag");
    const statusCap = document.getElementById("statusCaption");

    if (momentumAvg > 6) {
        status.textContent = "FAVORABLE";
        statusCap.textContent = "Good helpers + high waves.";
        status.className = "tag tag-status safe";
    } else if (momentumAvg > 2.5) {
        status.textContent = "NEUTRAL";
        statusCap.textContent = "Mixed structure. Trade carefully.";
        status.className = "tag tag-status caution";
    } else {
        status.textContent = "WEAK";
        statusCap.textContent = "Cold structure. Avoid big risks.";
        status.className = "tag tag-status risky";
    }
}


//
// ===============================
// 6. AVERAGE HELPER
// ===============================
function average(arr) {
    return arr.length === 0 ? 0 : arr.reduce((a, b) => a + b, 0) / arr.length;
}


//
// ===============================
// 7. PATTERN SCANNER
// ===============================
function runPatternScanner(rounds) {
    const last = rounds.slice(-12);
    const patterns = [];

    if (last.length < 3) return ["Not enough data"];

    const avg = average(last);
    const high = last.filter(v => v >= 5).length;
    const low = last.filter(v => v <= 1.5).length;
    const first = last[0];
    const lastVal = last[last.length - 1];

    // TREND DETECTION
    const change = lastVal - first;
    let trend;

    if (Math.abs(change) < 0.5) trend = "Sideways / weak trend";
    else if (change >= 2) trend = "Strong uptrend";
    else if (change >= 0.5) trend = "Mild uptrend";
    else if (change <= -2) trend = "Strong downtrend";
    else trend = "Mild downtrend";

    // VOLATILITY
    const variance = last.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / last.length;
    const vol = Math.sqrt(variance);

    let volText = vol < 1 ? "calm market"
                : vol < 3 ? "normal volatility"
                : "high volatility";

    patterns.push(`📊 Trend: ${trend} (${volText})`);

    // HOT & COLD RUNS
    if (high >= 3) patterns.push("🔥 Hot Run (3 highs ≥ 5x)");
    else if (high >= 2) patterns.push("🔥 Hot Run (2 highs ≥ 5x)");

    if (low >= 5) patterns.push("❄️ Cold Streak (5+ lows ≤ 1.5x)");
    else if (low >= 3) patterns.push("❄️ Cold Streak (3+ lows ≤ 1.5x)");

    // WAVE UP / DOWN
    if (last.length >= 4) {
        const seg4 = last.slice(-4);
        if (seg4[0] < seg4[1] && seg4[1] < seg4[2] && seg4[2] < seg4[3])
            patterns.push("📈 Wave Rising (4 increasing)");
        if (seg4[0] > seg4[1] && seg4[1] > seg4[2] && seg4[2] > seg4[3])
            patterns.push("📉 Wave Dropping (4 decreasing)");
    }

    // RHYTHM
    const tag = v => v >= 5 ? "H" : v <= 1.5 ? "L" : "M";

    if (last.length >= 4) {
        const t = last.slice(-4).map(tag).join("");
        if (t === "HLHL" || t === "LHLH")
            patterns.push("🔄 Rhythm: High–Low pattern (HLHL)");
    }

    // SPIKE
    const maxV = Math.max(...last);
    if (maxV >= 10) patterns.push(`⚡ Spike Detected (${maxV.toFixed(2)}x)`);

    return patterns;
}


//
// ===============================
// 8. MARKET ANALYSIS v3.0
// ===============================
function analyzeMarketV30(rounds) {
    const last = rounds.slice(-12);
    if (last.length < 3) {
        return {
            risk: "Unknown",
            confidence: 0,
            advice: ["Not enough data"],
            scoredPatterns: []
        };
    }

    const avg = average(last);

    // VOLATILITY
    const variance = last.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / last.length;
    const vol = Math.sqrt(variance);

    // RISK
    let risk = vol < 1 ? "🟢 Low Risk"
            : vol < 3 ? "🟡 Medium Risk"
            : "🔴 High Risk";

    // RAW PATTERNS
    const raw = runPatternScanner(rounds);

    // SCORING
    const scored = raw.map(p => {
        let score = 50;

        if (p.includes("Hot Run")) score += 20;
        if (p.includes("Wave Rising")) score += 15;
        if (p.includes("Spike")) score += 10;

        if (p.includes("Cold")) score -= 20;
        if (p.includes("Wave Dropping")) score -= 15;

        if (vol < 1) score += 10;
        if (vol > 3) score -= 10;

        score = Math.max(5, Math.min(95, score));

        return { pattern: p, confidence: score };
    });

    // CONFIDENCE
    let confidence = (avg * 6 + (4 - vol) * 12 + scored.length * 4) / 3;
    confidence = Math.max(5, Math.min(95, confidence));

    // ADVICE
    let advice = [];

    if (vol > 3) advice.push("Market unstable — expect swings.");
    if (avg > 4) advice.push("High-wave bias detected.");
    if (avg < 2) advice.push("Low-wave structure — avoid big risks.");

    if (last[last.length - 1] <= 1.5) advice.push("Recent dip → bounce probability rising.");

    if (raw.some(p => p.includes("Spike")))
        advice.push("Spike occurred — market usually cools down next rounds.");

    if (advice.length === 0) advice.push("Stable structure detected.");

    return { risk, confidence, advice, scoredPatterns: scored };
}


//
// ===============================
// 9. ERROR BAR
// ===============================
function showError(msg) {
    const bar = document.getElementById("errorBar");
    const text = document.getElementById("errorText");

    text.textContent = msg;

    bar.classList.remove("hidden");
    bar.classList.add("show");

    setTimeout(() => {
        bar.classList.remove("show");
        bar.classList.add("hidden");
    }, 3000);
}


//
// ===============================
// 10. TEMPLATE CSV DOWNLOAD
// ===============================
document.getElementById("downloadTemplateBtn").addEventListener("click", () => {
    const csv =
        "Round,Multiplier\n" +
        "1,2.5\n" +
        "2,3.1\n" +
        "3,1.8\n" +
        "4,4.2\n" +
        "5,2.9\n";

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "aviator_template.csv";
    a.click();

    URL.revokeObjectURL(url);
});


//
// ===============================
// 11. FILE PICKER — SHOW SELECTED NAME
// ===============================
const csvInput = document.getElementById("csvFile");
const fileLabel = document.querySelector(".fileLabel");

if (csvInput && fileLabel) {
    csvInput.addEventListener("change", () => {
        fileLabel.textContent =
            csvInput.files.length > 0
                ? "📄 " + csvInput.files[0].name
                : "📁 Choose CSV File";
    });
}


//
// ===============================
// 12. MOBILE TOOLTIP SUPPORT
// ===============================
document.querySelectorAll(".tooltip-wrap").forEach(wrap => {
    let timer;
    const tooltip = wrap.querySelector(".tooltip");
    if (!tooltip) return;

    wrap.addEventListener("touchstart", () => {
        timer = setTimeout(() => {
            tooltip.classList.add("no-hover");
            tooltip.style.opacity = "1";
            tooltip.style.transform = "translateX(-50%) translateY(-6px)";
            tooltip.style.animation = "tooltipPop 0.25s ease forwards";

            setTimeout(() => {
                tooltip.style.opacity = "0";
                tooltip.style.transform = "translateY(0)";
                tooltip.classList.remove("no-hover");
            }, 2500);
        }, 450);
    });

    wrap.addEventListener("touchend", () => clearTimeout(timer));
    wrap.addEventListener("touchmove", () => clearTimeout(timer));
});
