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

// UPDATE HUD FROM CSV
function updateHUD(rounds) {
    if (rounds.length < 5) {
        alert("Need at least 5 rounds to analyze.");
        return;
    }

    // Update Last 10
    const last10 = rounds.slice(-10).reverse();
    const historyList = document.getElementById("historyList");
    historyList.innerHTML = "";
    last10.forEach((m, i) => {
        historyList.innerHTML += `<li>${-(i+1)} — ${m.toFixed(2)}x</li>`;
    });

    // Momentum
    const momentum = analyzeMomentum(rounds);
    document.getElementById("momentumTag").innerText = momentum.label;
    document.getElementById("momentumCaption").innerText = momentum.text;
    document.getElementById("momentumTag").className = "tag tag-momentum " + momentum.color;

    // Status
    const status = analyzeStatus(rounds);
    document.getElementById("statusTag").innerText = status.label;
    document.getElementById("statusCaption").innerText = status.text;
    document.getElementById("statusTag").className = "tag tag-status " + status.color;

    // Next Multiplier Estimate
    const next = estimateNext(rounds);
    document.getElementById("nextMulti").innerText = next.toFixed(2) + "x";
}
