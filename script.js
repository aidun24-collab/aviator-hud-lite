//
// ===============================
// 1. BUTTON → FILE PICKER → FILE READER
// ===============================
document.getElementById("loadCsvBtn").addEventListener("click", () => {
    const fileInput = document.getElementById("csvFile");
    const file = fileInput.files[0];

    if (!file) {
        alert("Please choose a CSV file.");
        return;
    }

    const reader = new FileReader();

    reader.onload = function (event) {
        const text = event.target.result;

        // 2. Validate CSV
        const check = validateCSV(text);
        if (!check.ok) {
            alert("❌ CSV Error: " + check.msg);
            return;
        }

        // 3. Convert CSV → numbers (using detected separator)
        const values = parseCsv(text, check.separator);

        if (values.length === 0) {
            alert("❌ No valid numbers found in CSV.");
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
    document.getElementById("nextMulti").textContent = next + "x";

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
