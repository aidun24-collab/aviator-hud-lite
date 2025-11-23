//
// ===============================
// 1. BUTTON → FILE PICKER → FILE READER
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

        // 2. Validate CSV
        const check = validateCSV(text);
        if (!check.ok) {
            showError("❌ CSV Error: " + check.msg);
            return;
        }

        // 3. Convert CSV → numbers (using detected separator)
        const values = parseCsv(text, check.separator);

        if (values.length === 0) {
            showError("❌ No valid numbers found in the CSV file.");
            return;
        }

        // 4. Update HUD with parsed values
        updateHUDFromCSV(values);
    };

    reader.readAsText(file);
});


//
// ===============================
// 2. SAFETY CHECKER
// ===============================
function validateCSV(text) {
    const raw = text.trim();

    // 1. Empty file
    if (raw.length === 0) {
        return { ok: false, msg: "CSV is empty." };
    }

    const lines = raw.split("\n");

    // 2. Need header + at least 5 rows
    if (lines.length < 6) {
        return { ok: false, msg: "CSV must contain at least 5 rounds." };
    }

    // detect comma or semicolon
    const header = lines[0];
    const separator = header.includes(";") ? ";" : ",";

    // validate all rows numeric in column 2
    for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(separator);

        if (cols.length < 2) {
            return { ok: false, msg: "A row is missing columns." };
        }

        const value = parseFloat(cols[1]);

        if (isNaN(value)) {
            return {
                ok: false,
                msg: `Row ${i + 1} contains a non-numeric multiplier.`,
            };
        }
    }

    return { ok: true, separator };
}



//
// ===============================
// 3. PARSE CSV → extract numeric multipliers
// ===============================
function parseCsv(text, separator = ",") {
    const lines = text.trim().split("\n");
    let multipliers = [];

    for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(separator);
        const value = parseFloat(cols[1]);
        if (!isNaN(value)) multipliers.push(value);
    }

    return multipliers;
}



//
// ===============================
// 4. UPDATE HUD (History, Market Brain v3.0, Bias, Momentum, Patterns)
// ===============================
function updateHUDFromCSV(rounds) {
    // ---------- LAST 10 HISTORY ----------
    const history = rounds.slice(-10).reverse();
    const historyList = document.getElementById("historyList");
    historyList.innerHTML = "";

    history.forEach((v, i) => {
        const li = document.createElement("li");
        li.className = "list-item";
        li.innerHTML = `<span>-${i + 1}</span><span>${v.toFixed(2)}x</span>`;
        historyList.appendChild(li);
    });

    // ---------- PATTERN SCANNER UI ----------
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

    // ---------- MARKET ANALYSIS v3.0 ----------
    const analysis = analyzeMarketV30(rounds);

    const riskEl = document.getElementById("riskLevel");
    const confEl = document.getElementById("confidenceScore");
    const adviceList = document.getElementById("adviceList");
    const scoredList = document.getElementById("scoredPatternsList");

    if (riskEl) riskEl.textContent = analysis.risk;
    if (confEl) confEl.textContent = analysis.confidence.toFixed(0) + "%";

    if (adviceList) {
        adviceList.innerHTML = "";
        analysis.advice.forEach(a => {
            const li = document.createElement("li");
            li.textContent = a;
            adviceList.appendChild(li);
        });
    }

    if (scoredList) {
        scoredList.innerHTML = "";
        analysis.scoredPatterns.forEach(p => {
            const li = document.createElement("li");
            li.textContent = `${p.pattern} — ${p.confidence}%`;
            scoredList.appendChild(li);
        });
    }

    // ---------- NEXT-BIAS PREDICTION (micro-trend) ----------
    const last = rounds.slice(-6); // last 6 rounds
    let bias = "NEUTRAL";

    if (last.length >= 3) {
        const avg3 = average(last.slice(-3)); // last 3
        const avg6 = average(last);           // last 6

        if (avg3 > avg6) bias = "UPWARD";
        else if (avg3 < avg6) bias = "DOWNWARD";
    }

    const biasEl = document.getElementById("nextBias");
    if (biasEl) biasEl.textContent = bias;

    // ---------- MOMENTUM ----------
    const momentumAvg = average(history);
    const momentumTag = document.getElementById("momentumTag");
    const momentumCaption = document.getElementById("momentumCaption");

    let momentumLabel = "";
    let momentumClass = "";
    let momentumText = "";

    if (momentumAvg >= 5) {
        momentumLabel = "HOT";
        momentumClass = "hot";
        momentumText = "Strong upward momentum.";
    } else if (momentumAvg >= 3) {
        momentumLabel = "WARM";
        momentumClass = "warm";
        momentumText = "Healthy, active waves.";
    } else if (momentumAvg >= 2) {
        momentumLabel = "NEUTRAL";
        momentumClass = "neutral";
        momentumText = "Mixed momentum. Watch carefully.";
    } else {
        momentumLabel = "COLD";
        momentumClass = "cold";
        momentumText = "Market is cold with low multipliers.";
    }

    momentumTag.textContent = momentumLabel;
    momentumCaption.textContent = momentumText;
    momentumTag.className = "tag tag-momentum " + momentumClass;

    // ---------- NEXT MULTIPLIER FORECAST ----------
    const next = parseFloat((momentumAvg * 0.42).toFixed(2));
    const nextTag = document.getElementById("nextMulti");

    nextTag.textContent = next.toFixed(2) + "x";

    let bandClass = "";
    if (next <= 1.5) bandClass = "low";
    else if (next <= 3) bandClass = "mid";
    else bandClass = "high";

    nextTag.className = "tag tag-next " + bandClass;

    // ---------- STATUS TAG ----------
    const statusTag = document.getElementById("statusTag");
    const statusCaption = document.getElementById("statusCaption");

    let statusLabel = "";
    let statusClass = "";
    let statusText = "";

    if (momentumAvg > 6) {
        statusLabel = "FAVORABLE";
        statusClass = "safe";
        statusText = "Good helpers + high waves.";
    } else if (momentumAvg > 2.5) {
        statusLabel = "NEUTRAL";
        statusClass = "caution";
        statusText = "Mixed structure. Trade carefully.";
    } else {
        statusLabel = "WEAK";
        statusClass = "risky";
        statusText = "Cold structure. Avoid big risks.";
    }

    statusTag.textContent = statusLabel;
    statusCaption.textContent = statusText;
    statusTag.className = "tag tag-status " + statusClass;
}



