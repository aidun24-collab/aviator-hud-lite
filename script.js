// CSV FILE READER
document.getElementById("loadCsvBtn").addEventListener("click", () => {
    const file = document.getElementById("csvFile").files[0];
    if (!file) {
        alert("Please choose a CSV file.");
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        const text = e.target.result;
        const rounds = parseCsv(text);
        updateHUD(rounds);
    };
    reader.readAsText(file);
});

// PARSE CSV → extract multipliers
function parseCsv(text) {
    const lines = text.trim().split("\n");
    let multipliers = [];

    for (let i = 1; i < lines.length; i++) {
        let cols = lines[i].split(",");
        let value = parseFloat(cols[1]);
        if (!isNaN(value)) multipliers.push(value);
    }

    return multipliers;
}

// -----------------------------
// CSV IMPORT ENGINE
// -----------------------------
document.getElementById("loadCsvBtn").addEventListener("click", () => {
    const fileInput = document.getElementById("csvFile");
    const file = fileInput.files[0];

    if (!file) {
        alert("Please choose a CSV file first.");
        return;
    }

    const reader = new FileReader();

    reader.onload = function (event) {
        const text = event.target.result;

        // Convert CSV to array of numbers
        const lines = text.trim().split("\n");
        const values = lines.map(line => parseFloat(line.replace(",", "."))).filter(n => !isNaN(n));

        if (values.length === 0) {
            alert("CSV format invalid. Ensure each line contains only a number.");
            return;
        }

        // Update HUD using parsed CSV numbers
        updateHUDFromCSV(values);
    };

    reader.readAsText(file);
});

// -----------------------------
// ANALYSIS FROM CSV DATA
// -----------------------------
function updateHUDFromCSV(rounds) {
    // HISTORY PANEL
    const history = rounds.slice(-10).reverse();
    const historyList = document.getElementById("historyList");
    historyList.innerHTML = "";

    history.forEach((v, i) => {
        const item = document.createElement("li");
        item.className = "list-item";
        item.innerHTML = `<span>-${i + 1}</span><span>${v.toFixed(2)}x</span>`;
        historyList.appendChild(item);
    });

    // MOMENTUM
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

    // NEXT MULTIPLIER (simple forecast)
    const next = (avg * 0.42).toFixed(2);
    document.getElementById("nextMulti").textContent = next + "x";

    // STATUS
    const statusTag = document.getElementById("statusTag");
    const statusCaption = document.getElementById("statusCaption");

    if (avg > 6) {
        statusTag.textContent = "FAVORABLE";
        statusCaption.textContent = "Good helpers + high waves.";
    } else if (avg > 2.5) {
        statusTag.textContent = "NEUTRAL";
        statusCaption.textContent = "Mixed signals. Trade carefully.";
    } else {
        statusTag.textContent = "WEAK";
        statusCaption.textContent = "Cold structure. Avoid big risks.";
    }
}

function average(arr) {
    if (arr.length === 0) return 0;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
}

