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
        if (!isNaN(value)) multipliers.push(value);
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
const next = (avg * 0.42).toFixed(2);
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
// ===============================
// FILE PICKER — SHOW SELECTED FILE NAME
// ===============================
const csvInput = document.getElementById("csvFile");
const fileLabel = document.querySelector(".fileLabel");

csvInput.addEventListener("change", () => {
    if (csvInput.files.length > 0) {
        fileLabel.textContent = "📄 " + csvInput.files[0].name;
    } else {
        fileLabel.textContent = "Choose CSV";
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
