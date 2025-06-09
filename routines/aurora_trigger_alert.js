function triggerAlert(riskLevel, message) {
    switch (riskLevel) {
        case "high":
            console.warn("🚨", message);
            break;
        case "medium":
            console.log("⚠️", message);
            break;
        default:
            console.log("✅", message);
    }
}