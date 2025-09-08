let isAnimating = false;

async function show_flicker(word) {
    if (isAnimating) return;
    isAnimating = true;

    const output = document.getElementById("title");
    output.textContent = "";

    const response = await fetch("/assets/probs.json");
    const maxProbs = await response.json();

    // all ASCII chars from 0–127
    const asciiChars = Array.from({length: 128}, (_, i) => String.fromCharCode(i));

    let iteration = 0;

    // get probability distribution given the iteration and character code
    function probs(iteration, targetIndex) {

        const highProb = maxProbs[iteration];
        const lowProb = (1 - highProb) / (asciiChars.length - 1);

        return asciiChars.map((_, i) => i === targetIndex ? highProb : lowProb);
    }

    // weighted random selection
    function weightedRandom(probs) {
        const r = Math.random();
        let acc = 0;
        for (let i = 0; i < probs.length; i++) {
            acc += probs[i];
            if (r <= acc) return asciiChars[i];
        }
        return asciiChars[asciiChars.length - 1];
    }
    
    // increment iteration once in a while
    const iterTimer = setInterval(() => { 
        iteration++;

        if (iteration > 12) {
            clearInterval(iterTimer);
        }
    }, 250);

    // Flicker effect
    const outputTimer = setInterval(() => {
        if (iteration > 12) {
            output.textContent = word; // set back word
            isAnimating = false; // reset
            clearInterval(outputTimer);
            return;
        }
        output.textContent = [...word].map(
            (_, index) => weightedRandom(
                probs(iteration, word.charCodeAt(index))
            )
        ).join("");
    }, 20); // flicker every 20ms
    
}

document.getElementById("title").addEventListener(
    "click", () => show_flicker("projects")
);

show_flicker("projects");


