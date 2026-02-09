// ===== Your flicker JS (kept) =====
let isAnimating = false;

async function show_flicker(word) {
    if (isAnimating) return;
    isAnimating = true;

    const output = document.getElementById("title");
    output.textContent = "";

    const response = await fetch("./assets/probs.json");
    const maxProbs = await response.json();

    const asciiChars = Array.from({length: 128}, (_, i) => String.fromCharCode(i));
    let iteration = 0;

    function probs(iteration, targetIndex) {
        const highProb = maxProbs[iteration];
        const lowProb = (1 - highProb) / (asciiChars.length - 1);
        return asciiChars.map((_, i) => i === targetIndex ? highProb : lowProb);
    }

    function weightedRandom(probs) {
        const r = Math.random();
        let acc = 0;
        for (let i = 0; i < probs.length; i++) {
            acc += probs[i];
            if (r <= acc) return asciiChars[i];
        }
        return asciiChars[asciiChars.length - 1];
    }

    const iterTimer = setInterval(() => {
        iteration++;
        if (iteration > 12) clearInterval(iterTimer);
    }, 250);

    const outputTimer = setInterval(() => {
        if (iteration > 12) {
            output.textContent = word;
            isAnimating = false;
            clearInterval(outputTimer);
            return;
        }
        output.textContent = [...word].map(
            (_, index) => weightedRandom(probs(iteration, word.charCodeAt(index)))
        ).join("");
    }, 20);
}

document.getElementById("title").addEventListener(
    "click", () => show_flicker("bluetot")
);
show_flicker("bluetot");

// ===== Fixed year show/hide + update (timeline only) + year-break spacing + fast years =====
(function () {
    const sidebar = document.getElementById("sidebar");
    const yearEl = document.getElementById("yearDisplay");
    const timeline = document.getElementById("timelineSection");
    if (!timeline) return;

    // Generate ghost years as individual entries (no boxes)
    const fastYearsHost = document.getElementById("fastYears");
    if (fastYearsHost) {

        for (let y = 2007; y <= 2020; y++) {
            const sec = document.createElement("section");
            sec.className = "entry ghost";
            sec.dataset.year = String(y);
            fastYearsHost.appendChild(sec);
        }

    }

    // Collect entries AFTER generation
    const entries = Array.from(document.querySelectorAll(".entry[data-year]"));
    if (!entries.length) return;

    // Add spacing classes automatically where year changes
    let prevYear = null;
    for (const el of entries) {
        const y = el.dataset.year;
        if (prevYear !== null && y !== prevYear) el.classList.add("year-break");
        prevYear = y;
    }

    // Extra spacing after About -> next entry
    const aboutIndex = entries.findIndex(e => (e.dataset.year || "").toLowerCase() === "about");
    if (aboutIndex !== -1 && entries[aboutIndex + 1]) {
        entries[aboutIndex + 1].classList.add("after-about-break");
    }

    let active = false;
    let currentYear = "";

    function fadeSetYear(nextYear){
        if (!nextYear || nextYear === currentYear) return;
        currentYear = nextYear;
        yearEl.classList.add("fading");
        setTimeout(() => {
            yearEl.textContent = nextYear;
            yearEl.classList.remove("fading");
        }, 90);
    }

    function pickYearAtMarker(){
        const markerY = window.innerHeight * 0.55; // ✅ switch later (try 0.50–0.65)

        // bottom snap (keep)
        const doc = document.documentElement;
        if (window.scrollY + window.innerHeight >= doc.scrollHeight - 4) {
            fadeSetYear(entries[entries.length - 1].dataset.year);
            return;
        }

        let candidate = entries[0];
        for (const el of entries) {
            const r = el.getBoundingClientRect();

            // ✅ Normal entries: switch when BOTTOM crosses marker (prevents early switch)
            // ✅ Ghost entries: switch when CENTER crosses marker (smooth ticking)
            const triggerY = el.classList.contains("ghost")
                ? (r.top + r.bottom) / 2
                : r.top;

            if (triggerY <= markerY) candidate = el;
                else break;
        }

        fadeSetYear(candidate.dataset.year);
    }


    function computeActive(){
        const r = timeline.getBoundingClientRect();
        const y = window.innerHeight * 0.80; // ✅ show sidebar earlier (try 0.70–0.90)
        return (r.top <= y) && (r.bottom >= y);
    }

    let ticking = false;
    function onScrollOrResize(){
        if (ticking) return;
        ticking = true;

        requestAnimationFrame(() => {
            ticking = false;

            const nextActive = computeActive();
            if (nextActive !== active) {
                active = nextActive;
                sidebar.classList.toggle("active", active);

                if (!active) {
                    yearEl.textContent = "";
                    currentYear = "";
                } else {
                    pickYearAtMarker();
                }
            }

            if (active) pickYearAtMarker();
        });
    }

    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);
    onScrollOrResize();
})();
