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

        // 4. Update HUD
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

    // validate all rows numeric
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
        if (!isNaN(value)) {
            multipliers.push(value);
        }
    }

    return multipliers;
}


//
// ===============================
// 4. UPDATE HUD
// ===============================
function updateHUDFromCSV(rounds) {
    // LAST 10 HISTORY
    const history = rounds.slice(-10).reverse();
    const historyList = document.getElementById("historyList");
    historyList.innerHTML = "";

    history.forEach((v, i) => {
        const li = document.createElement("li");
        li.className = "list-item";
        li.innerHTML = `<span>-${i + 1}</span><span>${v.toFixed(2)}x</span>`;
        historyList.appendChild(li);
    });

    // MOMENTUM (avg of last 10)
    const avg = average(history);
    const momentumTag = document.getElementById("momentumTag");
    const momentumCaption = document.getElementById("momentumCaption");

    if (avg > 5) {
        momentumTag.textContent = "HOT";
        momentumCaption.textContent = "Strong upward momentum.";
    } else if (avg > 2) {
        momentumTag.textContent = "DECENT";
        momentumCaption.textContent = "Moderate, stable waves.";
    } else {
        momentumTag.textContent = "LOW";
        momentumCaption.textContent = "Market is cold with low multipliers.";
    }

    // NEXT MULTIPLIER FORECAST
    const next = parseFloat((avg * 0.42).toFixed(2));
    const nextTag = document.getElementById("nextMulti");

    nextTag.textContent = next + "x";

    // Remove old classes
    nextTag.classList.remove("low", "mid", "high");

    // Apply color logic
    if (next <= 1.5) {
        nextTag.classList.add("low");
    } else if (next <= 3) {
        nextTag.classList.add("mid");
    } else {
        nextTag.classList.add("high");
    }

    // STATUS TAG
    const statusTag = document.getElementById("statusTag");
    const statusCaption = document.getElementById("statusCaption");

    if (avg > 6) {
        statusTag.textContent = "FAVORABLE";
        statusCaption.textContent = "Good helpers + high waves.";
    } else if (avg > 2.5) {
        statusTag.textContent = "NEUTRAL";
        statusCaption.textContent = "Mixed structure. Trade carefully.";
    } else {
        statusTag.textContent = "WEAK";
        statusCaption.textContent = "Cold structure. Avoid big risks.";
    }

    // PATTERN SCANNER (uses v2.0 logic below)
    const patterns = runPatternScanner(rounds);
    const patternList = document.getElementById("patternList");
    patternList.innerHTML = "";

    patterns.forEach(p => {
        const li = document.createElement("li");
        li.className = "list-item";
        li.innerHTML = `<span>${p}</span>`;
        patternList.appendChild(li);
    });
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
// PATTERN SCANNER (v2.1 – Advanced)
// ===============================
function runPatternScanner(rounds) {
    const last = rounds.slice(-12);   // Look at last 12 (or fewer)
    const patterns = [];

    // Need at least a few rounds
    if (last.length < 3) {
        return ["Not enough data for pattern detection"];
    }

    // Basic stats
    const avg = average(last);
    const highCount = last.filter(v => v >= 5).length;
    const lowCount  = last.filter(v => v <= 1.5).length;

    const first = last[0];
    const lastVal = last[last.length - 1];

    // ===== TREND + VOLATILITY METER =====
    const change = lastVal - first;

    let trendText;
    if (Math.abs(change) < 0.5) {
        trendText = "Sideways / weak trend";
    } else if (change >= 2) {
        trendText = "Strong uptrend";
    } else if (change >= 0.5) {
        trendText = "Mild uptrend";
    } else if (change <= -2) {
        trendText = "Strong downtrend";
    } else {
        trendText = "Mild downtrend";
    }

    // Volatility (standard deviation)
    const mean = avg;
    const variance = last.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / last.length;
    const volatility = Math.sqrt(variance);

    let volText;
    if (volatility < 1) {
        volText = "calm market";
    } else if (volatility < 3) {
        volText = "normal volatility";
    } else {
        volText = "high volatility";
    }

    patterns.push(`📊 Trend: ${trendText} (${volText})`);

    // ===== HOT & COLD RUNS =====
    if (highCount >= 3) {
        patterns.push("🔥 Hot Run (3 highs ≥ 5x)");
    } else if (highCount >= 2) {
        patterns.push("🔥 Hot Run (2 highs ≥ 5x)");
    }

    if (lowCount >= 5) {
        patterns.push("❄️ Cold Streak (5+ lows ≤ 1.5x)");
    } else if (lowCount >= 3) {
        patterns.push("❄️ Cold Streak (3+ lows ≤ 1.5x)");
    }

    // ===== WAVE UP / DOWN (recent 4 rounds) =====
    if (last.length >= 4) {
        const seg4 = last.slice(-4);

        if (seg4[0] < seg4[1] && seg4[1] < seg4[2] && seg4[2] < seg4[3]) {
            patterns.push("📈 Wave Rising (recent rounds stepping up)");
        }

        if (seg4[0] > seg4[1] && seg4[1] > seg4[2] && seg4[2] > seg4[3]) {
            patterns.push("📉 Wave Dropping (recent rounds stepping down)");
        }
    }

    // Helper to tag values as H / M / L
    const tagValue = (v) => {
        if (v >= 5) return "H";       // High
        if (v <= 1.5) return "L";     // Low
        return "M";                   // Mid
    };

    // ===== RHYTHM PATTERNS (HLHL, LLH, HHL) =====
    if (last.length >= 4) {
        const tags4 = last.slice(-4).map(tagValue).join("");

        // High–Low–High–Low flip pattern
        if (tags4 === "HLHL" || tags4 === "LHLH") {
            patterns.push("↕️ Rhythm: High–Low–High–Low (flip pattern)");
        }
    }

    if (last.length >= 3) {
        const tags3 = last.slice(-3).map(tagValue).join("");

        if (tags3 === "LLH") {
            patterns.push("⚙️ Pressure Build-up (lows then breakout high)");
        } else if (tags3 === "HHL") {
            patterns.push("🌙 Cooling Phase (highs then fading)");
        }
    }

    // ===== PRESSURE BUILD-UP (many lows then mids) =====
    if (last.length >= 5) {
        const recent5 = last.slice(-5);
        const recentLows = recent5.filter(v => v <= 1.5).length;
        const recentMids = recent5.filter(v => v > 1.5 && v <= 3.5).length;

        if (recentLows >= 3 && recentMids >= 1) {
            patterns.push("⚙️ Pressure Build-up (many lows then mid waves)");
        }
    }

    // ===== SPIKE + COOLING PHASE =====
    const maxV = Math.max(...last);
    const maxIndex = last.indexOf(maxV);

    if (maxV >= 10) {
        patterns.push(`⚡ Spike Detected (${maxV.toFixed(2)}x)`);

        const afterSpike = last.slice(maxIndex + 1);
        if (
            afterSpike.length >= 2 &&
            afterSpike.every(v => v >= 1 && v <= 2.5)
        ) {
            patterns.push("🌙 Spike then cool-down (post-spike calm)");
        }
    }

    // ===== DIP → BOUNCE (low → low → high) =====
    if (last.length >= 3) {
        const a = last[last.length - 3];
        const b = last[last.length - 2];
        const c = last[last.length - 1];

        if (a <= 1.4 && b <= 1.4 && c >= 2.5) {
            patterns.push("↗️ Dip → Bounce (recent low then strong recovery)");
        }
    }

    return patterns.length > 0 ? patterns : ["No major pattern detected"];
}


//
// ===============================
// 6. ERROR BAR HANDLER (Option D)
// ===============================
function showError(msg) {
    const bar = document.getElementById("errorBar");
    const text = document.getElementById("errorText");

    text.textContent = msg;

    bar.classList.remove("hidden");
    bar.classList.add("show");

    // Auto-hide after 3 seconds
    setTimeout(() => {
        bar.classList.remove("show");
        bar.classList.add("hidden");
    }, 3000);
}


//
// ===============================
// OPTION C — TEMPLATE CSV DOWNLOAD
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
// FILE PICKER — SHOW SELECTED FILE NAME
// ===============================
const csvInput = document.getElementById("csvFile");
const fileLabel = document.querySelector(".fileLabel");

csvInput.addEventListener("change", () => {
    if (csvInput.files.length > 0) {
        fileLabel.textContent = "📄 " + csvInput.files[0].name;
    } else {
        fileLabel.textContent = "Choose CSV File";
    }
});


/* =========================================
   Long-Press Tooltip Support (Mobile)
   ========================================= */
document.querySelectorAll(".tooltip-wrap").forEach(wrap => {
    let pressTimer;

    const tooltip = wrap.querySelector(".tooltip");

    // ----- Start pressing -----
    wrap.addEventListener("touchstart", () => {
        pressTimer = setTimeout(() => {
            // Show tooltip
            tooltip.classList.add("no-hover");  // Prevent hover animation conflict
            tooltip.style.opacity = "1";
            tooltip.style.transform = "translateX(-50%) translateY(-6px)";
            tooltip.style.animation = "tooltipPop 0.25s ease forwards";

            // Auto-hide after 2.5s
            setTimeout(() => {
                tooltip.style.opacity = "0";
                tooltip.style.transform = "translateX(-50%) translateY(0)";
                tooltip.classList.remove("no-hover"); // Restore hover when hidden
            }, 2500);

        }, 450); // user must hold for 450ms
    });

    // ----- Cancel press if finger lifts early -----
    wrap.addEventListener("touchend", () => {
        clearTimeout(pressTimer);
    });

    wrap.addEventListener("touchmove", () => {
        clearTimeout(pressTimer);
    });
});
