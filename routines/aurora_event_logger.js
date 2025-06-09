function logEvent(category, details) {
    const time = new Date().toISOString();
    console.log(`[${category}] ${time}:`, details);
}

function batchLog(events) {
    events.forEach(event => logEvent(event.type, event.payload));
}