// Exam code mapping to question sets
const examSets = {
    "MATH101": [
        { question: "What is 5 + 3?", options: ["6", "7", "8", "9"], answer: "8", explanation: "5 + 3 = 8" },
        { question: "Solve for x: 2x = 10", options: ["3", "5", "6", "8"], answer: "5", explanation: "Divide both sides by 2: x = 5" },
        { question: "What is the square root of 49?", options: ["5", "6", "7", "8"], answer: "7", explanation: "√49 = 7" },
        // Add more math questions...
    ],
    "ENG202": [
        { question: "Who wrote 'To Kill a Mockingbird'?", options: ["Hemingway", "Orwell", "Harper Lee", "Fitzgerald"], answer: "Harper Lee", explanation: "Harper Lee is the author of 'To Kill a Mockingbird'." },
        { question: "What is a synonym for 'Happy'?", options: ["Sad", "Elated", "Angry", "Bored"], answer: "Elated", explanation: "A synonym for Happy is Elated." },
        { question: "Which word is an adjective?", options: ["Run", "Beautiful", "Quickly", "Jump"], answer: "Beautiful", explanation: "Adjectives describe nouns. 'Beautiful' is an adjective." },
        // Add more English questions...
    ],
    "SCI303": [
        { question: "What is the chemical symbol for water?", options: ["H2O", "CO2", "O2", "H2"], answer: "H2O", explanation: "H2O is the chemical formula for water." },
        { question: "Which planet is known as the Red Planet?", options: ["Venus", "Mars", "Jupiter", "Saturn"], answer: "Mars", explanation: "Mars is called the Red Planet because of its reddish appearance." },
        { question: "What is the powerhouse of the cell?", options: ["Nucleus", "Ribosome", "Mitochondria", "Golgi body"], answer: "Mitochondria", explanation: "Mitochondria generate energy for the cell." },
        // Add more science questions...
    ],
};