//
// ===============================
// 5. AVERAGE HELPER
// ===============================
function average(arr) {
    if (arr.length === 0) return 0;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
}



//
// ===============================
// 6. PATTERN SCANNER (v2.1 – Advanced)
// ===============================
function runPatternScanner(rounds) {
    const last = rounds.slice(-12);
    const patterns = [];

    if (last.length < 3) {
        return ["Not enough data for pattern detection"];
    }

    const avg = average(last);
    const highCount = last.filter(v => v >= 5).length;
    const lowCount = last.filter(v => v <= 1.5).length;
    const first = last[0];
    const lastVal = last[last.length - 1];

    // TREND + VOLATILITY
    const change = lastVal - first;

    let trendText;
    if (Math.abs(change) < 0.5) trendText = "Sideways / weak trend";
    else if (change >= 2) trendText = "Strong uptrend";
    else if (change >= 0.5) trendText = "Mild uptrend";
    else if (change <= -2) trendText = "Strong downtrend";
    else trendText = "Mild downtrend";

    const variance = last.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / last.length;
    const volatility = Math.sqrt(variance);

    let volText;
    if (volatility < 1) volText = "calm market";
    else if (volatility < 3) volText = "normal volatility";
    else volText = "high volatility";

    patterns.push(`📊 Trend: ${trendText} (${volText})`);

    // HOT & COLD RUNS
    if (highCount >= 3) patterns.push("🔥 Hot Run (3 highs ≥ 5x)");
    else if (highCount >= 2) patterns.push("🔥 Hot Run (2 highs ≥ 5x)");

    if (lowCount >= 5) patterns.push("❄️ Cold Streak (5+ lows ≤ 1.5x)");
    else if (lowCount >= 3) patterns.push("❄️ Cold Streak (3+ lows ≤ 1.5x)");

    // WAVE UP / DOWN (last 4)
    if (last.length >= 4) {
        const seg4 = last.slice(-4);
        if (seg4[0] < seg4[1] && seg4[1] < seg4[2] && seg4[2] < seg4[3])
            patterns.push("📈 Wave Rising (4 increasing)");
        if (seg4[0] > seg4[1] && seg4[1] > seg4[2] && seg4[2] > seg4[3])
            patterns.push("📉 Wave Dropping (4 decreasing)");
    }

    // Rhythm Patterns
    const tagValue = (v) => {
        if (v >= 5) return "H";
        if (v <= 1.5) return "L";
        return "M";
    };

    if (last.length >= 4) {
        const tags4 = last.slice(-4).map(tagValue).join("");
        if (tags4 === "HLHL" || tags4 === "LHLH") {
            patterns.push("🔄 Rhythm: High–Low pattern (HLHL)");
        }
    }

    if (last.length >= 3) {
        const tags3 = last.slice(-3).map(tagValue).join("");
        if (tags3 === "LLH") patterns.push("⚙️ Pressure Build-up (LLH)");
        else if (tags3 === "HHL") patterns.push("🌙 Cooling Phase (HHL)");
    }

    // SPIKE
    const maxV = Math.max(...last);
    if (maxV >= 10) {
        patterns.push(`⚡ Spike Detected (${maxV.toFixed(2)}x)`);
    }

    // DIP → BOUNCE
    if (last.length >= 3 && last[0] <= 1.4 && last[1] <= 1.4 && last[2] >= 3) {
        patterns.push("↗️ Dip → Bounce (low → recovery)");
    }

    return patterns;
}



