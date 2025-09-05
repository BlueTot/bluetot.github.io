// All ASCII chars from 0–127
const asciiChars = Array.from({length: 128}, (_, i) => String.fromCharCode(i));

async function show_flicker(word) {

    const response = await fetch("./assets/probs.json");
    const maxProbs = await response.json();

    console.log(maxProbs);

    let iteration = 0;

    // get probability distribution given the iteration and character code
    function probs(iteration, targetIndex) {

        const highProb = maxProbs[iteration];
        const lowProb = (1 - highProb) / (asciiChars.length - 1);

        return asciiChars.map((_, i) => i === targetIndex ? highProb : lowProb);
    }

    // Weighted random selection
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
        console.log(iteration);

        if (iteration > 12) {
            clearInterval(iterTimer);
        }
    }, 250);

    // Flicker effect
    const output = document.getElementById("title");
    const outputTimer = setInterval(() => {
        if (iteration > 12) {
            output.textContent = word;
            clearInterval(outputTimer);
            return;
        }
        output.textContent = [...word].map(
            (_, index) => weightedRandom(
                probs(iteration, word.charCodeAt(index))
            )
        ).join("");
    }, 20); // 50ms per flicker

}

show_flicker("bluetot");

