// Exam code mapping to question sets
const examSets = {
    "QLTA102": {
        topic: "Qualitative Analysis",
        questions: [
    { question: "Which reagent is used to confirm the presence of iodide ions?", options: ["Cl₂", "AgNO₃", "BaCl₂", "NaOH"], answer: "Cl₂", explanation: "Iodide ions (I⁻) react with chlorine (Cl₂) to release iodine, which can be detected by its characteristic violet coloration in organic solvents." },
    { question: "What is the color of the precipitate formed when silver ions react with Cl⁻?", options: ["White", "Yellow", "Green", "Blue"], answer: "White", explanation: "Silver ions (Ag⁺) react with chloride ions (Cl⁻) to form a white precipitate of silver chloride (AgCl)." },
    { question: "Which ion produces a golden-yellow flame in a flame test?", options: ["Na⁺", "K⁺", "Ca²⁺", "Li⁺"], answer: "Na⁺", explanation: "Sodium ions (Na⁺) produce a golden-yellow flame when subjected to a flame test." },
    { question: "Which reagent is used to confirm the presence of thiosulfate ions?", options: ["AgNO₃", "Cl₂", "BaCl₂", "NaOH"], answer: "AgNO₃", explanation: "Thiosulfate ions (S₂O₃²⁻) react with silver nitrate (AgNO₃) to form a white precipitate of silver thiosulfate, which darkens upon standing." },
    { question: "What is the color of the precipitate formed when cobalt ions react with NH₃?", options: ["Pink", "Yellow", "White", "Blue"], answer: "Pink", explanation: "Cobalt ions (Co²⁺) react with ammonia (NH₃) to form a pink complex, indicating the presence of Co²⁺." },
    { question: "Which ion gives a yellow precipitate with K₂CrO₄?", options: ["Pb²⁺", "Ag⁺", "Cu²⁺", "Fe³⁺"], answer: "Pb²⁺", explanation: "Lead(II) ions (Pb²⁺) react with potassium chromate (K₂CrO₄) to form a yellow precipitate of lead chromate (PbCrO₄)." },
    { question: "Which reagent is used to confirm the presence of ferrous ions?", options: ["K₃[Fe(CN)₆]", "AgNO₃", "BaCl₂", "NaOH"], answer: "K₃[Fe(CN)₆]", explanation: "Ferrous ions (Fe²⁺) react with potassium ferricyanide (K₃[Fe(CN)₆]) to form a blue precipitate of Turnbull's blue." },
    { question: "Which ion gives a reddish-brown precipitate with NH₃ and Cu²⁺?", options: ["Cu(NH₃)₄²⁺", "Fe³⁺", "Ni²⁺", "Cr³⁺"], answer: "Cu(NH₃)₄²⁺", explanation: "Copper ions (Cu²⁺) form a reddish-brown complex with ammonia (NH₃), indicating the presence of Cu²⁺." },
    { question: "What is the color of the precipitate formed when mercury ions react with KI?", options: ["Yellow", "White", "Black", "Brown"], answer: "Yellow", explanation: "Mercury ions (Hg²⁺) react with potassium iodide (KI) to form a yellow precipitate of mercuric iodide (HgI₂)." },
    { question: "Which ion gives a blue precipitate with NaOH and Cu²⁺?", options: ["Cu(OH)₂", "Fe³⁺", "Mn²⁺", "Ni²⁺"], answer: "Cu(OH)₂", explanation: "Copper ions (Cu²⁺) react with sodium hydroxide (NaOH) to form a blue precipitate of copper hydroxide (Cu(OH)₂)." },
    { question: "Which ion produces a violet flame in a flame test?", options: ["K⁺", "Na⁺", "Ca²⁺", "Li⁺"], answer: "K⁺", explanation: "Potassium ions (K⁺) produce a violet flame when subjected to a flame test." },
    { question: "What is the color of the precipitate formed when iron(II) ions react with NaOH?", options: ["Green", "Blue", "White", "Brown"], answer: "Green", explanation: "Iron(II) ions (Fe²⁺) react with sodium hydroxide (NaOH) to form a green precipitate of iron(II) hydroxide (Fe(OH)₂)." },
    { question: "Which reagent is used to confirm the presence of acetate ions?", options: ["FeCl₃", "AgNO₃", "BaCl₂", "NaOH"], answer: "FeCl₃", explanation: "Acetate ions (CH₃COO⁻) react with ferric chloride (FeCl₃) to produce a reddish-brown coloration or precipitate." },
    { question: "Which ion gives a yellow precipitate with potassium iodide?", options: ["Pb²⁺", "Ag⁺", "Cu²⁺", "Fe³⁺"], answer: "Pb²⁺", explanation: "Lead(II) ions (Pb²⁺) react with potassium iodide (KI) to form a yellow precipitate of lead iodide (PbI₂)." },
    { question: "Which reagent is used to confirm the presence of ammonium ions?", options: ["NaOH", "AgNO₃", "BaCl₂", "FeCl₃"], answer: "NaOH", explanation: "Ammonium ions (NH₄⁺) react with sodium hydroxide (NaOH) to release ammonia gas (NH₃), which can be detected by its pungent smell." },
    { question: "What is the color of the precipitate formed when magnesium ions react with NaOH?", options: ["White", "Blue", "Green", "Yellow"], answer: "White", explanation: "Magnesium ions (Mg²⁺) react with sodium hydroxide (NaOH) to form a white precipitate of magnesium hydroxide (Mg(OH)₂)." },
    { question: "Which ion produces a crimson flame in a flame test?", options: ["Li⁺", "Na⁺", "K⁺", "Ca²⁺"], answer: "Li⁺", explanation: "Lithium ions (Li⁺) produce a crimson flame when subjected to a flame test." },
    { question: "Which reagent is used to confirm the presence of bromide ions?", options: ["Cl₂", "AgNO₃", "BaCl₂", "NaOH"], answer: "Cl₂", explanation: "Bromide ions (Br⁻) react with chlorine (Cl₂) to release bromine, which can be detected by its characteristic reddish-brown color." },
    { question: "What is the color of the precipitate formed when nickel ions react with dimethylglyoxime?", options: ["Red", "Yellow", "White", "Blue"], answer: "Red", explanation: "Nickel ions (Ni²⁺) react with dimethylglyoxime to form a red precipitate of nickel dimethylglyoximate." },
    { question: "Which ion gives a brown ring with FeSO₄ and H₂SO₄ in the nitrate test?", options: ["NO₃⁻", "Cl⁻", "Br⁻", "I⁻"], answer: "NO₃⁻", explanation: "Nitrate ions (NO₃⁻) react with ferrous sulfate (FeSO₄) and concentrated sulfuric acid (H₂SO₄) to form a brown ring at the junction of the two liquids." },
    { question: "Which reagent is commonly used to test for the presence of chloride ions?", options: ["AgNO₃", "BaCl₂", "H₂SO₄", "K₂Cr₂O₇"], answer: "AgNO₃", explanation: "Silver nitrate (AgNO₃) reacts with chloride ions (Cl⁻) to form a white precipitate of silver chloride (AgCl)." },
    { question: "What is the color of the precipitate formed when sulfate ions react with BaCl₂ in acidic medium?", options: ["White", "Yellow", "Green", "Blue"], answer: "White", explanation: "When sulfate ions (SO₄²⁻) react with barium chloride (BaCl₂) in the presence of dilute HCl, a white precipitate of barium sulfate (BaSO₄) is formed." },
    { question: "Which ion gives a deep blue coloration with starch solution in the presence of iodine?", options: ["I⁻", "I₂", "I₃⁻", "Cl⁻"], answer: "I₃⁻", explanation: "The triiodide ion (I₃⁻) forms a deep blue complex with starch, which is characteristic in qualitative analysis." },
    { question: "What is the color of the precipitate formed when potassium chromate reacts with lead(II) ions?", options: ["Yellow", "Orange", "White", "Green"], answer: "Yellow", explanation: "Potassium chromate (K₂CrO₄) reacts with lead(II) ions (Pb²⁺) to form a yellow precipitate of lead chromate (PbCrO₄)." },
    { question: "Which gas is evolved when dilute H₂SO₄ is added to a carbonate compound?", options: ["CO₂", "SO₂", "H₂", "O₂"], answer: "CO₂", explanation: "Carbonates react with dilute sulfuric acid (H₂SO₄) to release carbon dioxide (CO₂) gas." },
    { question: "What is the characteristic smell of ammonia gas?", options: ["Rotten eggs", "Pungent", "Sweet", "Odorless"], answer: "Pungent", explanation: "Ammonia gas (NH₃) has a characteristic pungent smell, which is often observed during its release." },
    { question: "Which reagent is used to confirm the presence of sulfide ions?", options: ["Pb(NO₃)₂", "AgNO₃", "CuSO₄", "FeCl₃"], answer: "Pb(NO₃)₂", explanation: "Lead nitrate (Pb(NO₃)₂) reacts with sulfide ions (S²⁻) to form a black precipitate of lead sulfide (PbS)." },
    { question: "What is the color of the precipitate formed when iron(III) ions react with potassium thiocyanate?", options: ["Red", "Yellow", "White", "Blue"], answer: "Red", explanation: "Iron(III) ions (Fe³⁺) react with potassium thiocyanate (KSCN) to produce a blood-red complex, indicating the presence of Fe³⁺." },
    { question: "Which ion produces a green flame in a flame test?", options: ["Cu²⁺", "Ba²⁺", "Na⁺", "K⁺"], answer: "Ba²⁺", explanation: "Barium ions (Ba²⁺) produce a green flame when subjected to a flame test." },
    { question: "Which reagent is used to confirm the presence of nitrate ions?", options: ["FeSO₄ and H₂SO₄", "AgNO₃", "BaCl₂", "NaOH"], answer: "FeSO₄ and H₂SO₄", explanation: "The brown ring test, involving ferrous sulfate (FeSO₄) and concentrated sulfuric acid (H₂SO₄), confirms the presence of nitrate ions (NO₃⁻)." },

    { question: "What is the color of the precipitate formed when copper(II) ions react with NaOH?", options: ["Blue", "Green", "White", "Brown"], answer: "Blue", explanation: "Copper(II) ions (Cu²⁺) react with sodium hydroxide (NaOH) to form a blue precipitate of copper hydroxide (Cu(OH)₂)." },
    { question: "Which gas is evolved when dilute HCl is added to a sulfide compound?", options: ["H₂S", "SO₂", "CO₂", "O₂"], answer: "H₂S", explanation: "Sulfide compounds react with dilute hydrochloric acid (HCl) to release hydrogen sulfide (H₂S), which has a characteristic rotten egg smell." },
    { question: "Which ion forms a white precipitate with AgNO₃ that dissolves in NH₃ solution?", options: ["Cl⁻", "Br⁻", "I⁻", "SO₄²⁻"], answer: "Cl⁻", explanation: "Chloride ions (Cl⁻) form a white precipitate with silver nitrate (AgNO₃), which dissolves in ammonia (NH₃) solution due to the formation of soluble [Ag(NH₃)₂]⁺ complex." },
    { question: "Which reagent is used to confirm the presence of phosphate ions?", options: ["Ammonium molybdate", "AgNO₃", "BaCl₂", "NaOH"], answer: "Ammonium molybdate", explanation: "Ammonium molybdate reacts with phosphate ions (PO₄³⁻) in an acidic medium to form a yellow precipitate of ammonium phosphomolybdate." },
    { question: "What is the color of the precipitate formed when zinc ions react with NaOH?", options: ["White", "Blue", "Green", "Yellow"], answer: "White", explanation: "Zinc ions (Zn²⁺) react with sodium hydroxide (NaOH) to form a white precipitate of zinc hydroxide (Zn(OH)₂)." },
    { question: "Which ion produces a brick-red flame in a flame test?", options: ["Ca²⁺", "Sr²⁺", "Li⁺", "K⁺"], answer: "Ca²⁺", explanation: "Calcium ions (Ca²⁺) produce a brick-red flame when subjected to a flame test." },
    { question: "Which gas is evolved when dilute H₂SO₄ is added to a sulfite compound?", options: ["SO₂", "CO₂", "H₂", "O₂"], answer: "SO₂", explanation: "Sulfite compounds react with dilute sulfuric acid (H₂SO₄) to release sulfur dioxide (SO₂) gas." },
    { question: "Which ion gives a greenish-yellow coloration in the presence of dilute HCl and KMnO₄?", options: ["Cl⁻", "Br⁻", "I⁻", "NO₃⁻"], answer: "Cl⁻", explanation: "Chloride ions (Cl⁻) react with dilute HCl and potassium permanganate (KMnO₄), giving a greenish-yellow coloration due to the formation of chlorine gas." },
    { question: "Which reagent is used to confirm the presence of carbonate ions?", options: ["Dilute HCl", "AgNO₃", "BaCl₂", "NaOH"], answer: "Dilute HCl", explanation: "Carbonates react with dilute hydrochloric acid (HCl) to release carbon dioxide (CO₂), which can be detected by passing it through lime water." },
    { question: "What is the color of the precipitate formed when aluminum ions react with NaOH?", options: ["White", "Blue", "Green", "Yellow"], answer: "White", explanation: "Aluminum ions (Al³⁺) react with sodium hydroxide (NaOH) to form a white precipitate of aluminum hydroxide (Al(OH)₃)." },
    ],
        "QLTA12": {
        topic: "Qualitative Analysis",
        questions: [
        { question: "Who wrote 'To Kill a Mockingbird'?", options: ["Hemingway", "Orwell", "Harper Lee", "Fitzgerald"], answer: "Harper Lee", explanation: "Harper Lee is the author of 'To Kill a Mockingbird'." },
        { question: "What is a synonym for 'Happy'?", options: ["Sad", "Elated", "Angry", "Bored"], answer: "Elated", explanation: "A synonym for Happy is Elated." },
        { question: "Which word is an adjective?", options: ["Run", "Beautiful", "Quickly", "Jump"], answer: "Beautiful", explanation: "Adjectives describe nouns. 'Beautiful' is an adjective." },
        // Add more English questions...
    ],
    "QLTA2": {
        topic: "Qualitative Analysis",
        questions: [
        { question: "What is the chemical symbol for water?", options: ["H2O", "CO2", "O2", "H2"], answer: "H2O", explanation: "H2O is the chemical formula for water." },
        { question: "Which planet is known as the Red Planet?", options: ["Venus", "Mars", "Jupiter", "Saturn"], answer: "Mars", explanation: "Mars is called the Red Planet because of its reddish appearance." },
        { question: "What is the powerhouse of the cell?", options: ["Nucleus", "Ribosome", "Mitochondria", "Golgi body"], answer: "Mitochondria", explanation: "Mitochondria generate energy for the cell." },
    // Add more science questions...
        ]
    }
};