//
// ===============================
// 7. Market Analysis Engine v3.0  (DATA ONLY)
// ===============================
function analyzeMarketV30(rounds) {
    const last = rounds.slice(-12); // last 12 rounds

    if (last.length < 3) {
        return {
            risk: "Unknown",
            confidence: 0,
            advice: ["Not enough data"],
            scoredPatterns: []
        };
    }

    const avg = average(last);

    // 1. VOLATILITY (standard deviation)
    const variance = last.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / last.length;
    const volatility = Math.sqrt(variance);

    // Risk scoring
    let risk = "";
    if (volatility < 1) risk = "🟢 Low Risk";
    else if (volatility < 3) risk = "🟡 Medium Risk";
    else risk = "🔴 High Risk";

    // 2. PATTERN SCANNER (reuse v2.1)
    const rawPatterns = runPatternScanner(rounds);

    // 3. Pattern Scoring 2.0
    const scoredPatterns = rawPatterns.map(p => {
        let score = 50;

        if (p.includes("Hot Run")) score += 20;
        if (p.includes("Wave Rising")) score += 15;
        if (p.includes("Spike")) score += 10;

        if (p.includes("Cold")) score -= 20;
        if (p.includes("Wave Dropping")) score -= 15;

        if (volatility < 1) score += 10;
        if (volatility > 3) score -= 10;

        score = Math.max(5, Math.min(95, score));
        return { pattern: p, confidence: score };
    });

    // 4. Confidence Formula v3.0
    let confidence =
        (avg * 6 + (4 - volatility) * 12 + scoredPatterns.length * 4) / 3;
    confidence = Math.max(5, Math.min(95, confidence));

    // 5. AI Smart Advice v3.0
    let advice = [];

    if (volatility > 3) advice.push("Market unstable — expect swings.");
    if (avg > 4) advice.push("High-wave bias detected.");
    if (avg < 2) advice.push("Low-wave structure — avoid big risks.");

    if (last[last.length - 1] <= 1.5)
        advice.push("Recent dip → bounce probability rising.");

    if (rawPatterns.some(p => p.includes("Spike")))
        advice.push("Spike occurred — market usually cools down next rounds.");

    if (advice.length === 0) advice.push("Stable structure detected.");

    return {
        risk,
        confidence,
        advice,
        scoredPatterns
    };
}



//
// ===============================
// 8. ERROR BAR HANDLER
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
// 9. TEMPLATE CSV DOWNLOAD
// ===============================
document.getElementById("downloadTemplateBtn").addEventListener("click", () => {
    const csvContent =
        "Round,Multiplier\n" +
        "1,2.5\n" +
        "2,3.1\n" +
        "3,1.8\n" +
        "4,4.2\n" +
        "5,2.9\n";

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "aviator_template.csv";
    a.click();

    URL.revokeObjectURL(url);
});



//
// ===============================
// 10. FILE PICKER — SHOW SELECTED FILE NAME
// ===============================
const csvInput = document.getElementById("csvFile");
const fileLabel = document.querySelector(".fileLabel");

if (csvInput && fileLabel) {
    csvInput.addEventListener("change", () => {
        if (csvInput.files.length > 0) {
            fileLabel.textContent = "📄 " + csvInput.files[0].name;
        } else {
            fileLabel.textContent = "📁 Choose CSV File";
        }
    });
}



//
// ===============================
// 11. Long-Press Tooltip Support (Mobile)
// ===============================
document.querySelectorAll(".tooltip-wrap").forEach(wrap => {
    let pressTimer;
    const tooltip = wrap.querySelector(".tooltip");

    if (!tooltip) return;

    wrap.addEventListener("touchstart", () => {
        pressTimer = setTimeout(() => {
            tooltip.classList.add("no-hover");
            tooltip.style.opacity = "1";
            tooltip.style.transform = "translateX(-50%) translateY(-6px)";
            tooltip.style.animation = "tooltipPop 0.25s ease forwards";

            setTimeout(() => {
                tooltip.style.opacity = "0";
                tooltip.style.transform = "translateX(-50%) translateY(0)";
                tooltip.classList.remove("no-hover");
            }, 2500);
        }, 450);
    });

    wrap.addEventListener("touchend", () => {
        clearTimeout(pressTimer);
    });

    wrap.addEventListener("touchmove", () => {
        clearTimeout(pressTimer);
    });
});
