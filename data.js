// MOMENTUM ANALYSIS
function analyzeMomentum(data) {
    const last = data.slice(-6); // last 6 rounds
    const avg = last.reduce((a, b) => a + b, 0) / last.length;

    if (avg > 5) return { label: "HOT", color: "hot", text: "High multipliers active." };
    if (avg >= 2) return { label: "DECENT", color: "warm", text: "Moderate momentum trend." };
    return { label: "COLD", color: "cold", text: "Low activity. Safer rounds expected." };
}

// STATUS SCORE
function analyzeStatus(data) {
    const last3 = data.slice(-3);
    const hits = last3.filter(x => x > 2).length;

    if (hits === 3) return { label: "FAVORABLE", color: "good", text: "Strong helper + high waves." };
    if (hits === 2) return { label: "NEUTRAL", color: "neutral", text: "Mixed helpers." };
    return { label: "RISKY", color: "bad", text: "Weak wave structure detected." };
}

// NEXT MULTIPLIER ESTIMATE
function estimateNext(data) {
    const last5 = data.slice(-5);
    return last5.reduce((a, b) => a + b, 0) / last5.length * 0.85;
}
