
let sentences = [];
let currentIndex = 0;

let selectedEnglish = null;
let matches = {};
let checked = false;

// Load the JSON file
async function loadData() {
    try {
        const response = await fetch(
            "./uk_name_translation_vocabulary.json"
        );

        if (!response.ok) {
            throw new Error("Unable to load JSON file.");
        }

        const data = await response.json();

        if (!Array.isArray(data.sentences) ||
            data.sentences.length === 0) {
            throw new Error("No sentences found in JSON.");
        }

        sentences = data.sentences;

        loadRound();

    } catch (error) {
        document.getElementById("englishSentence").textContent =
            "Error loading vocabulary data. Please check your JSON file and run the webpage using a local server.";

        console.error(error);
    }
}

// Randomly shuffle an array
function shuffle(array) {
    const result = [...array];

    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));

        [result[i], result[j]] = [result[j], result[i]];
    }

    return result;
}

// Load current sentence
function loadRound() {
    const translationBox = document.getElementById("sentenceTranslation");

translationBox.textContent = "";
translationBox.style.display = "none";
    const sentence = sentences[currentIndex];

    selectedEnglish = null;
    matches = {};
    checked = false;

    document.getElementById("progress").textContent =
        `Sentence ${currentIndex + 1} / ${sentences.length}`;

    document.getElementById("englishSentence").textContent =
        sentence.english;

    document.getElementById("resultMessage").textContent = "";

    document.getElementById("checkAnswersButton").disabled = false;

    // Separate words and phrases
    const words = [];
    const phrases = [];

    sentence.vocabulary.forEach((item, index) => {
        const vocabularyItem = {
            id: index,
            english: item[0],
            chinese: item[1],
            type: item[2]
        };

        if (item[2] === "word") {
            words.push(vocabularyItem);
        } else if (item[2] === "phrase") {
            phrases.push(vocabularyItem);
        }
    });

    // Display vocabulary horizontally
    displayVocabulary("wordList", words);
    displayVocabulary("phraseList", phrases);

    // Display English matching items
    const englishItems = [...words, ...phrases];

    displayEnglishItems(englishItems);

    // Randomly arrange Chinese translations
    const chineseItems = shuffle(englishItems);

    displayChineseItems(chineseItems);

    drawLines();
}

// Display vocabulary groups
function displayVocabulary(elementId, items) {
    const container = document.getElementById(elementId);

    container.innerHTML = "";

    if (items.length === 0) {
        container.textContent = "None";
        return;
    }

    items.forEach(item => {
        const div = document.createElement("div");

        div.className = "vocabulary-item";
        div.textContent = item.english;

        container.appendChild(div);
    });
}

// Display English matching column
function displayEnglishItems(items) {
    const container = document.getElementById("englishItems");

    container.innerHTML = "";

    items.forEach(item => {
        const button = document.createElement("button");

        button.className = "match-item english-match";
        button.textContent = item.english;
        button.dataset.id = item.id;

        button.addEventListener("click", () => {
            selectEnglish(item.id);
        });

        container.appendChild(button);
    });
}

// Display Chinese matching column
function displayChineseItems(items) {
    const container = document.getElementById("chineseItems");

    container.innerHTML = "";

    items.forEach(item => {
        const button = document.createElement("button");

        button.className = "match-item chinese-match";
        button.textContent = item.chinese;
        button.dataset.id = item.id;

        button.addEventListener("click", () => {
            selectChinese(item.id);
        });

        container.appendChild(button);
    });
}

// Student selects an English item
function selectEnglish(id) {
    if (checked) return;

    selectedEnglish = id;

    document.querySelectorAll(".english-match").forEach(button => {
        button.classList.remove("selected");

        if (Number(button.dataset.id) === id) {
            button.classList.add("selected");
        }
    });
}

// Student selects a Chinese translation
function selectChinese(chineseId) {
    if (checked || selectedEnglish === null) return;

    const englishId = selectedEnglish;

    // Remove any previous match belonging to this English item
    delete matches[englishId];

    // Remove any previous English item using this Chinese item
    Object.keys(matches).forEach(key => {
        if (matches[key] === chineseId) {
            delete matches[key];
        }
    });

    // Create a new match
    matches[englishId] = chineseId;

    selectedEnglish = null;

    updateMatchingDisplay();
}

