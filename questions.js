// Exam code mapping to question sets
const examSets = {
    "QLTA102": {
        topic: "Qualitative Analysis",
        questions: [
            { question: "Which reagent is used to confirm the presence of iodide ions?", options: ["Cl₂", "AgNO₃", "BaCl₂", "NaOH"], answer: "Cl₂", explanation: "Iodide ions (I⁻) react with chlorine[...]
            { question: "What is the color of the precipitate formed when silver ions react with Cl⁻?", options: ["White", "Yellow", "Green", "Blue"], answer: "White", explanation: "Silver ions (Ag⁺) reac[...]
            { question: "Which ion produces a golden-yellow flame in a flame test?", options: ["Na⁺", "K⁺", "Ca²⁺", "Li⁺"], answer: "Na⁺", explanation: "Sodium ions (Na⁺) produce a golden-yellow [...]
            { question: "Which reagent is used to confirm the presence of thiosulfate ions?", options: ["AgNO₃", "Cl₂", "BaCl₂", "NaOH"], answer: "AgNO₃", explanation: "Thiosulfate ions (S₂O₃²⁻[...]
            { question: "What is the color of the precipitate formed when cobalt ions react with NH₃?", options: ["Pink", "Yellow", "White", "Blue"], answer: "Pink", explanation: "Cobalt ions (Co²⁺) reac[...]
            { question: "Which ion gives a yellow precipitate with K₂CrO₄?", options: ["Pb²⁺", "Ag⁺", "Cu²⁺", "Fe³⁺"], answer: "Pb²⁺", explanation: "Lead(II) ions (Pb²⁺) react with potass[...]
            { question: "Which reagent is used to confirm the presence of ferrous ions?", options: ["K₃[Fe(CN)₆]", "AgNO₃", "BaCl₂", "NaOH"], answer: "K₃[Fe(CN)₆]", explanation: "Ferrous ions (Fe�[...]
            { question: "Which ion gives a reddish-brown precipitate with NH₃ and Cu²⁺?", options: ["Cu(NH₃)₄²⁺", "Fe³⁺", "Ni²⁺", "Cr³⁺"], answer: "Cu(NH₃)₄²⁺", explanation: "Coppe[...]
            { question: "What is the color of the precipitate formed when mercury ions react with KI?", options: ["Yellow", "White", "Black", "Brown"], answer: "Yellow", explanation: "Mercury ions (Hg²⁺) r[...]
            { question: "Which ion gives a blue precipitate with NaOH and Cu²⁺?", options: ["Cu(OH)₂", "Fe³⁺", "Mn²⁺", "Ni²⁺"], answer: "Cu(OH)₂", explanation: "Copper ions (Cu²⁺) react wit[...]
            { question: "Which ion produces a violet flame in a flame test?", options: ["K⁺", "Na⁺", "Ca²⁺", "Li⁺"], answer: "K⁺", explanation: "Potassium ions (K⁺) produce a violet flame when su[...]
            { question: "What is the color of the precipitate formed when iron(II) ions react with NaOH?", options: ["Green", "Blue", "White", "Brown"], answer: "Green", explanation: "Iron(II) ions (Fe²⁺) [...]
            { question: "Which reagent is used to confirm the presence of acetate ions?", options: ["FeCl₃", "AgNO₃", "BaCl₂", "NaOH"], answer: "FeCl₃", explanation: "Acetate ions (CH₃COO⁻) react [...]
            { question: "Which ion gives a yellow precipitate with potassium iodide?", options: ["Pb²⁺", "Ag⁺", "Cu²⁺", "Fe³⁺"], answer: "Pb²⁺", explanation: "Lead(II) ions (Pb²⁺) react with [...]
            { question: "Which reagent is used to confirm the presence of ammonium ions?", options: ["NaOH", "AgNO₃", "BaCl₂", "FeCl₃"], answer: "NaOH", explanation: "Ammonium ions (NH₄⁺) react with[...]
            { question: "What is the color of the precipitate formed when magnesium ions react with NaOH?", options: ["White", "Blue", "Green", "Yellow"], answer: "White", explanation: "Magnesium ions (Mg²��[...]
            { question: "Which ion produces a crimson flame in a flame test?", options: ["Li⁺", "Na⁺", "K⁺", "Ca²⁺"], answer: "Li⁺", explanation: "Lithium ions (Li⁺) produce a crimson flame when [...]
            { question: "Which reagent is used to confirm the presence of bromide ions?", options: ["Cl₂", "AgNO₃", "BaCl₂", "NaOH"], answer: "Cl₂", explanation: "Bromide ions (Br⁻) react with chlor[...]
            { question: "What is the color of the precipitate formed when nickel ions react with dimethylglyoxime?", options: ["Red", "Yellow", "White", "Blue"], answer: "Red", explanation: "Nickel ions (Ni²[...]
            { question: "Which ion gives a brown ring with FeSO₄ and H₂SO₄ in the nitrate test?", options: ["NO₃⁻", "Cl⁻", "Br⁻", "I⁻"], answer: "NO₃⁻", explanation: "Nitrate ions (NO₃��[...]
            { question: "Which reagent is commonly used to test for the presence of chloride ions?", options: ["AgNO₃", "BaCl₂", "H₂SO₄", "K₂Cr₂O₇"], answer: "AgNO₃", explanation: "Silver nitr[...]
            { question: "What is the color of the precipitate formed when sulfate ions react with BaCl₂ in acidic medium?", options: ["White", "Yellow", "Green", "Blue"], answer: "White", explanation: "When[...]
            { question: "Which ion gives a deep blue coloration with starch solution in the presence of iodine?", options: ["I⁻", "I₂", "I₃⁻", "Cl⁻"], answer: "I₃⁻", explanation: "The triiodide [...]
            { question: "What is the color of the precipitate formed when potassium chromate reacts with lead(II) ions?", options: ["Yellow", "Orange", "White", "Green"], answer: "Yellow", explanation: "Potas[...]
            { question: "Which gas is evolved when dilute H₂SO₄ is added to a carbonate compound?", options: ["CO₂", "SO₂", "H₂", "O₂"], answer: "CO₂", explanation: "Carbonates react with dilute[...]
            { question: "What is the characteristic smell of ammonia gas?", options: ["Rotten eggs", "Pungent", "Sweet", "Odorless"], answer: "Pungent", explanation: "Ammonia gas (NH₃) has a characteristic [...]
            { question: "Which reagent is used to confirm the presence of sulfide ions?", options: ["Pb(NO₃)₂", "AgNO₃", "CuSO₄", "FeCl₃"], answer: "Pb(NO₃)₂", explanation: "Lead nitrate (Pb(NO�[...]
            { question: "What is the color of the precipitate formed when iron(III) ions react with potassium thiocyanate?", options: ["Red", "Yellow", "White", "Blue"], answer: "Red", explanation: "Iron(III)[...]
            { question: "Which ion produces a green flame in a flame test?", options: ["Cu²⁺", "Ba²⁺", "Na⁺", "K⁺"], answer: "Ba²⁺", explanation: "Barium ions (Ba²⁺) produce a green flame when[...]
            { question: "Which reagent is used to confirm the presence of nitrate ions?", options: ["FeSO₄ and H₂SO₄", "AgNO₃", "BaCl₂", "NaOH"], answer: "FeSO₄ and H₂SO₄", explanation: "The b[...]
            { question: "What is the color of the precipitate formed when copper(II) ions react with NaOH?", options: ["Blue", "Green", "White", "Brown"], answer: "Blue", explanation: "Copper(II) ions (Cu²��[...]
            { question: "Which gas is evolved when dilute HCl is added to a sulfide compound?", options: ["H₂S", "SO₂", "CO₂", "O₂"], answer: "H₂S", explanation: "Sulfide compounds react with dilute[...]
            { question: "Which ion forms a white precipitate with AgNO₃ that dissolves in NH₃ solution?", options: ["Cl⁻", "Br⁻", "I⁻", "SO₄²⁻"], answer: "Cl⁻", explanation: "Chloride ions (C[...]
            { question: "Which reagent is used to confirm the presence of phosphate ions?", options: ["Ammonium molybdate", "AgNO₃", "BaCl₂", "NaOH"], answer: "Ammonium molybdate", explanation: "Ammonium [...]
            { question: "What is the color of the precipitate formed when zinc ions react with NaOH?", options: ["White", "Blue", "Green", "Yellow"], answer: "White", explanation: "Zinc ions (Zn²⁺) react w[...]
            { question: "Which ion produces a brick-red flame in a flame test?", options: ["Ca²⁺", "Sr²⁺", "Li⁺", "K⁺"], answer: "Ca²⁺", explanation: "Calcium ions (Ca²⁺) produce a brick-red f[...]
            { question: "Which gas is evolved when dilute H₂SO₄ is added to a sulfite compound?", options: ["SO₂", "CO₂", "H₂", "O₂"], answer: "SO₂", explanation: "Sulfite compounds react with d[...]
            { question: "Which ion gives a greenish-yellow coloration in the presence of dilute HCl and KMnO₄?", options: ["Cl⁻", "Br⁻", "I⁻", "NO₃⁻"], answer: "Cl⁻", explanation: "Chloride ions[...]
            { question: "Which reagent is used to confirm the presence of carbonate ions?", options: ["Dilute HCl", "AgNO₃", "BaCl₂", "NaOH"], answer: "Dilute HCl", explanation: "Carbonates react with dil[...]
            { question: "What is the color of the precipitate formed when aluminum ions react with NaOH?", options: ["White", "Blue", "Green", "Yellow"], answer: "White", explanation: "Aluminum ions (Al³⁺)[...]
        ]
    },
    "ENG202": {
        topic: "English Literature",
        questions: [
            { question: "Who wrote 'To Kill a Mockingbird'?", options: ["Hemingway", "Orwell", "Harper Lee", "Fitzgerald"], answer: "Harper Lee", explanation: "Harper Lee is the author of 'To Kill a Mocki[...]
            { question: "What is a synonym for 'Happy'?", options: ["Sad", "Elated", "Angry", "Bored"], answer: "Elated", explanation: "A synonym for Happy is Elated." },
            { question: "Which word is an adjective?", options: ["Run", "Beautiful", "Quickly", "Jump"], answer: "Beautiful", explanation: "Adjectives describe nouns. 'Beautiful' is an adjective." },
            // Add more English questions...
        ]
    },
    "SCI123": {
        topic: "General Science",
        questions: [
            { question: "What is the chemical symbol for water?", options: ["H2O", "CO2", "O2", "H2"], answer: "H2O", explanation: "H2O is the chemical formula for water." },
            { question: "Which planet is known as the Red Planet?", options: ["Venus", "Mars", "Jupiter", "Saturn"], answer: "Mars", explanation: "Mars is called the Red Planet because of its reddish appe[...]
            { question: "What is the powerhouse of the cell?", options: ["Nucleus", "Ribosome", "Mitochondria", "Golgi body"], answer: "Mitochondria", explanation: "Mitochondria generate energy for the ce[...]
            // Add more science questions...
        ]
    }
};
