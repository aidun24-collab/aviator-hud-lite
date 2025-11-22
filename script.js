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
// PATTERN SCANNER v2.0
// (More sensitive, works well with 8–12 rounds)
// ===============================
function runPatternScanner(rounds) {
    const last = rounds.slice(-12); // up to last 12 rounds
    const patterns = [];

    if (last.length < 4) {
        return ["Not enough data for pattern detection (need ≥ 4 rounds)."];
    }

    const avg = average(last);
    const maxV = Math.max(...last);
    const minV = Math.min(...last);

    const highs = last.filter(v => v >= 5);
    const lows = last.filter(v => v < 2);
    const mids = last.filter(v => v >= 2 && v < 5);

    // 🔥 HOT RUN (overall high activity)
    if (highs.length >= 3) {
        patterns.push(`🔥 Hot Run (${highs.length} highs ≥ 5x)`);
    }

    // ❄️ COLD STRETCH (lots of low rounds)
    if (lows.length >= 4) {
        patterns.push(`❄️ Cold Stretch (${lows.length} lows < 2x)`);
    }

    // Last 3 focused streaks
    const last3 = last.slice(-3);
    if (last3.every(v => v >= 5)) {
        patterns.push("🔥🔥 High Streak (last 3 rounds ≥ 5x)");
    }
    if (last3.every(v => v < 2)) {
        patterns.push("🥶 Deep Freeze (last 3 rounds < 2x)");
    }

    // Trend check: compare first 3 vs last 3
    const headAvg = average(last.slice(0, 3));
    const tailAvg = average(last.slice(-3));
    const diff = tailAvg - headAvg;

    if (Math.abs(diff) >= 1.2) {
        if (diff > 0) {
            patterns.push("📈 Trend Rising (recent rounds getting higher)");
        } else {
            patterns.push("📉 Trend Dropping (recent rounds getting lower)");
        }
    }

    // Wave sequences (4-step up or down anywhere in the window)
    for (let i = 0; i + 3 < last.length; i++) {
        const a = last[i];
        const b = last[i + 1];
        const c = last[i + 2];
        const d = last[i + 3];

        if (a < b && b < c && c < d) {
            patterns.push("🌊 Wave Up sequence (4-step climb)");
            break;
        }

        if (a > b && b > c && c > d) {
            patterns.push("🌊 Wave Down sequence (4-step drop)");
            break;
        }
    }

    // ⚡ SPIKE + cool-down
    if (maxV >= 10) {
        patterns.push(`⚡ Spike (${maxV.toFixed(2)}x)`);
        const spikeIndex = last.indexOf(maxV);
        if (spikeIndex >= 0 && spikeIndex < last.length - 1) {
            const afterAvg = average(last.slice(spikeIndex + 1));
            if (afterAvg < maxV / 3) {
                patterns.push("⚡➡️ Spike then cool-down (post-spike calm)");
            }
        }
    }

    // ↗️ Dip → Bounce in the last 4 rounds
    const last4 = last.slice(-4);
    if (last4.length === 4) {
        const localMin = Math.min(...last4);
        const localMax = Math.max(...last4);
        if (localMin < 1.4 && localMax >= 3) {
            patterns.push("↗️ Dip → Bounce (recent low then strong recovery)");
        }
    }

    // If nothing strong detected, classify the structure
    if (patterns.length === 0) {
        if (avg >= 3 && maxV < 8 && lows.length <= 3 && highs.length <= 3) {
            patterns.push("😐 Balanced waves (medium, stable structure)");
        } else if (avg < 2.2 && highs.length === 0) {
            patterns.push("🧊 Sideways cold (mostly low values, no real spikes)");
        } else {
            patterns.push("🔁 Mixed structure (no dominant pattern)");
        }
    }

    return patterns;
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