// Update selected and matched items
function updateMatchingDisplay() {
    document.querySelectorAll(".english-match").forEach(button => {
        const id = Number(button.dataset.id);

        button.classList.remove("selected", "matched");

        if (matches[id] !== undefined) {
            button.classList.add("matched");
        }
    });

    document.querySelectorAll(".chinese-match").forEach(button => {
        const id = Number(button.dataset.id);

        button.classList.remove("matched");

        if (Object.values(matches).includes(id)) {
            button.classList.add("matched");
        }
    });

    drawLines();
}

// Draw connecting lines
function drawLines() {
    const area = document.getElementById("matchingArea");
    const svg = document.getElementById("connectionLines");

    const rect = area.getBoundingClientRect();

    svg.setAttribute("viewBox", `0 0 ${rect.width} ${rect.height}`);
    svg.innerHTML = "";

    Object.entries(matches).forEach(([englishId, chineseId]) => {
        const englishButton = document.querySelector(
            `.english-match[data-id="${englishId}"]`
        );

        const chineseButton = document.querySelector(
            `.chinese-match[data-id="${chineseId}"]`
        );

        if (!englishButton || !chineseButton) return;

        const leftRect = englishButton.getBoundingClientRect();
        const rightRect = chineseButton.getBoundingClientRect();

        const x1 = leftRect.right - rect.left;
        const y1 = leftRect.top + leftRect.height / 2 - rect.top;

        const x2 = rightRect.left - rect.left;
        const y2 = rightRect.top + rightRect.height / 2 - rect.top;

        const line = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "line"
        );

        line.setAttribute("x1", x1);
        line.setAttribute("y1", y1);
        line.setAttribute("x2", x2);
        line.setAttribute("y2", y2);

        line.classList.add("connection-line");

        if (checked) {
            if (Number(englishId) === Number(chineseId)) {
                line.classList.add("correct-line");
            } else {
                line.classList.add("incorrect-line");
            }
        }

        svg.appendChild(line);
    });
}

// Check answers
function checkAnswers() {
    if (checked) return;

    const sentence = sentences[currentIndex];
    const total = sentence.vocabulary.length;

    const matchedCount = Object.keys(matches).length;

    if (matchedCount !== total) {
        document.getElementById("resultMessage").textContent =
            `Please complete all matches! (${matchedCount}/${total})`;

        document.getElementById("resultMessage").style.color =
            "#d47b00";

        return;
    }

    checked = true;

    let correctCount = 0;

    sentence.vocabulary.forEach((item, index) => {
        const selectedChineseId = matches[index];

        const englishButton = document.querySelector(
            `.english-match[data-id="${index}"]`
        );

        const chineseButton = document.querySelector(
            `.chinese-match[data-id="${selectedChineseId}"]`
        );

        if (selectedChineseId === index) {
            correctCount++;

            englishButton.classList.add("correct");
            chineseButton.classList.add("correct");

        } else {
            englishButton.classList.add("incorrect");
            chineseButton.classList.add("incorrect");
        }
    });

    document.getElementById("resultMessage").textContent =
        `Your score: ${correctCount} / ${total}`;

    document.getElementById("resultMessage").style.color =
        correctCount === total ? "#269b45" : "#df4545";

    drawLines();

    document.getElementById("checkAnswersButton").disabled = true;
    // Show the Chinese translation of the sentence
const translationBox = document.getElementById("sentenceTranslation");

translationBox.textContent = sentence.translation;
translationBox.style.display = "block";
}

// Move to the next sentence
function newRound() {
    if (currentIndex < sentences.length - 1) {
        currentIndex++;
    } else {
        currentIndex = 0;
    }

    loadRound();
}

// Button events
document.getElementById("checkAnswersButton")
    .addEventListener("click", checkAnswers);

document.getElementById("newRoundButton")
    .addEventListener("click", newRound);

// Redraw lines when the window changes size
window.addEventListener("resize", drawLines);

// Start the program
loadData();
