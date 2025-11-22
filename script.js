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
// 4. UPDATE HUD (History, Momentum, Next Multiplier, Status, Patterns)
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

    // ---------- MOMENTUM ----------
    const avg = average(history);
    const momentumTag = document.getElementById("momentumTag");
    const momentumCaption = document.getElementById("momentumCaption");

    let momentumLabel = "";
    let momentumClass = "";
    let momentumText = "";

    if (avg >= 5) {
        momentumLabel = "HOT";
        momentumClass = "hot";
        momentumText = "Strong upward momentum.";
    } else if (avg >= 3) {
        momentumLabel = "WARM";
        momentumClass = "warm";
        momentumText = "Healthy, active waves.";
    } else if (avg >= 2) {
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
    const next = parseFloat((avg * 0.42).toFixed(2));
    const nextTag = document.getElementById("nextMulti");

    nextTag.textContent = next.toFixed(2) + "x";

    // Remove old classes and apply new color band
    let bandClass = "";
    if (next <= 1.5) {
        bandClass = "low";
    } else if (next <= 3) {
        bandClass = "mid";
    } else {
        bandClass = "high";
    }
    nextTag.className = "tag tag-next " + bandClass;

    // ---------- STATUS TAG ----------
    const statusTag = document.getElementById("statusTag");
    const statusCaption = document.getElementById("statusCaption");

    let statusLabel = "";
    let statusClass = "";
    let statusText = "";

    if (avg > 6) {
        statusLabel = "FAVORABLE";
        statusClass = "safe";
        statusText = "Good helpers + high waves.";
    } else if (avg > 2.5) {
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

    // ---------- PATTERN SCANNER v2.1 ----------
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
// 6. PATTERN SCANNER (v2.1 – Advanced)
// ===============================
function runPatternScanner(rounds) {
    const last = rounds.slice(-12);
    const patterns = [];

    if (last.length < 3) {
        return ["Not enough data for pattern detection"];
    }

    // Basic stats
    const avg = average(last);
    const highCount = last.filter(v => v >= 5).length;
    const lowCount = last.filter(v => v <= 1.5).length;
    const first = last[0];
    const lastVal = last[last.length - 1];

    // ================================
    // TREND + VOLATILITY
    // ================================
    const change = lastVal - first;

    let trendText;
    if (Math.abs(change) < 0.5) trendText = "Sideways / weak trend";
    else if (change >= 2) trendText = "Strong uptrend";
    else if (change >= 0.5) trendText = "Mild uptrend";
    else if (change <= -2) trendText = "Strong downtrend";
    else trendText = "Mild downtrend";

    // Volatility (std dev)
    const mean = avg;
    const variance = last.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / last.length;
    const volatility = Math.sqrt(variance);

    let volText;
    if (volatility < 1) volText = "calm market";
    else if (volatility < 3) volText = "normal volatility";
    else volText = "high volatility";

    patterns.push(`📊 Trend: ${trendText} (${volText})`);

    // ================================
    // HOT & COLD RUNS
    // ================================
    if (highCount >= 3) patterns.push("🔥 Hot Run (3 highs ≥ 5x)");
    else if (highCount >= 2) patterns.push("🔥 Hot Run (2 highs ≥ 5x)");

    if (lowCount >= 5) patterns.push("❄️ Cold Streak (5+ lows ≤ 1.5x)");
    else if (lowCount >= 3) patterns.push("❄️ Cold Streak (3+ lows ≤ 1.5x)");

    // ================================
    // WAVE UP / DOWN (last 4)
    // ================================
    if (last.length >= 4) {
        const seg4 = last.slice(-4);
        if (seg4[0] < seg4[1] && seg4[1] < seg4[2] && seg4[2] < seg4[3])
            patterns.push("📈 Wave Rising (4 increasing)");
        if (seg4[0] > seg4[1] && seg4[1] > seg4[2] && seg4[2] > seg4[3])
            patterns.push("📉 Wave Dropping (4 decreasing)");
    }

    // ================================
    // Rhythm Patterns (H/M/L tagging)
    // ================================
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

    // ================================
    // SPIKE
    // ================================
    const maxV = Math.max(...last);
    if (maxV >= 10) {
        patterns.push(`⚡ Spike Detected (${maxV.toFixed(2)}x)`);
    }

    // ================================
    // DIP → BOUNCE
    // ================================
    if (last.length >= 3 && last[0] <= 1.4 && last[1] <= 1.4 && last[2] >= 3) {
        patterns.push("↗️ Dip → Bounce (low → recovery)");
    }

    return patterns;
}



//
// ===============================
// 7. ERROR BAR HANDLER (Option D)
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
// 8. TEMPLATE CSV DOWNLOAD (Option C)
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
// 9. FILE PICKER — SHOW SELECTED FILE NAME
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
// 10. Long-Press Tooltip Support (Mobile)
// ===============================
document.querySelectorAll(".tooltip-wrap").forEach(wrap => {
    let pressTimer;
    const tooltip = wrap.querySelector(".tooltip");

    if (!tooltip) return;

    // Long-press start
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

    // Cancel if finger lifted or moved
    wrap.addEventListener("touchend", () => {
        clearTimeout(pressTimer);
    });

    wrap.addEventListener("touchmove", () => {
        clearTimeout(pressTimer);
    });
});
