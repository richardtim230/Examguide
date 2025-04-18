// Exam code mapping to question sets
const examSets = {
    "EXAM001": [
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

    
"EXAM007": [
        {
        question: "Which of the following is the strongest type of intermolecular force?",
        options: ["Van der Waals forces", "Dipole-dipole interactions", "Hydrogen bonding", "London dispersion forces"],
        answer: "Hydrogen bonding",
        explanation: "Hydrogen bonding is a strong type of dipole-dipole interaction that occurs between hydrogen and highly electronegative atoms like oxygen, nitrogen, or fluorine. <br>Van der Waals forces are a general term encompassing dipole-dipole, dipole-induced dipole, and London dispersion forces. <br>London dispersion forces are the weakest intermolecular forces, arising from temporary fluctuations in electron distribution. <br>Dipole-dipole interactions occur between polar molecules but are weaker than hydrogen bonds."
        },
        {
        question: "Which of the following compounds is most likely to exhibit hydrogen bonding?",
        options: ["CH₄", "H₂S", "NH₃", "HCl"],
        answer: "NH₃",
        explanation: "Hydrogen bonding requires a hydrogen atom bonded to a highly electronegative atom (N, O, or F). <br>NH₃ contains a hydrogen atom bonded to nitrogen, allowing for hydrogen bonding. <br>CH₄ is nonpolar and exhibits only London dispersion forces. <br>H₂S exhibits dipole-dipole interactions, but the electronegativity difference is not high enough for significant hydrogen bonding. <br>HCl exhibits dipole-dipole interactions, but the electronegativity difference is not high enough for significant hydrogen bonding."
        },
        {
        question: "Hydrogen bonding is responsible for the unusually high boiling point of which of the following?",
        options: ["H₂S", "H₂Se", "H₂Te", "H₂O"],
        answer: "H₂O",
        explanation: "Water (H₂O) exhibits strong hydrogen bonding due to the high electronegativity of oxygen. <br>This hydrogen bonding requires more energy to break, resulting in a higher boiling point compared to other group 16 hydrides. <br>H₂S, H₂Se, and H₂Te exhibit weaker intermolecular forces (primarily dipole-dipole and London dispersion forces) and thus have lower boiling points."
        },
        {
        question: "In which of the following pairs can hydrogen bonding occur?",
        options: ["CH₄ and CH₄", "H₂O and CH₄", "H₂O and NH₃", "H₂S and H₂S"],
        answer: "H₂O and NH₃",
        explanation: "Hydrogen bonding can occur between a hydrogen atom bonded to N, O, or F in one molecule and a lone pair on N, O, or F in another molecule. <br>H₂O has hydrogen atoms bonded to oxygen and lone pairs on oxygen, while NH₃ has hydrogen atoms bonded to nitrogen and a lone pair on nitrogen. <br>CH₄ is nonpolar and cannot participate in hydrogen bonding. H₂S has hydrogen atoms bonded to sulfur, but sulfur is not electronegative enough to form strong hydrogen bonds."
        },
        {
        question: "Which of the following properties is NOT influenced by hydrogen bonding?",
        options: ["Boiling point", "Surface tension", "Viscosity", "Molar mass"],
        answer: "Molar mass",
        explanation: "Boiling point, surface tension, and viscosity are all influenced by intermolecular forces, including hydrogen bonding. Stronger intermolecular forces lead to higher boiling points, surface tension, and viscosity. <br>Molar mass is an intrinsic property of a molecule determined by the sum of the atomic masses of its constituent atoms and is independent of intermolecular forces."
        },
        {
        question: "What is the primary reason ice is less dense than liquid water?",
        options: ["Covalent bonds break upon freezing.", "Hydrogen bonds force water molecules to be closer together in the solid phase.", "Hydrogen bonds force water molecules to be farther apart in the solid phase.", "Ice has a lower molar mass than water."],
        answer: "Hydrogen bonds force water molecules to be farther apart in the solid phase.",
        explanation: "In ice, water molecules form a crystal lattice structure due to hydrogen bonding. <br>This structure forces the molecules to be farther apart than in liquid water, where the hydrogen bonds are constantly breaking and reforming, allowing the molecules to pack more closely. <br>Covalent bonds do not break upon freezing. Ice doesn't have a lower molar mass."
        },
        {
        question: "Which of the following statements about hydrogen bonding is FALSE?",
        options: ["It is a type of intermolecular force.", "It is stronger than a covalent bond.", "It involves a hydrogen atom bonded to a highly electronegative atom.", "It is responsible for the high boiling point of water."],
        answer: "It is stronger than a covalent bond.",
        explanation: "Hydrogen bonds are intermolecular forces, which are significantly weaker than intramolecular forces like covalent bonds. Covalent bonds involve the sharing of electrons between atoms, while hydrogen bonds are electrostatic attractions between molecules. The other statements are true about hydrogen bonding."
        },
        {
        question: "In DNA, hydrogen bonds are responsible for:",
        options: ["Linking amino acids together.", "Connecting sugars and phosphates in the backbone.", "Holding the two strands of the double helix together.", "Catalyzing enzymatic reactions."],
        answer: "Holding the two strands of the double helix together.",
        explanation: "Hydrogen bonds form between the nitrogenous bases (adenine, thymine, guanine, and cytosine) on the two strands of the DNA double helix. <br>These bonds hold the two strands together in a complementary fashion (A with T, and G with C). <br>Amino acids are linked by peptide bonds. Sugars and phosphates are linked by phosphodiester bonds. Enzymes catalyze reactions, but hydrogen bonds are not directly involved in catalysis."
        },
        {
        question: "Which of the following molecules CANNOT act as a hydrogen bond donor?",
        options: ["HF", "H₂O", "CH₃OCH₃", "NH₃"],
        answer: "CH₃OCH₃",
        explanation: "A hydrogen bond donor must have a hydrogen atom bonded to a highly electronegative atom (N, O, or F). <br>HF, H₂O, and NH₃ all have hydrogen atoms bonded to F, O, and N respectively, making them hydrogen bond donors. <br>CH₃OCH₃ (dimethyl ether) does not have a hydrogen atom directly bonded to the oxygen atom. The hydrogens are bonded to carbon, so it can only act as a hydrogen bond acceptor through the lone pairs on the oxygen atom."
        },
        {
        question: "Which of the following is a hydrogen bond acceptor but NOT a hydrogen bond donor?",
        options: ["H₂O", "NH₃", "HF", "Diethyl ether (CH₃CH₂OCH₂CH₃)"],
        answer: "Diethyl ether (CH₃CH₂OCH₂CH₃)",
        explanation: "A hydrogen bond acceptor must have a lone pair on a highly electronegative atom (N, O, or F). A hydrogen bond donor must have a hydrogen atom bonded to a highly electronegative atom (N, O, or F). <br>H₂O, NH₃, and HF all have hydrogen atoms bonded to electronegative atoms and lone pairs on electronegative atoms, so they are both hydrogen bond donors and acceptors. <br>Diethyl ether has an oxygen atom with lone pairs but no hydrogen atoms bonded to the oxygen atom, so it is only a hydrogen bond acceptor."
        },
        {
        question: "Which of the following affects the strength of a hydrogen bond?",
        options: ["The distance between the donor and acceptor atoms", "The angle between the donor, hydrogen, and acceptor atoms", "The electronegativity of the donor and acceptor atoms", "All of the above"],
        answer: "All of the above",
        explanation: "The strength of a hydrogen bond is influenced by several factors: <br><b>Distance:</b> Shorter distances between the donor and acceptor atoms lead to stronger interactions. <br><b>Angle:</b> A linear arrangement (180°) between the donor, hydrogen, and acceptor atoms maximizes the electrostatic interaction and results in a stronger hydrogen bond. Deviations from linearity weaken the bond. <br><b>Electronegativity:</b> Higher electronegativity of the donor and acceptor atoms increases the polarity of the bond and strengthens the hydrogen bond."
        },
        {
        question: "Which of the following functional groups is MOST likely to participate in strong hydrogen bonding?",
        options: ["-CH₃", "-SH", "-OH", "-Cl"],
        answer: "-OH",
        explanation: "The -OH (hydroxyl) group is highly polar and capable of both donating and accepting hydrogen bonds. <br>The electronegativity difference between oxygen and hydrogen is significant, leading to a strong dipole moment. <br>-CH₃ (methyl) is nonpolar and does not participate in hydrogen bonding. <br>-SH (thiol) can participate in hydrogen bonding, but sulfur is less electronegative than oxygen, resulting in weaker hydrogen bonds. <br>-Cl (chloride) can act as a hydrogen bond acceptor, but the hydrogen bonds are typically weaker than those involving oxygen or nitrogen."
        },
        {
        question: "In proteins, hydrogen bonds are crucial for:",
        options: ["Primary structure", "Secondary structure", "Tertiary structure", "All of the above"],
        answer: "All of the above",
        explanation: "Hydrogen bonds play a crucial role in all levels of protein structure: <br><b>Primary structure:</b> Although peptide bonds are the main force, hydrogen bonds contribute to the specific arrangement of amino acids. <br><b>Secondary structure:</b> Hydrogen bonds between the carbonyl oxygen and amide hydrogen atoms in the polypeptide backbone stabilize structures like alpha-helices and beta-sheets. <br><b>Tertiary structure:</b> Hydrogen bonds between side chains of amino acids contribute to the overall three-dimensional folding of the protein."
        },
        {
        question: "Which of the following solvents is most likely to disrupt hydrogen bonding between solute molecules?",
        options: ["Hexane (C₆H₁₄)", "Benzene (C₆H₆)", "Ethanol (CH₃CH₂OH)", "Carbon tetrachloride (CCl₄)"],
        answer: "Ethanol (CH₃CH₂OH)",
        explanation: "Solvents that can form hydrogen bonds themselves are effective at disrupting hydrogen bonds between solute molecules. <br>Ethanol (CH₃CH₂OH) has a hydroxyl group (-OH) and can participate in hydrogen bonding with both the donor and acceptor sites of the solute molecules, effectively competing with the solute-solute hydrogen bonds. <br>Hexane (C₆H₁₄), Benzene (C₆H₆) and Carbon tetrachloride (CCl₄) are nonpolar solvents and cannot form hydrogen bonds, so they are less effective at disrupting hydrogen bonding between solute molecules."
        },
        {
        question: "Which of the following molecules is capable of intramolecular hydrogen bonding?",
        options: ["Ethanol", "Water", "o-Nitrophenol", "Methane"],
        answer: "o-Nitrophenol",
        explanation: "Intramolecular hydrogen bonding occurs when a hydrogen bond forms between atoms within the same molecule. <br><i>o</i>-Nitrophenol has a hydroxyl group (-OH) and a nitro group (-NO₂) positioned close enough to each other on the benzene ring to allow for a hydrogen bond to form between the hydrogen of the -OH group and an oxygen of the -NO₂ group. <br>Ethanol and water exhibit intermolecular hydrogen bonding. Methane does not exhibit hydrogen bonding."
        },
        {
        question: "Which of the following interactions is most important for the structure of alpha-helices in proteins?",
        options: ["Hydrophobic interactions", "Ionic bonds", "Van der Waals forces", "Hydrogen bonds"],
        answer: "Hydrogen bonds",
        explanation: "Alpha-helices are stabilized primarily by hydrogen bonds. These hydrogen bonds form between the carbonyl oxygen of one amino acid residue and the amide hydrogen of another amino acid residue four residues down the chain. <br>Hydrophobic interactions, ionic bonds, and Van der Waals forces contribute to protein structure, especially tertiary structure, but are not the primary stabilizing force in alpha-helices."
        },
        {
        question: "What is the effect of hydrogen bonding on the viscosity of a liquid?",
        options: ["Decreases viscosity", "Increases viscosity", "Has no effect on viscosity", "Only affects viscosity at high temperatures"],
        answer: "Increases viscosity",
        explanation: "Viscosity is a measure of a liquid's resistance to flow. <br>Hydrogen bonding increases the intermolecular forces between molecules, making it more difficult for them to move past each other. <br>This increased resistance to flow results in a higher viscosity."
        },
        {
        question: "Which of the following alcohols would have the highest boiling point?",
        options: ["Methanol (CH₃OH)", "Ethanol (CH₃CH₂OH)", "Propanol (CH₃CH₂CH₂OH)", "Butanol (CH₃CH₂CH₂CH₂OH)"],
        answer: "Butanol (CH₃CH₂CH₂CH₂OH)",
        explanation: "Boiling point increases with increasing molar mass and increasing strength of intermolecular forces. <br>All the given alcohols can form hydrogen bonds. <br>As the carbon chain length increases (from methanol to butanol), the molar mass increases, and the London dispersion forces become stronger. <br>Therefore, butanol, with the longest carbon chain and the highest molar mass, will have the highest boiling point due to the combined effects of hydrogen bonding and stronger London dispersion forces."
        },
        {
        question: "Which of the following statements best describes the nature of hydrogen bonding?",
        options: ["A strong covalent bond between hydrogen and a highly electronegative atom.", "A weak ionic bond between hydrogen and a highly electronegative atom.", "An electrostatic attraction between a hydrogen atom bonded to a highly electronegative atom and a lone pair of electrons on another electronegative atom.", "A temporary dipole-induced dipole interaction."],
        answer: "An electrostatic attraction between a hydrogen atom bonded to a highly electronegative atom and a lone pair of electrons on another electronegative atom.",
        explanation: "Hydrogen bonding is an electrostatic attraction, not a covalent or ionic bond. <br>It occurs when a hydrogen atom bonded to a highly electronegative atom (such as O, N, or F) experiences a strong attraction to a lone pair of electrons on another electronegative atom in a different molecule or in a different part of the same molecule. <br>It's stronger than temporary dipole-induced dipole interactions (London dispersion forces) but weaker than covalent or ionic bonds."
        },
        {
        question: "Which of the following factors does NOT contribute to the strength of hydrogen bonds?",
        options: ["Electronegativity of the participating atoms", "Distance between the atoms", "Geometry of the bond", "Polarizability of the participating atoms"],
        answer: "Polarizability of the participating atoms",
        explanation: "While polarizability is important for van der Waals forces, electronegativity, distance, and bond geometry are the most significant contributors to the strength of hydrogen bonds. Higher electronegativity difference leads to stronger dipoles and stronger attraction. The closer the atoms and the more linear the bond, the stronger the interaction. Polarizability is related to the ease with which electron clouds are distorted, influencing dispersion forces more than hydrogen bonds."
        },
        {
        question: "Which of the following is an example of hydrogen bonding playing a crucial role in biological systems?",
        options: ["The reaction of an acid with a base.", "The formation of a metallic bond.", "The base pairing in DNA.", "The dissolution of NaCl in water."],
        answer: "The base pairing in DNA.",
        explanation: "Hydrogen bonding is essential for the specific base pairing in DNA (adenine with thymine, guanine with cytosine). These hydrogen bonds hold the two strands of the double helix together, allowing for accurate replication and transcription of genetic information. Acid-base reactions involve proton transfer. Metallic bonds involve the sharing of electrons in a metal lattice. Dissolution of NaCl involves ion-dipole interactions."
        },
        {
        question: "Which molecule can form the most hydrogen bonds with water?",
        options: ["Methane (CH₄)", "Ethanol (CH₃CH₂OH)", "Diethyl ether (CH₃CH₂OCH₂CH₃)", "Ethane (C₂H₆)"],
        answer: "Ethanol (CH₃CH₂OH)",
        explanation: "To form the most hydrogen bonds with water, a molecule needs to be both a good hydrogen bond donor and a good hydrogen bond acceptor. Ethanol can donate a hydrogen bond through its -OH group and accept hydrogen bonds through the oxygen atom. Diethyl ether can only accept hydrogen bonds through its oxygen atom. Methane and ethane are nonpolar and cannot participate in hydrogen bonding. Therefore, ethanol can form the most hydrogen bonds with water compared to the other options."
        },
        {
        question: "What is the impact of hydrogen bonding on the surface tension of water?",
        options: ["It decreases surface tension.", "It increases surface tension.", "It has no effect on surface tension.", "It only affects surface tension at very low temperatures."],
        answer: "It increases surface tension.",
        explanation: "Surface tension is the tendency of liquid surfaces to minimize their area. <br>Water molecules at the surface experience a net inward pull due to the cohesive forces (hydrogen bonding) between them. <br>This inward pull increases the surface tension, making it more difficult to break the surface."
        },
        {
        question: "Which of the following requires breaking hydrogen bonds?",
        options: ["Condensing water vapor into liquid water", "Melting ice into liquid water", "Freezing liquid water into ice", "Sublimation of dry ice (solid CO₂)"],
        answer: "Melting ice into liquid water",
        explanation: "Melting ice requires energy to overcome the hydrogen bonds holding the water molecules in the rigid crystal lattice of ice. Condensing water vapor forms hydrogen bonds. Freezing water forms more hydrogen bonds, releasing energy. Sublimation of dry ice (solid CO₂) involves overcoming intermolecular forces (London dispersion forces) between CO₂ molecules, not hydrogen bonds."
        },
        {
        question: "Arrange the following compounds in increasing order of boiling point: CH₄, H₂O, H₂S",
        options: ["H₂O < H₂S < CH₄", "CH₄ < H₂S < H₂O", "H₂S < CH₄ < H₂O", "CH₄ < H₂O < H₂S"],
        answer: "CH₄ < H₂S < H₂O",
        explanation: "Boiling point depends on the strength of intermolecular forces. CH₄ has only London dispersion forces (weakest). H₂S has dipole-dipole interactions and London dispersion forces. H₂O has hydrogen bonds (strongest), dipole-dipole interactions, and London dispersion forces. Therefore, the boiling point order is CH₄ < H₂S < H₂O."
        },
        {
        question: "Consider a mixture of ethanol (CH₃CH₂OH) and water. Which type of intermolecular force would be present?",
        options: ["London dispersion forces only", "Dipole-dipole interactions only", "Hydrogen bonding only", "London dispersion forces, dipole-dipole interactions, and hydrogen bonding"],
        answer: "London dispersion forces, dipole-dipole interactions, and hydrogen bonding",
        explanation: "Ethanol and water are polar molecules. All molecules exhibit London dispersion forces. Since both ethanol and water are polar, they will have dipole-dipole interactions. Due to the presence of -OH group in both molecules, hydrogen bonding will occur. Therefore, all these forces will be present."
        },
        {
        question: "Which of the following molecules has the highest potential for hydrogen bonding with itself?",
        options: ["CH₃Cl", "CH₃OCH₃", "CH₃COOH", "CH₃CH₂CH₃"],
        answer: "CH₃COOH",
        explanation: "The potential for hydrogen bonding depends on the presence of both a hydrogen bond donor (H bonded to O, N, or F) and a hydrogen bond acceptor (lone pair on O, N, or F). <br>CH₃COOH (acetic acid) has both a hydroxyl group (-OH) that can donate a hydrogen bond and a carbonyl oxygen (C=O) that can accept a hydrogen bond. It can even form a dimer with itself through two hydrogen bonds. CH₃Cl has dipole-dipole interactions but no hydrogen bonding. CH₃OCH₃ can only act as a hydrogen bond acceptor. CH₃CH₂CH₃ is nonpolar and exhibits only London dispersion forces."
        },
        {
        question: "Why does hydrogen fluoride (HF) have a higher boiling point than hydrogen chloride (HCl) despite fluorine being smaller than chlorine?",
        options: ["HCl has stronger dipole-dipole interactions", "HF exhibits hydrogen bonding, which is stronger than the dipole-dipole interactions in HCl", "The molar mass of HF is greater than HCl", "HCl is more polar than HF"],
        answer: "HF exhibits hydrogen bonding, which is stronger than the dipole-dipole interactions in HCl",
        explanation: "While both HF and HCl are polar molecules, HF exhibits hydrogen bonding due to the high electronegativity of fluorine. <br>Hydrogen bonding is a stronger intermolecular force than the dipole-dipole interactions present in HCl. <br>The hydrogen bonding in HF leads to stronger intermolecular attractions and a higher boiling point, even though HCl has a larger molar mass (which would generally increase the boiling point due to increased London dispersion forces)."
        },
    ],
    
"EXAM005": [
    { question: "What type of bond is formed when electrons are shared between atoms?", options: ["Covalent bond", "Ionic bond", "Metallic bond", "Hydrogen bond"], answer: "Covalent bond", explanation: "Covalent bonds are formed when atoms share pairs of electrons to achieve stability, typically between nonmetals." },
    { question: "What is the bond angle in a tetrahedral molecule like CH₄?", options: ["90°", "109.5°", "120°", "180°"], answer: "109.5°", explanation: "In a tetrahedral molecule, the bond angles are 109.5° due to the symmetrical arrangement of bonds around the central atom." },
    { question: "Which type of bond involves the transfer of electrons from one atom to another?", options: ["Ionic bond", "Covalent bond", "Metallic bond", "Van der Waals bond"], answer: "Ionic bond", explanation: "Ionic bonds occur when electrons are transferred from a metal to a nonmetal, forming positively and negatively charged ions." },
    { question: "What is the hybridization of carbon in ethene (C₂H₄)?", options: ["sp", "sp²", "sp³", "sp³d"], answer: "sp²", explanation: "In ethene, the carbon atoms are sp² hybridized, forming a planar structure with 120° bond angles." },
    { question: "Which intermolecular force is the weakest?", options: ["Dipole-dipole", "Hydrogen bonding", "Van der Waals forces", "Ionic interactions"], answer: "Van der Waals forces", explanation: "Van der Waals forces, or London dispersion forces, are the weakest intermolecular forces caused by temporary dipoles." },
    { question: "What is the shape of a molecule with two bonding pairs and two lone pairs, like H₂O?", options: ["Linear", "Tetrahedral", "Bent", "Trigonal planar"], answer: "Bent", explanation: "The water molecule (H₂O) has a bent shape due to the repulsion between the two lone pairs on the oxygen atom." },
    { question: "Which type of bond is present in NaCl?", options: ["Ionic bond", "Covalent bond", "Metallic bond", "Hydrogen bond"], answer: "Ionic bond", explanation: "NaCl is formed by ionic bonding, where sodium loses an electron to chlorine, creating oppositely charged ions." },
    { question: "What is the bond angle in a linear molecule like CO₂?", options: ["90°", "109.5°", "120°", "180°"], answer: "180°", explanation: "CO₂ has a linear structure with bond angles of 180° due to the arrangement of two double bonds around the central carbon atom." },
    { question: "Which type of bond involves a sea of delocalized electrons?", options: ["Metallic bond", "Covalent bond", "Ionic bond", "Hydrogen bond"], answer: "Metallic bond", explanation: "Metallic bonds consist of a lattice of positive ions surrounded by a sea of delocalized electrons, which allows metals to conduct electricity." },
    { question: "What is the hybridization of the central atom in SF₆?", options: ["sp³", "sp²", "sp³d", "sp³d²"], answer: "sp³d²", explanation: "In SF₆, sulfur undergoes sp³d² hybridization to form six equivalent bonds in an octahedral geometry." },
    { question: "Which type of intermolecular force is responsible for the high boiling point of water?", options: ["Hydrogen bonding", "Van der Waals forces", "Dipole-dipole interactions", "Ionic interactions"], answer: "Hydrogen bonding", explanation: "Hydrogen bonding between water molecules leads to strong intermolecular forces, resulting in a high boiling point." },
    { question: "What is the molecular geometry of NH₃?", options: ["Trigonal planar", "Tetrahedral", "Pyramidal", "Linear"], answer: "Pyramidal", explanation: "Ammonia (NH₃) has a pyramidal geometry due to the presence of one lone pair on the nitrogen atom." },
    { question: "Which type of bond is formed between hydrogen and oxygen in a water molecule?", options: ["Covalent bond", "Ionic bond", "Metallic bond", "Hydrogen bond"], answer: "Covalent bond", explanation: "Within a water molecule, hydrogen and oxygen are bonded covalently by sharing electrons." },
    { question: "What is the bond angle in a trigonal planar molecule like BF₃?", options: ["90°", "109.5°", "120°", "180°"], answer: "120°", explanation: "A trigonal planar molecule like BF₃ has bond angles of 120° due to the arrangement of three bonding pairs around the central atom." },
    { question: "Which type of hybridization leads to a linear molecular geometry?", options: ["sp", "sp²", "sp³", "sp³d"], answer: "sp", explanation: "Linear geometry is associated with sp hybridization, where two orbitals form bonds at 180° angles." },
    { question: "What is the bond order of the N≡N bond in nitrogen gas (N₂)?", options: ["1", "2", "3", "0"], answer: "3", explanation: "The bond order of N₂ is 3, indicating a triple bond formed by the sharing of three pairs of electrons." },
    { question: "Which type of bond involves the sharing of a pair of electrons between two atoms?", options: ["Single covalent bond", "Double covalent bond", "Triple covalent bond", "Hydrogen bond"], answer: "Single covalent bond", explanation: "A single covalent bond involves the sharing of one pair of electrons between two atoms." },
    { question: "What is the geometry of a molecule with four bonding pairs and no lone pairs, like CH₄?", options: ["Linear", "Tetrahedral", "Trigonal planar", "Bent"], answer: "Tetrahedral", explanation: "Methane (CH₄) has a tetrahedral geometry with bond angles of 109.5° due to the symmetrical arrangement of four bonding pairs." },
    { question: "Which type of intermolecular force exists between nonpolar molecules?", options: ["Van der Waals forces", "Dipole-dipole interactions", "Hydrogen bonding", "Ionic interactions"], answer: "Van der Waals forces", explanation: "Van der Waals forces, also known as London dispersion forces, occur between nonpolar molecules due to temporary dipoles." },
    { question: "What is the hybridization of the central atom in PCl₅?", options: ["sp³", "sp²", "sp³d", "sp³d²"], answer: "sp³d", explanation: "In PCl₅, phosphorus undergoes sp³d hybridization to form five equivalent bonds in a trigonal bipyramidal geometry." },
    { question: "Which type of bond is formed by the overlap of parallel p orbitals?", options: ["Sigma bond", "Pi bond", "Ionic bond", "Hydrogen bond"], answer: "Pi bond", explanation: "Pi bonds are formed by the sideways overlap of parallel p orbitals, typically found in double and triple bonds." },
    { question: "What is the bond angle in a trigonal bipyramidal molecule like PCl₅?", options: ["90° and 120°", "109.5°", "180°", "120°"], answer: "90° and 120°", explanation: "Trigonal bipyramidal molecules have bond angles of 90° between axial and equatorial bonds and 120° between equatorial bonds." },
    { question: "Which type of intermolecular force exists between polar molecules?", options: ["Dipole-dipole interactions", "Van der Waals forces", "Hydrogen bonding", "Metallic bonding"], answer: "Dipole-dipole interactions", explanation: "Dipole-dipole interactions occur between molecules with permanent dipoles due to the unequal sharing of electrons." },
    { question: "What is the molecular geometry of SF₄?", options: ["Tetrahedral", "Trigonal bipyramidal", "See-saw", "Octahedral"], answer: "See-saw", explanation: "SF₄ has a see-saw molecular geometry because the central sulfur atom has one lone pair and four bonding pairs." },
    { question: "Which molecule is nonpolar despite having polar bonds?", options: ["CO₂", "H₂O", "NH₃", "CH₃Cl"], answer: "CO₂", explanation: "CO₂ is nonpolar because the polar bonds are arranged linearly, causing the dipole moments to cancel each other out." },
    { question: "What is the hybridization of carbon in ethyne (C₂H₂)?", options: ["sp", "sp²", "sp³", "sp³d"], answer: "sp", explanation: "In ethyne, the carbon atoms are sp hybridized, forming a linear structure with triple bonds." },
    { question: "Which type of bond is the strongest?", options: ["Hydrogen bond", "Covalent bond", "Ionic bond", "Van der Waals forces"], answer: "Covalent bond", explanation: "Covalent bonds are the strongest because they involve the sharing of electrons, creating a strong interaction between atoms." },
    { question: "What is the bond order of O₂ in its ground state?", options: ["1", "2", "3", "0"], answer: "2", explanation: "The bond order of O₂ is 2, indicating a double bond between the two oxygen atoms." },
    { question: "Which type of hybridization leads to a square planar geometry?", options: ["sp³d²", "sp³", "sp²", "sp³d"], answer: "sp³d²", explanation: "Square planar geometry is associated with sp³d² hybridization, often seen in transition metal complexes." },
    { question: "Which type of bond is present in a molecule of H₂?", options: ["Sigma bond", "Pi bond", "Ionic bond", "Hydrogen bond"], answer: "Sigma bond", explanation: "In H₂, a sigma bond is formed by the head-on overlap of two s orbitals." },
    { question: "What is the geometry of a molecule with three bonding pairs and one lone pair, like NH₃?", options: ["Tetrahedral", "Trigonal pyramidal", "Bent", "Linear"], answer: "Trigonal pyramidal", explanation: "NH₃ has a trigonal pyramidal geometry due to the presence of one lone pair on the nitrogen atom." },
    { question: "Which type of bond is formed when atoms share three pairs of electrons?", options: ["Single bond", "Double bond", "Triple bond", "Hydrogen bond"], answer: "Triple bond", explanation: "A triple bond involves the sharing of three pairs of electrons between two atoms, resulting in a very strong bond." },
    { question: "What is the hybridization of the central atom in XeF₄?", options: ["sp³", "sp³d", "sp³d²", "sp²"], answer: "sp³d²", explanation: "In XeF₄, xenon undergoes sp³d² hybridization to form a square planar geometry." },
    { question: "Which type of intermolecular force is present in noble gases?", options: ["Dipole-dipole interactions", "Van der Waals forces", "Hydrogen bonding", "Ionic interactions"], answer: "Van der Waals forces", explanation: "Noble gases exhibit Van der Waals forces, which are the weakest type of intermolecular force caused by temporary dipoles." },
    { question: "What is the bond angle in a bent molecule like SO₂?", options: ["104.5°", "109.5°", "120°", "180°"], answer: "120°", explanation: "SO₂ has a bond angle of approximately 120° due to the presence of one lone pair on the central sulfur atom." },
    { question: "Which type of hybridization is found in the carbon atoms of benzene (C₆H₆)?", options: ["sp", "sp²", "sp³", "sp³d"], answer: "sp²", explanation: "In benzene, each carbon atom is sp² hybridized, forming a planar hexagonal ring with delocalized π electrons." },
    { question: "Which type of bond is responsible for the unique properties of water?", options: ["Ionic bond", "Covalent bond", "Hydrogen bond", "Metallic bond"], answer: "Hydrogen bond", explanation: "Hydrogen bonds between water molecules are responsible for water's high boiling point, surface tension, and other unique properties." },
    { question: "What is the molecular geometry of a molecule with five bonding pairs and no lone pairs, like PCl₅?", options: ["Trigonal planar", "Tetrahedral", "Trigonal bipyramidal", "Octahedral"], answer: "Trigonal bipyramidal", explanation: "PCl₅ has a trigonal bipyramidal geometry due to the arrangement of five bonding pairs around the central phosphorus atom." },
    { question: "Which type of bond is formed between two atoms with a large difference in electronegativity?", options: ["Covalent bond", "Ionic bond", "Metallic bond", "Hydrogen bond"], answer: "Ionic bond", explanation: "Ionic bonds form between atoms with a large difference in electronegativity, resulting in the transfer of electrons from one atom to another." },
    { question: "What is the bond order of NO in its ground state?", options: ["1.5", "2", "2.5", "3"], answer: "2.5", explanation: "The bond order of NO is 2.5, indicating a bond that is stronger than a double bond but not quite a triple bond, due to the presence of unpaired electrons." },
    { question: "What does VSEPR stand for?", options: ["Valence Shell Electron Pair Repulsion", "Variable Shell Electron Pair Repulsion", "Valence Shell Electron Pair Rotation", "Valence Shell Energy Pair Repulsion"], answer: "Valence Shell Electron Pair Repulsion", explanation: "VSEPR stands for Valence Shell Electron Pair Repulsion, a model used to predict the geometry of molecules based on electron pair repulsion." },
    { question: "According to VSEPR theory, what determines the shape of a molecule?", options: ["Number of valence electrons", "Repulsion between electron pairs", "Bond strength", "Atomic size"], answer: "Repulsion between electron pairs", explanation: "The shape of a molecule is determined by the repulsion between electron pairs in the valence shell of the central atom." },
    { question: "What is the molecular geometry of a molecule with two bonding pairs and no lone pairs?", options: ["Linear", "Bent", "Trigonal planar", "Tetrahedral"], answer: "Linear", explanation: "A molecule with two bonding pairs and no lone pairs, like CO₂, has a linear geometry with bond angles of 180°." },
    { question: "What is the molecular geometry of a molecule with three bonding pairs and no lone pairs?", options: ["Linear", "Trigonal planar", "Tetrahedral", "Bent"], answer: "Trigonal planar", explanation: "A molecule with three bonding pairs and no lone pairs, like BF₃, has a trigonal planar geometry with bond angles of 120°." },
    { question: "What is the molecular geometry of a molecule with four bonding pairs and no lone pairs?", options: ["Linear", "Trigonal planar", "Tetrahedral", "Bent"], answer: "Tetrahedral", explanation: "A molecule with four bonding pairs and no lone pairs, like CH₄, has a tetrahedral geometry with bond angles of 109.5°." },
    { question: "What is the molecular geometry of a molecule with three bonding pairs and one lone pair?", options: ["Trigonal planar", "Trigonal pyramidal", "Bent", "Linear"], answer: "Trigonal pyramidal", explanation: "A molecule with three bonding pairs and one lone pair, like NH₃, has a trigonal pyramidal geometry due to lone pair repulsion." },
    { question: "What is the molecular geometry of a molecule with two bonding pairs and two lone pairs?", options: ["Linear", "Trigonal planar", "Bent", "Tetrahedral"], answer: "Bent", explanation: "A molecule with two bonding pairs and two lone pairs, like H₂O, has a bent geometry with bond angles of approximately 104.5°." }, 
    { question: "What is the molecular geometry of a molecule with five bonding pairs and no lone pairs?", options: ["Trigonal bipyramidal", "Octahedral", "Tetrahedral", "Linear"], answer: "Trigonal bipyramidal", explanation: "A molecule with five bonding pairs and no lone pairs, like PCl₅, has a trigonal bipyramidal geometry with bond angles of 90° and 120°." },
    { question: "What is the molecular geometry of a molecule with four bonding pairs and one lone pair?", options: ["Trigonal bipyramidal", "See-saw", "Octahedral", "Tetrahedral"], answer: "See-saw", explanation: "A molecule with four bonding pairs and one lone pair, like SF₄, has a see-saw geometry due to lone pair repulsion." },
    { question: "What is the molecular geometry of a molecule with three bonding pairs and two lone pairs?", options: ["T-shaped", "Linear", "Bent", "Trigonal planar"], answer: "T-shaped", explanation: "A molecule with three bonding pairs and two lone pairs, like ClF₃, has a T-shaped geometry due to lone pair repulsion." },
    { question: "What is the molecular geometry of a molecule with two bonding pairs and three lone pairs?", options: ["Linear", "Bent", "Trigonal planar", "Octahedral"], answer: "Linear", explanation: "A molecule with two bonding pairs and three lone pairs, like XeF₂, has a linear geometry with bond angles of 180°." },
    { question: "What is the molecular geometry of a molecule with six bonding pairs and no lone pairs?", options: ["Octahedral", "Trigonal bipyramidal", "Tetrahedral", "Linear"], answer: "Octahedral", explanation: "A molecule with six bonding pairs and no lone pairs, like SF₆, has an octahedral geometry with bond angles of 90°." },
    { question: "What is the molecular geometry of a molecule with five bonding pairs and one lone pair?", options: ["Square pyramidal", "Trigonal bipyramidal", "Octahedral", "See-saw"], answer: "Square pyramidal", explanation: "A molecule with five bonding pairs and one lone pair, like BrF₅, has a square pyramidal geometry due to lone pair repulsion." },
    { question: "What is the molecular geometry of a molecule with four bonding pairs and two lone pairs?", options: ["Square planar", "Octahedral", "Trigonal bipyramidal", "Tetrahedral"], answer: "Square planar", explanation: "A molecule with four bonding pairs and two lone pairs, like XeF₄, has a square planar geometry due to symmetrical lone pair arrangement." },
    { question: "What is the bond angle in a tetrahedral molecule?", options: ["90°", "109.5°", "120°", "180°"], answer: "109.5°", explanation: "In a tetrahedral molecule, the bond angles are 109.5° due to the symmetrical arrangement of four bonding pairs." },
    { question: "What is the bond angle in a linear molecule?", options: ["90°", "109.5°", "120°", "180°"], answer: "180°", explanation: "In a linear molecule, the bond angles are 180° due to the arrangement of two bonding pairs in opposite directions." },
    { question: "What is the bond angle in a trigonal planar molecule?", options: ["90°", "109.5°", "120°", "180°"], answer: "120°", explanation: "In a trigonal planar molecule, the bond angles are 120° due to the symmetrical arrangement of three bonding pairs." },
    { question: "What is the bond angle in an octahedral molecule?", options: ["90°", "109.5°", "120°", "180°"], answer: "90°", explanation: "In an octahedral molecule, the bond angles are 90° due to the symmetrical arrangement of six bonding pairs." },
    { question: "What is the molecular geometry of methane (CH₄)?", options: ["Linear", "Bent", "Trigonal planar", "Tetrahedral"], answer: "Tetrahedral", explanation: "Methane (CH₄) has a tetrahedral geometry with bond angles of 109.5° due to the symmetrical arrangement of bonding pairs." },
    
    { 
        question: "Which of the following molecules exhibits dative covalent bonding?", 
        options: ["H₂O", "NH₃", "CO₂", "NH₄⁺"], 
        answer: "NH₄⁺", 
        explanation: "In NH₄⁺, the nitrogen atom donates a lone pair to form a bond with an H⁺ ion, creating a dative covalent bond.<br><br><strong>'H₂O'</strong>: Incorrect, H₂O has regular covalent bonds with shared electrons.<br><strong>'NH₃'</strong>: Incorrect, NH₃ has regular covalent bonds and lone pairs.<br><strong>'CO₂'</strong>: Incorrect, CO₂ has double bonds but no dative covalent bonds." 
    },
    { 
        question: "Which type of bonding explains the high melting points of metallic substances?", 
        options: ["Ionic bonding", "Covalent bonding", "Metallic bonding", "Hydrogen bonding"], 
        answer: "Metallic bonding", 
        explanation: "Metallic bonding involves a lattice of positive ions surrounded by delocalized electrons, which accounts for high melting points.<br><br><strong>'Ionic bonding'</strong>: Incorrect, while ionic compounds also have high melting points, metallic bonding specifically applies to metals.<br><strong>'Covalent bonding'</strong>: Incorrect, covalent bonds do not typically result in high melting points.<br><strong>'Hydrogen bonding'</strong>: Incorrect, hydrogen bonding is an intermolecular force and does not apply to metallic substances." 
    },
    { 
        question: "Which of the following compounds has a trigonal bipyramidal geometry?", 
        options: ["CH₄", "SF₆", "PCl₅", "BF₃"], 
        answer: "PCl₅", 
        explanation: "PCl₅ has a trigonal bipyramidal geometry due to sp³d hybridization.<br><br><strong>'CH₄'</strong>: Incorrect, CH₄ has a tetrahedral geometry.<br><strong>'SF₆'</strong>: Incorrect, SF₆ has an octahedral geometry.<br><strong>'BF₃'</strong>: Incorrect, BF₃ has a trigonal planar geometry." 
    },
    { 
        question: "Which type of bond is formed by the overlap of atomic orbitals?", 
        options: ["Ionic bond", "Covalent bond", "Metallic bond", "Hydrogen bond"], 
        answer: "Covalent bond",
        explanation: "Covalent bonds are formed by the overlap of atomic orbitals, allowing electrons to be shared between atoms.<br><br><strong>'Ionic bond'</strong>: Incorrect, ionic bonds involve the transfer of electrons.<br><strong>'Metallic bond'</strong>: Incorrect, metallic bonds involve delocalized electrons.<br><strong>'Hydrogen bond'</strong>: Incorrect, hydrogen bonding is an intermolecular force." 
    },
    { 
        question: "Which of the following compounds exhibits resonance?", 
        options: ["CH₄", "C₆H₆", "NaCl", "H₂"], 
        answer: "C₆H₆", 
        explanation: "C₆H₆ (benzene) exhibits resonance due to the delocalization of π-electrons in its ring structure.<br><br><strong>'CH₄'</strong>: Incorrect, methane has single bonds and no delocalized electrons.<br><strong>'NaCl'</strong>: Incorrect, NaCl is an ionic compound without covalent bonds or resonance.<br><strong>'H₂'</strong>: Incorrect, hydrogen has a single covalent bond with no resonance structures." 
    },
    { 
        question: "Which of the following best explains the concept of hybridization?", 
        options: ["Transfer of electrons between atoms", "Mixing of atomic orbitals to form new hybrid orbitals", "Formation of ionic bonds", "Delocalization of electrons"], 
        answer: "Mixing of atomic orbitals to form new hybrid orbitals", 
        explanation: "Hybridization involves the mixing of atomic orbitals to form new hybrid orbitals with equal energy.<br><br><strong>'Transfer of electrons between atoms'</strong>: Incorrect, this describes ionic bonding.<br><strong>'Formation of ionic bonds'</strong>: Incorrect, ionic bonds do not involve hybridization.<br><strong>'Delocalization of electrons'</strong>: Incorrect, delocalization occurs in metallic bonding and resonance structures, not hybridization." 
    },
    { 
        question: "Which type of bond involves the sharing of electrons between two atoms?", 
        options: ["Ionic bond", "Covalent bond", "Metallic bond", "Hydrogen bond"], 
        answer: "Covalent bond", 
        explanation: "Covalent bonds involve the sharing of electrons between atoms, typically between nonmetals.<br><br><strong>'Ionic bond'</strong>: Incorrect, ionic bonds involve the transfer of electrons.<br><strong>'Metallic bond'</strong>: Incorrect, metallic bonds involve delocalized electrons.<br><strong>'Hydrogen bond'</strong>: Incorrect, hydrogen bonding is an intermolecular force." 
    },
    { 
        question: "Which of the following molecules has a square planar geometry?", 
        options: ["CH₄", "SF₄", "XeF₄", "BF₃"], 
        answer: "XeF₄", 
        explanation: "XeF₄ has a square planar geometry due to sp³d² hybridization with lone pairs on xenon.<br><br><strong>'CH₄'</strong>: Incorrect, CH₄ has a tetrahedral geometry.<br><strong>'SF₄'</strong>: Incorrect, SF₄ has a see-saw geometry.<br><strong>'BF₃'</strong>: Incorrect, BF₃ has a trigonal planar geometry." 
    },
    { 
        question: "Which type of bond is formed when one atom donates both electrons in a bond?", 
        options: ["Ionic bond", "Covalent bond", "Metallic bond", "Coordinate bond"], 
        answer: "Coordinate bond", 
        explanation: "A coordinate bond, or dative covalent bond, is formed when one atom donates both electrons to form a bond.<br><br><strong>'Ionic bond'</strong>: Incorrect, ionic bonds involve the transfer of electrons.<br><strong>'Covalent bond'</strong>: Incorrect, covalent bonds involve the sharing of electrons.<br><strong>'Metallic bond'</strong>: Incorrect, metallic bonds involve delocalized electrons." 
    },
    { 
        question: "Which of the following explains the high electrical conductivity of metals?", 
        options: ["Strong covalent bonds", "Presence of ionic bonds", "Delocalized electrons", "Hydrogen bonding"], 
        answer: "Delocalized electrons", 
        explanation: "Metals have high electrical conductivity due to the presence of delocalized electrons that can move freely.<br><br><strong>'Strong covalent bonds'</strong>: Incorrect, covalent bonds do not typically result in high conductivity.<br><strong>'Presence of ionic bonds'</strong>: Incorrect, ionic compounds conduct electricity only when molten or dissolved.<br><strong>'Hydrogen bonding'</strong>: Incorrect, hydrogen bonding is an intermolecular force and does not apply to metals." 
    },
    { 
        question: "Which of the following explains why metallic bonds allow metals to be malleable?", 
        options: ["Presence of covalent bonds between atoms", "Presence of ionic bonds between atoms", "Delocalized electrons allow layers to slide", "Strong intermolecular forces"], 
        answer: "Delocalized electrons allow layers to slide", 
        explanation: "In metallic bonding, delocalized electrons act as a 'glue' that holds metal ions together, allowing layers to slide without breaking bonds.<br><br><strong>'Presence of covalent bonds between atoms'</strong>: Incorrect, metals do not have covalent bonds.<br><strong>'Presence of ionic bonds between atoms'</strong>: Incorrect, ionic bonds are rigid and do not allow malleability.<br><strong>'Strong intermolecular forces'</strong>: Incorrect, metallic bonding involves intramolecular forces, not intermolecular forces." 
    },
    { 
        question: "Which of the following compounds has the highest lattice energy?", 
        options: ["NaCl", "MgO", "KCl", "LiF"], 
        answer: "MgO", 
        explanation: "MgO has the highest lattice energy due to the higher charge on Mg²⁺ and O²⁻ ions, and smaller ionic radii.<br><br><strong>'NaCl'</strong>: Incorrect, Na⁺ and Cl⁻ ions have lower charges and larger radii compared to MgO.<br><strong>'KCl'</strong>: Incorrect, K⁺ is larger than Na⁺, resulting in lower lattice energy.<br><strong>'LiF'</strong>: Incorrect, while Li⁺ and F⁻ are small, their charge is lower than Mg²⁺ and O²⁻." 
    },
    { 
        question: "Which of the following molecules has a bent geometry?", 
        options: ["CO₂", "CH₄", "H₂O", "BF₃"], 
        answer: "H₂O", 
        explanation: "H₂O has a bent geometry due to the repulsion between two lone pairs on oxygen.<br><br><strong>'CO₂'</strong>: Incorrect, CO₂ is linear due to the absence of lone pairs on the central atom.<br><strong>'CH₄'</strong>: Incorrect, CH₄ is tetrahedral with no lone pairs.<br><strong>'BF₃'</strong>: Incorrect, BF₃ is trigonal planar and has no lone pairs." 
    },
    { 
        question: "Which of the following molecules can form hydrogen bonds?", 
        options: ["CH₄", "NH₃", "CO₂", "CCl₄"], 
        answer: "NH₃", 
        explanation: "NH₃ can form hydrogen bonds because it has a highly electronegative nitrogen atom bonded to hydrogen.<br><br><strong>'CH₄'</strong>: Incorrect, CH₄ has no electronegative atoms to form hydrogen bonds.<br><strong>'CO₂'</strong>: Incorrect, CO₂ is linear and nonpolar, so it cannot form hydrogen bonds.<br><strong>'CCl₄'</strong>: Incorrect, CCl₄ is nonpolar and does not form hydrogen bonds." 
    },
    { 
        question: "Which of the following hybridizations is found in the central atom of SF₆?", 
        options: ["sp³", "sp³d", "sp³d²", "sp²"], 
        answer: "sp³d²", 
        explanation: "SF₆ has sp³d² hybridization, resulting in an octahedral geometry with bond angles of 90°.<br><br><strong>'sp³'</strong>: Incorrect, sp³ hybridization leads to tetrahedral geometry.<br><strong>'sp³d'</strong>: Incorrect, sp³d hybridization leads to trigonal bipyramidal geometry.<br><strong>'sp²'</strong>: Incorrect, sp² hybridization leads to trigonal planar geometry." 
    },
    { 
        question: "Which of the following molecules has delocalized π-electrons?", 
        options: ["CH₄", "CO₂", "C₆H₆", "NH₃"], 
        answer: "C₆H₆", 
        explanation: "C₆H₆ (benzene) has delocalized π-electrons in its conjugated ring structure.<br><br><strong>'CH₄'</strong>: Incorrect, CH₄ has only single bonds and no delocalization.<br><strong>'CO₂'</strong>: Incorrect, CO₂ has localized double bonds and no delocalization.<br><strong>'NH₃'</strong>: Incorrect, NH₃ has lone pairs and single bonds but no π-electrons." 
    },
    { 
        question: "Which of the following compounds exhibits coordinate bonding?", 
        options: ["H₂O", "NH₄⁺", "NaCl", "CH₄"], 
        answer: "NH₄⁺", 
        explanation: "NH₄⁺ exhibits coordinate bonding, where one nitrogen atom donates both electrons to form a bond with hydrogen.<br><br><strong>'H₂O'</strong>: Incorrect, H₂O has covalent bonds but no coordinate bonding.<br><strong>'NaCl'</strong>: Incorrect, NaCl has ionic bonds, not coordinate bonds.<br><strong>'CH₄'</strong>: Incorrect, CH₄ has covalent bonds with shared electrons, not donated." 
    },
    { 
        question: "Which of the following molecules has the strongest dipole moment?", 
        options: ["CO₂", "CH₄", "H₂O", "CCl₄"], 
        answer: "H₂O", 
        explanation: "H₂O has the strongest dipole moment due to its bent geometry and highly polar O-H bonds.<br><br><strong>'CO₂'</strong>: Incorrect, CO₂ is linear, so dipole moments cancel.<br><strong>'CH₄'</strong>: Incorrect, CH₄ is tetrahedral and nonpolar.<br><strong>'CCl₄'</strong>: Incorrect, CCl₄ is symmetrical and nonpolar." 
    },
    { 
        question: "Which of the following compounds has a metallic lattice?", 
        options: ["NaCl", "Cu", "H₂O", "CH₄"], 
        answer: "Cu", 
        explanation: "Copper (Cu) has a metallic lattice with delocalized electrons allowing conductivity.<br><br><strong>'NaCl'</strong>: Incorrect, NaCl has an ionic lattice.<br><strong>'H₂O'</strong>: Incorrect, H₂O is a molecular compound with covalent bonds.<br><strong>'CH₄'</strong>: Incorrect, CH₄ is a molecular compound and does not have a lattice structure." 
    },
    { 
        question: "Which of the following explains the polarity of HCl?", 
        options: ["Equal sharing of electrons", "Unequal sharing of electrons due to electronegativity difference", "Formation of ionic bonds", "Delocalization of π-electrons"], 
        answer: "Unequal sharing of electrons due to electronegativity difference", 
        explanation: "HCl is polar because chlorine is more electronegative than hydrogen, causing unequal sharing of electrons.<br><br><strong>'Equal sharing of electrons'</strong>: Incorrect, this describes nonpolar covalent bonds.<br><strong>'Formation of ionic bonds'</strong>: Incorrect, HCl forms covalent bonds, not ionic bonds.<br><strong>'Delocalization of π-electrons'</strong>: Incorrect, HCl has no π-electrons or resonance." 
    },
    { 
        question: "Which of the following statements best describes why atoms form bonds?", 
        options: ["To increase their atomic mass", "To achieve a lower energy state", "To become isotopes", "To create free radicals"], 
        answer: "To achieve a lower energy state", 
        explanation: "Atoms bond to achieve a lower energy state by forming stable configurations.<br><br><strong>'To increase their atomic mass'</strong>: Incorrect, as bonding does not affect the atomic mass, which depends on protons and neutrons.<br><strong>'To become isotopes'</strong>: Incorrect, isotopes are formed by changes in the number of neutrons, not bonding.<br><strong>'To create free radicals'</strong>: Incorrect, free radicals are unstable species formed during chemical reactions, not bonding." 
    },
    { 
        question: "In an ionic bond, what happens to the electrons?", 
        options: ["They are shared equally between atoms", "They are transferred from a nonmetal to a metal", "They are transferred from a metal to a nonmetal", "They are delocalized across the lattice"], 
        answer: "They are transferred from a metal to a nonmetal", 
        explanation: "Electrons are transferred from a metal (low electronegativity) to a nonmetal (high electronegativity) in ionic bonding.<br><br><strong>'They are shared equally between atoms'</strong>: Incorrect, this describes covalent bonding.<br><strong>'They are transferred from a nonmetal to a metal'</strong>: Incorrect, nonmetals gain electrons, not donate them.<br><strong>'They are delocalized across the lattice'</strong>: Incorrect, this describes metallic bonding." 
    },
    { 
        question: "Which of the following molecules is most likely to exhibit resonance?", 
        options: ["CH₄", "CO₃²⁻", "NaCl", "H₂"], 
        answer: "CO₃²⁻", 
        explanation: "Resonance occurs in molecules with delocalized electrons, such as CO₃²⁻, where the double bond can shift between oxygen atoms.<br><br><strong>'CH₄'</strong>: Incorrect, methane has single bonds and no delocalized electrons.<br><strong>'NaCl'</strong>: Incorrect, NaCl is an ionic compound without covalent bonds or delocalized electrons.<br><strong>'H₂'</strong>: Incorrect, hydrogen has a single covalent bond with no resonance structures." 
    },
    { 
        question: "Which type of hybridization results in a molecule with bond angles of 120°?", 
        options: ["sp", "sp²", "sp³", "sp³d"],
        answer: "sp²", 
        explanation: "sp² hybridization occurs in trigonal planar molecules, resulting in bond angles of 120°.<br><br><strong>'sp'</strong>: Incorrect, sp hybridization results in linear geometry with bond angles of 180°.<br><strong>'sp³'</strong>: Incorrect, sp³ hybridization results in tetrahedral geometry with bond angles of 109.5°.<br><strong>'sp³d'</strong>: Incorrect, sp³d hybridization results in trigonal bipyramidal geometry with bond angles of 90° and 120°." 
    },
    { 
        question: "Which of the following compounds exhibits both ionic and covalent bonding?", 
        options: ["NaCl", "H₂O", "NH₄Cl", "CH₄"], 
        answer: "NH₄Cl", 
        explanation: "NH₄Cl contains covalent bonds within the NH₄⁺ ion and ionic bonds between NH₄⁺ and Cl⁻.<br><br><strong>'NaCl'</strong>: Incorrect, NaCl has purely ionic bonding.<br><strong>'H₂O'</strong>: Incorrect, H₂O has purely covalent bonding.<br><strong>'CH₄'</strong>: Incorrect, CH₄ has purely covalent bonding." 
    },
    { 
        question: "Which of the following best explains the high melting point of ionic compounds?", 
        options: ["Strong covalent bonds between atoms", "Weak intermolecular forces", "Electrostatic attraction between ions", "Delocalized electrons in the lattice"], 
        answer: "Electrostatic attraction between ions", 
        explanation: "Ionic compounds have high melting points due to strong electrostatic forces between oppositely charged ions.<br><br><strong>'Strong covalent bonds between atoms'</strong>: Incorrect, ionic compounds do not have covalent bonds.<br><strong>'Weak intermolecular forces'</strong>: Incorrect, ionic compounds have strong forces, not weak.<br><strong>'Delocalized electrons in the lattice'</strong>: Incorrect, this describes metallic bonding, not ionic bonding." 
    },
    { 
        question: "Which of the following molecules has a dipole moment?", 
        options: ["CO₂", "CH₄", "H₂O", "CCl₄"], 
        answer: "H₂O", 
        explanation: "H₂O has a dipole moment due to its bent geometry and polar bonds.<br><br><strong>'CO₂'</strong>: Incorrect, CO₂ is linear, so the dipole moments cancel.<br><strong>'CH₄'</strong>: Incorrect, CH₄ is tetrahedral and nonpolar.<br><strong>'CCl₄'</strong>: Incorrect, CCl₄ is tetrahedral and symmetrical, so it is nonpolar." 
    },
    {         question: "Which type of bonding is responsible for the electrical conductivity of metals?", 
        options: ["Ionic bonding", "Covalent bonding", "Metallic bonding", "Hydrogen bonding"], 
        answer: "Metallic bonding", 
        explanation: "Metallic bonding involves delocalized electrons that allow metals to conduct electricity.<br><br><strong>'Ionic bonding'</strong>: Incorrect, ionic compounds conduct electricity only when molten or dissolved.<br><strong>'Covalent bonding'</strong>: Incorrect, covalent compounds do not typically conduct electricity.<br><strong>'Hydrogen bonding'</strong>: Incorrect, hydrogen bonding is an intermolecular force, not a type of bonding within metals." 
    },
    { 
        question: "Which of the following molecules has sp³ hybridization?", 
        options: ["CH₄", "CO₂", "BF₃", "C₂H₂"], 
        answer: "CH₄", 
        explanation: "CH₄ has sp³ hybridization, resulting in a tetrahedral geometry.<br><br><strong>'CO₂'</strong>: Incorrect, CO₂ has sp hybridization.<br><strong>'BF₃'</strong>: Incorrect, BF₃ has sp² hybridization.<br><strong>'C₂H₂'</strong>: Incorrect, C₂H₂ has sp hybridization." 
    },
    { 
        question: "Which of the following molecules has polar bonds but no net dipole moment?", 
        options: ["H₂O", "CO₂", "NH₃", "CH₃Cl"], 
        answer: "CO₂", 
        explanation: "CO₂ has polar bonds, but its linear geometry causes the dipole moments to cancel out.<br><br><strong>'H₂O'</strong>: Incorrect, H₂O has a bent geometry, resulting in a net dipole moment.<br><strong>'NH₃'</strong>: Incorrect, NH₃ has a trigonal pyramidal geometry, resulting in a net dipole moment.<br><strong>'CH₃Cl'</strong>: Incorrect, CH₃Cl is polar due to the asymmetrical distribution of electrons." 
    },
],
    "CHOFH102": [
    { 
        question: "What is the oxidation state of hydrogen in metal hydrides like NaH?", 
        options: ["+1", "-1", "0", "+2"], 
        answer: "-1", 
        explanation: "In metal hydrides like NaH, hydrogen has an oxidation state of -1 because it gains an electron from the metal.<br><br><strong>'+1'</strong>: Incorrect, hydrogen has a +1 oxidation state in most compounds like H₂O.<br><strong>'0'</strong>: Incorrect, hydrogen has an oxidation state of 0 in its molecular form (H₂).<br><strong>'+2'</strong>: Incorrect, hydrogen never exhibits a +2 oxidation state." 
    },
    { 
        question: "Which of the following is a property of hydrogen peroxide (H₂O₂)?", 
        options: ["It is a strong reducing agent only", "It is a strong oxidizing agent only", "It acts as both an oxidizing and reducing agent", "It is completely inert"], 
        answer: "It acts as both an oxidizing and reducing agent", 
        explanation: "Hydrogen peroxide (H₂O₂) can act as both an oxidizing agent and a reducing agent depending on the reaction.<br><br><strong>'It is a strong reducing agent only'</strong>: Incorrect, H₂O₂ can also act as an oxidizing agent.<br><strong>'It is a strong oxidizing agent only'</strong>: Incorrect, H₂O₂ can also act as a reducing agent.<br><strong>'It is completely inert'</strong>: Incorrect, H₂O₂ is highly reactive." 
    },
    { 
        question: "Which of the following is a use of hydrogen in the food industry?", 
        options: ["Hydrogenation of oils", "Preservation of food", "Production of carbonated drinks", "Sterilization"], 
        answer: "Hydrogenation of oils", 
        explanation: "Hydrogen is used to hydrogenate unsaturated oils to produce margarine and other solid fats.<br><br><strong>'Preservation of food'</strong>: Incorrect, hydrogen is not used for food preservation.<br><strong>'Production of carbonated drinks'</strong>: Incorrect, carbon dioxide is used for carbonation, not hydrogen.<br><strong>'Sterilization'</strong>: Incorrect, hydrogen is not typically used for sterilization." 
    },
    { 
        question: "Which of the following compounds contains hydrogen in its -1 oxidation state?", 
        options: ["H₂O", "H₂", "NaH", "CH₄"], 
        answer: "NaH",
        explanation: "In metal hydrides like NaH, hydrogen has a -1 oxidation state because it gains an electron from the metal.<br><br><strong>'H₂O'</strong>: Incorrect, hydrogen has a +1 oxidation state in water.<br><strong>'H₂'</strong>: Incorrect, hydrogen has an oxidation state of 0 in its molecular form.<br><strong>'CH₄'</strong>: Incorrect, hydrogen has a +1 oxidation state in methane." 
    },
    { 
        question: "Which of the following is a binary compound of hydrogen?", 
        options: ["H₂SO₄", "H₂O", "HCl", "NaH"], 
        answer: "HCl", 
        explanation: "HCl is a binary compound of hydrogen because it contains only two elements: hydrogen and chlorine.<br><br><strong>'H₂SO₄'</strong>: Incorrect, H₂SO₄ is a ternary compound with three elements (H, S, O).<br><strong>'H₂O'</strong>: Incorrect, H₂O is also a ternary compound (H, O).<br><strong>'NaH'</strong>: Incorrect, while NaH contains hydrogen, it is considered a hydride." 
    },
    { 
        question: "Which of the following is a test for the presence of hydrogen gas?", 
        options: ["Glowing splint test", "Pop sound test", "Limewater test", "Blue litmus paper test"], 
        answer: "Pop sound test", 
        explanation: "The 'pop sound' test is used to identify hydrogen gas when it burns with a characteristic sound.<br><br><strong>'Glowing splint test'</strong>: Incorrect, this test is used for oxygen gas.<br><strong>'Limewater test'</strong>: Incorrect, this test is used for carbon dioxide gas.<br><strong>'Blue litmus paper test'</strong>: Incorrect, this test is used for acids." 
    },
    { 
        question: "Which of the following is formed when hydrogen reacts with halogens?", 
        options: ["Hydrides", "Halides", "Hydrocarbons", "Oxides"], 
        answer: "Halides", 
        explanation: "When hydrogen reacts with halogens like chlorine, it forms hydrogen halides such as HCl.<br><br><strong>'Hydrides'</strong>: Incorrect, hydrides are formed when hydrogen reacts with metals.<br><strong>'Hydrocarbons'</strong>: Incorrect, hydrocarbons are formed from hydrogen and carbon.<br><strong>'Oxides'</strong>: Incorrect, oxides are formed from oxygen and metals or nonmetals." 
    },
    { 
        question: "Which of the following methods is used to produce heavy water (D₂O)?", 
        options: ["Electrolysis of water", "Fractional distillation of liquid hydrogen", "Reaction of deuterium with oxygen", "Reaction of hydrogen with halogens"], 
        answer: "Electrolysis of water", 
        explanation: "Heavy water (D₂O) is produced by electrolysis of ordinary water, where deuterium is enriched.<br><br><strong>'Fractional distillation of liquid hydrogen'</strong>: Incorrect, this is used for separating hydrogen isotopes, not producing heavy water.<br><strong>'Reaction of deuterium with oxygen'</strong>: Incorrect, while this produces D₂O, it is not the primary method.<br><strong>'Reaction of hydrogen with halogens'</strong>: Incorrect, this forms hydrogen halides, not heavy water." 
    },
    { 
        question: "Which of the following describes the combustion of hydrogen gas?", 
        options: ["Exothermic and forms water", "Endothermic and forms water", "Exothermic and forms hydrogen peroxide", "Endothermic and forms hydrogen peroxide"], 
        answer: "Exothermic and forms water", 
        explanation: "The combustion of hydrogen gas is an exothermic reaction that produces water.<br><br><strong>'Endothermic and forms water'</strong>: Incorrect, combustion is exothermic.<br><strong>'Exothermic and forms hydrogen peroxide'</strong>: Incorrect, hydrogen peroxide is not formed during combustion.<br><strong>'Endothermic and forms hydrogen peroxide'</strong>: Incorrect, combustion is not endothermic." 
    },
    { 
        question: "Which of the following is a property of heavy water (D₂O)?", 
        options: ["Lighter than ordinary water", "Higher boiling point than ordinary water", "Highly flammable", "Nonpolar"], 
        answer: "Higher boiling point than ordinary water", 
        explanation: "Heavy water (D₂O) has a higher boiling point than ordinary water due to stronger hydrogen bonding.<br><br><strong>'Lighter than ordinary water'</strong>: Incorrect, heavy water is denser than ordinary water.<br><strong>'Highly flammable'</strong>: Incorrect, heavy water is not flammable.<br><strong>'Nonpolar'</strong>: Incorrect, heavy water is polar, just like ordinary water." 
    },
    { 
        question: "Which of the following is a compound of hydrogen used as rocket fuel?", 
        options: ["H₂O", "H₂", "NH₃", "H₂O₂"], 
        answer: "H₂", 
        explanation: "Hydrogen (H₂) is used as a rocket fuel due to its high energy content.<br><br><strong>'H₂O'</strong>: Incorrect, water is not a fuel.<br><strong>'NH₃'</strong>: Incorrect, ammonia is not commonly used as rocket fuel.<br><strong>'H₂O₂'</strong>: Incorrect, hydrogen peroxide is used as an oxidizer, not as a primary fuel." 
    },
    { 
        question: "Which of the following describes the structure of molecular hydrogen (H₂)?", 
        options: ["Linear", "Bent", "Trigonal planar", "Tetrahedral"], 
        answer: "Linear", 
        explanation: "Molecular hydrogen (H₂) is linear because it consists of only two atoms bonded by a single covalent bond.<br><br><strong>'Bent'</strong>: Incorrect, bent geometry occurs in molecules like H₂O.<br><strong>'Trigonal planar'</strong>: Incorrect, trigonal planar geometry occurs in molecules like BF₃.<br><strong>'Tetrahedral'</strong>: Incorrect, tetrahedral geometry occurs in molecules like CH₄." 
    },
    { 
        question: "Which of the following reactions is an example of hydrogenation?", 
        options: ["Reaction of hydrogen with oxygen", "Addition of hydrogen to alkenes", "Reaction of hydrogen with nitrogen", "Reaction of hydrogen with metal oxides"], 
        answer: "Addition of hydrogen to alkenes", 
        explanation: "Hydrogenation involves the addition of hydrogen to unsaturated hydrocarbons like alkenes and alkynes to form saturated hydrocarbons.<br><br><strong>'Reaction of hydrogen with oxygen'</strong>: Incorrect, this is combustion, not hydrogenation.<br><strong>'Reaction of hydrogen with nitrogen'</strong>: Incorrect, this forms ammonia in the Haber process.<br><strong>'Reaction of hydrogen with metal oxides'</strong>: Incorrect, this is a reduction reaction, not hydrogenation." 
    },
    { 
        question: "Which of the following is a physical property of hydrogen gas?", 
        options: ["Colorless and odorless", "Highly soluble in water", "Heavy molecular weight", "Non-flammable"], 
        answer: "Colorless and odorless", 
        explanation: "Hydrogen gas is colorless, odorless, and highly flammable.<br><br><strong>'Highly soluble in water'</strong>: Incorrect, hydrogen is sparingly soluble in water.<br><strong>'Heavy molecular weight'</strong>: Incorrect, hydrogen has a very low molecular weight (2 g/mol).<br><strong>'Non-flammable'</strong>: Incorrect, hydrogen is highly flammable." 
    },
    { 
        question: "Which of the following methods can be used for industrial hydrogen production?", 
        options: ["Reaction of zinc with dilute HCl", "Electrolysis of water", "Reaction of sodium with ethanol", "Reaction of hydrogen with nitrogen"], 
        answer: "Electrolysis of water",
        explanation: "Electrolysis of water is an industrial method to produce hydrogen gas.<br><br><strong>'Reaction of zinc with dilute HCl'</strong>: Incorrect, this is a laboratory method.<br><strong>'Reaction of sodium with ethanol'</strong>: Incorrect, this produces hydrogen but is not an industrial method.<br><strong>'Reaction of hydrogen with nitrogen'</strong>: Incorrect, this produces ammonia, not pure hydrogen." 
    },
    { 
        question: "Which of the following statements about hydrogen is true?", 
        options: ["Hydrogen is heavier than air", "Hydrogen is the most abundant element in the universe", "Hydrogen is non-reactive", "Hydrogen has three electrons"], 
        answer: "Hydrogen is the most abundant element in the universe", 
        explanation: "Hydrogen is the most abundant element in the universe, making up about 75% of its mass.<br><br><strong>'Hydrogen is heavier than air'</strong>: Incorrect, hydrogen is lighter than air.<br><strong>'Hydrogen is non-reactive'</strong>: Incorrect, hydrogen is highly reactive.<br><strong>'Hydrogen has three electrons'</strong>: Incorrect, hydrogen has only one electron." 
    },
    { 
        question: "Which of the following is a chemical property of hydrogen?", 
        options: ["Colorless", "Odorless", "Combustion with oxygen", "Sparingly soluble in water"], 
        answer: "Combustion with oxygen", 
        explanation: "Combustion with oxygen to form water (H₂O) is a chemical property of hydrogen.<br><br><strong>'Colorless'</strong>: Incorrect, this is a physical property.<br><strong>'Odorless'</strong>: Incorrect, this is a physical property.<br><strong>'Sparingly soluble in water'</strong>: Incorrect, this is a physical property." 
    },
    { 
        question: "Which of the following is an isotope of hydrogen?", 
        options: ["Helium", "Protium", "Carbon", "Oxygen"], 
        answer: "Protium", 
        explanation: "Protium (¹H) is the most common isotope of hydrogen.<br><br><strong>'Helium'</strong>: Incorrect, helium is a noble gas and not an isotope of hydrogen.<br><strong>'Carbon'</strong>: Incorrect, carbon is a separate element.<br><strong>'Oxygen'</strong>: Incorrect, oxygen is a separate element." 
    },
    { 
        question: "Which of the following reactions is an example of hydrogen acting as an oxidizing agent?", 
        options: ["Reaction with chlorine to form HCl", "Reaction with copper oxide to form copper", "Reaction with oxygen to form water", "Reaction with nitrogen to form ammonia"], 
        answer: "Reaction with chlorine to form HCl", 
        explanation: "Hydrogen acts as an oxidizing agent when reacting with chlorine to form hydrogen chloride (HCl).<br><br><strong>'Reaction with copper oxide to form copper'</strong>: Incorrect, hydrogen acts as a reducing agent here.<br><strong>'Reaction with oxygen to form water'</strong>: Incorrect, this is a combustion reaction.<br><strong>'Reaction with nitrogen to form ammonia'</strong>: Incorrect, this is a combination reaction in the Haber process." 
    },
    { 
        question: "Which of the following is a major use of hydrogen in industry?", 
        options: ["Preservation of food", "Production of ammonia", "Filling balloons", "Catalyst in reactions"], 
        answer: "Production of ammonia", 
        explanation: "Hydrogen is used in the Haber process for the production of ammonia.<br><br><strong>'Preservation of food'</strong>: Incorrect, hydrogen is not used for food preservation.<br><strong>'Filling balloons'</strong>: Incorrect, while hydrogen can fill balloons, it is dangerous due to its flammability.<br><strong>'Catalyst in reactions'</strong>: Incorrect, hydrogen is not a catalyst; it is a reactant." 
    },
    { 
        question: "Which of the following reactions describes the water-gas shift reaction?", 
        options: ["CO + H₂O → CO₂ + H₂", "H₂ + O₂ → H₂O", "N₂ + H₂ → NH₃", "HCl + Zn → ZnCl₂ + H₂"], 
        answer: "CO + H₂O → CO₂ + H₂", 
        explanation: "The water-gas shift reaction involves the reaction of carbon monoxide (CO) with steam (H₂O) to produce hydrogen gas and carbon dioxide.<br><br><strong>'H₂ + O₂ → H₂O'</strong>: Incorrect, this is a combustion reaction.<br><strong>'N₂ + H₂ → NH₃'</strong>: Incorrect, this is the Haber process for ammonia production.<br><strong>'HCl + Zn → ZnCl₂ + H₂'</strong>: Incorrect, this is a laboratory reaction for hydrogen production." 
    },
    { 
        question: "Which of the following gases is used in hydrogen fuel cells?", 
        options: ["Nitrogen", "Hydrogen", "Oxygen", "Carbon dioxide"], 
        answer: "Hydrogen", 
        explanation: "Hydrogen gas is used in fuel cells as a source of energy.<br><br><strong>'Nitrogen'</strong>: Incorrect, nitrogen is not used in fuel cells.<br><strong>'Oxygen'</strong>: Incorrect, oxygen is used as the oxidizing agent but not the fuel source.<br><strong>'Carbon dioxide'</strong>: Incorrect, carbon dioxide is not involved in hydrogen fuel cells." 
    },
    { 
        question: "Which of the following reactions describes the formation of hydrogen gas from metal hydrides?", 
        options: ["CaH₂ + H₂O → Ca(OH)₂ + H₂", "Zn + HCl → ZnCl₂ + H₂", "CO + H₂O → CO₂ + H₂", "H₂ + O₂ → H₂O"], 
        answer: "CaH₂ + H₂O → Ca(OH)₂ + H₂", 
        explanation: "Metal hydrides like CaH₂ react with water to produce hydrogen gas.<br><br><strong>'Zn + HCl → ZnCl₂ + H₂'</strong>: Incorrect, this reaction involves zinc and acid, not metal hydrides.<br><strong>'CO + H₂O → CO₂ + H₂'</strong>: Incorrect, this is the water-gas shift reaction.<br><strong>'H₂ + O₂ → H₂O'</strong>: Incorrect, this is a combustion reaction." 
    },
    { 
        question: "Which isotope of hydrogen is radioactive?", 
        options: ["Protium", "Deuterium", "Tritium", "None of the above"], 
        answer: "Tritium", 
        explanation: "Tritium (³H) is a radioactive isotope of hydrogen with one proton and two neutrons.<br><br><strong>'Protium'</strong>: Incorrect, Protium (¹H) is the most common isotope and is non-radioactive.<br><strong>'Deuterium'</strong>: Incorrect, Deuterium (²H) is also non-radioactive.<br><strong>'None of the above'</strong>: Incorrect, Tritium is radioactive." 
    },
    { 
        question: "Which gas is formed when hydrogen reacts with nitrogen under high pressure and temperature?", 
        options: ["Ammonia", "Methane", "Hydrogen chloride", "Nitrogen dioxide"], 
        answer: "Ammonia", 
        explanation: "Hydrogen reacts with nitrogen under high pressure and temperature in the Haber process to form ammonia (NH₃).<br><br><strong>'Methane'</strong>: Incorrect, methane (CH₄) is formed from carbon and hydrogen, not nitrogen.<br><strong>'Hydrogen chloride'</strong>: Incorrect, hydrogen chloride (HCl) is formed from hydrogen and chlorine.<br><strong>'Nitrogen dioxide'</strong>: Incorrect, nitrogen dioxide (NO₂) is formed from nitrogen and oxygen, not hydrogen." 
    },
    { 
        question: "Which of the following methods is used to prepare hydrogen gas in the laboratory?", 
        options: ["Electrolysis of water", "Reaction of zinc with dilute HCl", "Reaction of sodium with ethanol", "Reaction of carbon monoxide with steam"], 
        answer: "Reaction of zinc with dilute HCl", 
        explanation: "Hydrogen gas is prepared in the laboratory by reacting zinc with dilute hydrochloric acid (HCl).<br><br><strong>'Electrolysis of water'</strong>: Incorrect, this is an industrial method rather than a laboratory method.<br><strong>'Reaction of sodium with ethanol'</strong>: Incorrect, this produces ethoxide ions, not pure hydrogen gas.<br><strong>'Reaction of carbon monoxide with steam'</strong>: Incorrect, this describes the water-gas shift reaction used in industrial hydrogen production." 
    },
    { 
        question: "Which of the following is the most stable hydride of hydrogen?", 
        options: ["H₂O", "NH₃", "CH₄", "HF"], 
        answer: "H₂O", 
        explanation: "Water (H₂O) is the most stable hydride of hydrogen due to strong hydrogen bonding and its widespread occurrence.<br><br><strong>'NH₃'</strong>: Incorrect, ammonia is stable but less stable than water.<br><strong>'CH₄'</strong>: Incorrect, methane is stable but lacks hydrogen bonding.<br><strong>'HF'</strong>: Incorrect, hydrogen fluoride is less stable due to its reactivity." 
    },
    { 
        question: "Which of the following reactions involves hydrogen acting as a reducing agent?", 
        options: ["Reaction with oxygen to form water", "Reaction with chlorine to form HCl", "Reaction with copper oxide to form copper", "Reaction with nitrogen to form ammonia"], 
        answer: "Reaction with copper oxide to form copper", 
        explanation: "Hydrogen acts as a reducing agent when it reacts with copper oxide (CuO) to form copper (Cu) and water.<br><br><strong>'Reaction with oxygen to form water'</strong>: Incorrect, this is a combustion reaction where hydrogen is oxidized.<br><strong>'Reaction with chlorine to form HCl'</strong>: Incorrect, this is a synthesis reaction, not a reduction.<br><strong>'Reaction with nitrogen to form ammonia'</strong>: Incorrect, this is a combination reaction in the Haber process." 
    },
    { 
        question: "What is the bond angle in a water molecule?", 
        options: ["90°", "104.5°", "120°", "180°"], 
        answer: "104.5°", 
        explanation: "The bond angle in a water molecule (H₂O) is 104.5° due to the repulsion between lone pairs on oxygen.<br><br><strong>'90°'</strong>: Incorrect, this bond angle is found in square planar molecules.<br><strong>'120°'</strong>: Incorrect, this bond angle is found in trigonal planar molecules.<br><strong>'180°'</strong>: Incorrect, this bond angle is found in linear molecules." 
    },
    { 
        question: "Which of the following compounds contains hydrogen in its +1 oxidation state?", 
        options: ["H₂", "NaH", "H₂O", "CaH₂"], 
        answer: "H₂O", 
        explanation: "In water (H₂O), hydrogen has an oxidation state of +1 due to its bonding with oxygen.<br><br><strong>'H₂'</strong>: Incorrect, hydrogen in molecular form has an oxidation state of 0.<br><strong>'NaH'</strong>: Incorrect, hydrogen has an oxidation state of -1 in metal hydrides.<br><strong>'CaH₂'</strong>: Incorrect, hydrogen has an oxidation state of -1 in metal hydrides." 
    },
    { 
        question: "Which of the following describes the isotopes of hydrogen?", 
        options: ["Same number of protons, different number of neutrons", "Same number of neutrons, different number of protons", "Same number of electrons, different number of neutrons", "Different number of electrons and protons"], 
        answer: "Same number of protons, different number of neutrons", 
        explanation: "Hydrogen isotopes (Protium, Deuterium, Tritium) have the same number of protons (1) but different numbers of neutrons.<br><br><strong>'Same number of neutrons, different number of protons'</strong>: Incorrect, isotopes differ in their neutrons, not protons.<br><strong>'Same number of electrons, different number of neutrons'</strong>: Incorrect, isotopes have identical electron configurations.<br><strong>'Different number of electrons and protons'</strong>: Incorrect, this describes ions, not isotopes." 
    },
    { 
        question: "Which of the following is a use of hydrogen gas?", 
        options: ["Preservation of food", "Filling balloons", "Catalyst in reactions", "Production of ammonia"], 
        answer: "Production of ammonia", 
        explanation: "Hydrogen gas is used in the Haber process for the production of ammonia.<br><br><strong>'Preservation of food'</strong>: Incorrect, hydrogen is not used for food preservation.<br><strong>'Filling balloons'</strong>: Incorrect, while hydrogen can fill balloons, it is dangerous due to its flammability.<br><strong>'Catalyst in reactions'</strong>: Incorrect, hydrogen is not a catalyst; it is a reactant in many reactions." 
    },
    { 
        question: "Which of the following describes the role of hydrogen in fuel cells?", 
        options: ["Oxidizing agent", "Reducing agent", "Catalyst", "Electrolyte"], 
        answer: "Reducing agent", 
        explanation: "Hydrogen acts as a reducing agent in fuel cells, where it donates electrons to produce electricity.<br><br><strong>'Oxidizing agent'</strong>: Incorrect, hydrogen is not an oxidizing agent.<br><strong>'Catalyst'</strong>: Incorrect, hydrogen is a reactant, not a catalyst.<br><strong>'Electrolyte'</strong>: Incorrect, hydrogen is not an electrolyte; the electrolyte is typically a solution like KOH." 
    },
],

    "EXAM015": [
    { 
        question: "Which alkali metal exhibits diagonal relationship with magnesium?", 
        options: ["Lithium (Li)", "Sodium (Na)", "Potassium (K)", "Cesium (Cs)"], 
        answer: "Lithium (Li)", 
        explanation: "<b>Correct Answer:</b> Lithium (Li)<br>Lithium exhibits a diagonal relationship with magnesium due to similarities in ionic size, electronegativity, and polarization effects. Both form nitrides and have similar solubilities for their compounds.<br><br><b>Why other options are incorrect:</b><br><b>Sodium (Na):</b> Sodium does not exhibit a diagonal relationship with magnesium.<br><b>Potassium (K):</b> Potassium does not share these similarities with magnesium.<br><b>Cesium (Cs):</b> Cesium is too large to exhibit such a relationship."
    },
    { 
        question: "Which alkali metal has the highest tendency to form complexes?", 
        options: ["Lithium (Li)", "Sodium (Na)", "Potassium (K)", "Cesium (Cs)"], 
        answer: "Lithium (Li)", 
        explanation: "<b>Correct Answer:</b> Lithium (Li)<br>Due to its small ionic size and high charge density, lithium has the highest tendency to form complexes, such as with ethylenediamine or crown ethers.<br><br><b>Why other options are incorrect:</b><br><b>Sodium (Na):</b> Sodium can form complexes but lacks the high charge density of lithium.<br><b>Potassium (K):</b> Potassium forms fewer complexes due to its larger ionic size.<br><b>Cesium (Cs):</b> Cesium forms very few complexes due to its low charge density."
    },
    { 
        question: "Which alkali metal has the strongest reducing power in aqueous solution?", 
        options: ["Lithium (Li)", "Sodium (Na)", "Potassium (K)", "Cesium (Cs)"], 
        answer: "Lithium (Li)", 
        explanation: "<b>Correct Answer:</b> Lithium (Li)<br>In aqueous solutions, lithium exhibits the strongest reducing power because its high hydration energy compensates for its high ionization energy, making it highly reactive.<br><br><b>Why other options are incorrect:</b><br><b>Sodium (Na):</b> Sodium has lower hydration energy, making it less reducing than lithium.<br><b>Potassium (K):</b> Potassium has even lower hydration energy, reducing its reducing power.<br><b>Cesium (Cs):</b> Cesium, with the lowest hydration energy, is the weakest reducing agent among the alkali metals."
    },
    { 
        question: "Which alkali metal forms the least stable hydride?",
        options: ["Lithium (Li)", "Sodium (Na)", "Potassium (K)", "Cesium (Cs)"], 
        answer: "Cesium (Cs)", 
        explanation: "<b>Correct Answer:</b> Cesium (Cs)<br>Cesium hydride (CsH) is the least stable hydride among alkali metals due to the weak bonding caused by cesium's large ionic size.<br><br><b>Why other options are incorrect:</b><br><b>Lithium (Li):</b> Lithium hydride (LiH) is highly stable due to strong ionic bonding.<br><b>Sodium (Na):</b> Sodium hydride (NaH) is more stable than cesium hydride.<br><b>Potassium (K):</b> Potassium hydride (KH) is stable but less so compared to lithium hydride."
    },
    { 
        question: "Which alkali metal reacts most violently with chlorine gas?", 
        options: ["Lithium (Li)", "Sodium (Na)", "Potassium (K)", "Cesium (Cs)"], 
        answer: "Cesium (Cs)", 
        explanation: "<b>Correct Answer:</b> Cesium (Cs)<br>Cesium reacts most violently with chlorine gas due to its low ionization energy and large atomic size, making the reaction highly exothermic.<br><br><b>Why other options are incorrect:</b><br><b>Lithium (Li):</b> Lithium reacts less violently due to its higher ionization energy.<br><b>Sodium (Na):</b> Sodium reacts moderately with chlorine gas.<br><b>Potassium (K):</b> Potassium reacts violently but less so compared to cesium."
    },
    { 
        question: "Which alkali metal has the lowest standard electrode potential?", 
        options: ["Lithium (Li)", "Sodium (Na)", "Potassium (K)", "Cesium (Cs)"], 
        answer: "Lithium (Li)", 
        explanation: "<b>Correct Answer:</b> Lithium (Li)<br>Lithium has the lowest standard electrode potential (-3.04 V), making it the strongest reducing agent among alkali metals.<br><br><b>Why other options are incorrect:</b><br><b>Sodium (Na):</b> Sodium has a higher electrode potential (-2.71 V) than lithium.<br><b>Potassium (K):</b> Potassium's standard electrode potential (-2.93 V) is higher than lithium's.<br><b>Cesium (Cs):</b> Cesium has a higher electrode potential (-2.92 V) than lithium."
    },
    { 
        question: "Which alkali metal reacts with oxygen to form a simple oxide?", 
        options: ["Lithium (Li)", "Sodium (Na)", "Potassium (K)", "Rubidium (Rb)"], 
        answer: "Lithium (Li)", 
        explanation: "<b>Correct Answer:</b> Lithium (Li)<br>Lithium reacts with oxygen to form a simple oxide (Li₂O) due to its small ionic size and high charge density.<br><br><b>Why other options are incorrect:</b><br><b>Sodium (Na):</b> Sodium forms a peroxide (Na₂O₂) instead of a simple oxide.<br><b>Potassium (K):</b> Potassium forms a superoxide (KO₂) due to its larger ionic size.<br><b>Rubidium (Rb):</b> Rubidium also forms a superoxide (RbO₂) instead of a simple oxide."
    },
    { 
        question: "Which alkali metal has the highest thermal conductivity?", 
        options: ["Lithium (Li)", "Sodium (Na)", "Potassium (K)", "Cesium (Cs)"], 
        answer: "Lithium (Li)", 
        explanation: "<b>Correct Answer:</b> Lithium (Li)<br>Lithium has the highest thermal conductivity among alkali metals due to its small atomic size and strong metallic bonding.<br><br><b>Why other options are incorrect:</b><br><b>Sodium (Na):</b> Sodium has lower thermal conductivity compared to lithium.<br><b>Potassium (K):</b> Potassium's thermal conductivity is lower than sodium's.<br><b>Cesium (Cs):</b> Cesium has the lowest thermal conductivity among alkali metals."
    },
    { 
        question: "Which alkali metal has the strongest metallic bonding?", 
        options: ["Lithium (Li)", "Sodium (Na)", "Potassium (K)", "Cesium (Cs)"], 
        answer: "Lithium (Li)", 
        explanation: "<b>Correct Answer:</b> Lithium (Li)<br>Due to its small atomic size and high charge density, lithium exhibits the strongest metallic bonding among alkali metals.<br><br><b>Why other options are incorrect:</b><br><b>Sodium (Na):</b> Sodium has weaker metallic bonding than lithium due to its larger atomic size.<br><b>Potassium (K):</b> Potassium has even weaker metallic bonding.<br><b>Cesium (Cs):</b> Cesium has the weakest metallic bonding due to its large atomic size."
    },
    { 
        question: "Which alkali metal forms the most soluble nitrate?", 
        options: ["Lithium (Li)", "Sodium (Na)", "Potassium (K)", "Cesium (Cs)"], 
        answer: "Cesium (Cs)", 
        explanation: "<b>Correct Answer:</b> Cesium (Cs)<br>Cesium nitrate (CsNO₃) is the most soluble nitrate among alkali metals due to the large ionic size of cesium, which reduces lattice energy.<br><br><b>Why other options are incorrect:</b><br><b>Lithium (Li):</b> Lithium nitrate (LiNO₃) is less soluble due to its high lattice energy.<br><b>Sodium (Na):</b> Sodium nitrate (NaNO₃) is more soluble than lithium nitrate but less so than cesium nitrate.<br><b>Potassium (K):</b> Potassium nitrate (KNO₃) is less soluble than cesium nitrate."
    },
    { 
        question: "What happens to the density of alkali metals as you move down the group?", 
        options: ["Increases", "Decreases", "Remains constant", "Varies irregularly"], 
        answer: "Increases", 
        explanation: "<b>Correct Answer:</b> Increases<br>The density of alkali metals generally increases down the group due to the increasing atomic mass overcoming the effect of increasing atomic size.<br><br><b>Why other options are incorrect:</b><br><b>Decreases:</b> While atomic size increases, the atomic mass also increases significantly, leading to higher densities.<br><b>Remains constant:</b> Density does not remain constant because atomic mass increases down the group.<br><b>Varies irregularly:</b> Density shows a clear trend of increase and does not vary irregularly."
    },
    { 
        question: "What is the trend of ionization energy in alkali metals?", 
        options: ["Increases down the group", "Decreases down the group", "Remains constant", "Varies irregularly"], 
        answer: "Decreases down the group", 
        explanation: "<b>Correct Answer:</b> Decreases down the group<br>The ionization energy of alkali metals decreases down the group due to increasing atomic size and weaker attraction between the nucleus and the outermost electron.<br><br><b>Why other options are incorrect:</b><br><b>Increases down the group:</b> This is incorrect because the outer electron becomes easier to remove as atomic size increases.<br><b>Remains constant:</b> Ionization energy does not remain constant; it clearly decreases down the group.<br><b>Varies irregularly:</b> Ionization energy follows a predictable trend and does not vary irregularly."
    },
    { 
        question: "Which alkali metal has the highest melting point?", 
        options: ["Lithium (Li)", "Sodium (Na)", "Potassium (K)", "Cesium (Cs)"], 
        answer: "Lithium (Li)", 
        explanation: "<b>Correct Answer:</b> Lithium (Li)<br>Lithium has the highest melting point among alkali metals due to its small atomic size and strong metallic bonding.<br><br><b>Why other options are incorrect:</b><br><b>Sodium (Na):</b> Sodium has a lower melting point than lithium due to weaker metallic bonding.<br><b>Potassium (K):</b> Potassium has an even lower melting point than sodium.<br><b>Cesium (Cs):</b> Cesium has the lowest melting point among alkali metals due to its large atomic size and weak metallic bonding."
    },
    {        question: "What is the nature of oxides formed by alkali metals?", 
        options: ["Acidic", "Basic", "Neutral", "Amphoteric"], 
        answer: "Basic", 
        explanation: "<b>Correct Answer:</b> Basic<br>Oxides of alkali metals are basic in nature because they react with water to form metal hydroxides, which are strong bases. For example, Na₂O + H₂O → 2NaOH.<br><br><b>Why other options are incorrect:</b><br><b>Acidic:</b> Acidic oxides are formed by non-metals, not alkali metals.<br><b>Neutral:</b> Neutral oxides, such as CO or N₂O, are not formed by alkali metals.<br><b>Amphoteric:</b> Amphoteric oxides, such as Al₂O₃, are formed by certain metals but not alkali metals."
    },
    { 
        question: "Which alkali metal forms the most stable carbonate?", 
        options: ["Lithium (Li)", "Sodium (Na)", "Potassium (K)", "Cesium (Cs)"], 
        answer: "Cesium (Cs)", 
        explanation: "<b>Correct Answer:</b> Cesium (Cs)<br>Cesium forms the most stable carbonate due to its large ionic size, which reduces lattice energy and stabilizes the carbonate ion.<br><br><b>Why other options are incorrect:</b><br><b>Lithium (Li):</b> Lithium carbonate is less stable due to the small ionic size of lithium, leading to higher lattice energy.<br><b>Sodium (Na):</b> Sodium carbonate is stable but less so compared to cesium carbonate.<br><b>Potassium (K):</b> Potassium carbonate is stable but not as stable as cesium carbonate."
    },
    { 
        question: "What happens to the atomic radius of alkali metals as you move down the group?", 
        options: ["Increases", "Decreases", "Remains constant", "Varies irregularly"], 
        answer: "Increases", 
        explanation: "<b>Correct Answer:</b> Increases<br>The atomic radius of alkali metals increases down the group due to the addition of electron shells, which outweighs the effect of increasing nuclear charge.<br><br><b>Why other options are incorrect:</b><br><b>Decreases:</b> Atomic radius does not decrease because electron shells are added as you move down the group.<br><b>Remains constant:</b> Atomic radius clearly increases and does not remain constant.<br><b>Varies irregularly:</b> The atomic radius follows a predictable trend and does not vary irregularly."
    },
    {         question: "Which alkali metal forms the strongest ionic bond in its compounds?", 
        options: ["Lithium (Li)", "Sodium (Na)", "Potassium (K)", "Cesium (Cs)"], 
        answer: "Lithium (Li)", 
        explanation: "<b>Correct Answer:</b> Lithium (Li)<br>Lithium forms the strongest ionic bonds due to its small ionic radius and high charge density, which leads to strong electrostatic attraction.<br><br><b>Why other options are incorrect:</b><br><b>Sodium (Na):</b> Sodium forms weaker ionic bonds compared to lithium due to its larger ionic size.<br><b>Potassium (K):</b> Potassium forms even weaker ionic bonds than sodium.<br><b>Cesium (Cs):</b> Cesium forms the weakest ionic bonds among alkali metals due to its large ionic size."
    },
    { 
        question: "Which alkali metal has the lowest electronegativity?", 
        options: ["Lithium (Li)", "Sodium (Na)", "Potassium (K)", "Cesium (Cs)"], 
        answer: "Cesium (Cs)", 
        explanation: "<b>Correct Answer:</b> Cesium (Cs)<br>Cesium has the lowest electronegativity among alkali metals due to its large atomic size and weak attraction to electrons.<br><br><b>Why other options are incorrect:</b><br><b>Lithium (Li):</b> Lithium has the highest electronegativity among alkali metals due to its small atomic size.<br><b>Sodium (Na):</b> Sodium has a higher electronegativity than cesium but lower than lithium.<br><b>Potassium (K):</b> Potassium has a higher electronegativity than cesium but lower than sodium."
    },
    { 
        question: "Which alkali metal forms the least soluble sulfate in water?", 
        options: ["Lithium (Li)", "Sodium (Na)", "Potassium (K)", "Cesium (Cs)"], 
        answer: "Lithium (Li)", 
        explanation: "<b>Correct Answer:</b> Lithium (Li)<br>Lithium sulfate (Li₂SO₄) is the least soluble sulfate among alkali metals due to its high lattice energy and low hydration energy.<br><br><b>Why other options are incorrect:</b><br><b>Sodium (Na):</b> Sodium sulfate (Na₂SO₄) is highly soluble in water.<br><b>Potassium (K):</b> Potassium sulfate (K₂SO₄) is more soluble than lithium sulfate.<br><b>Cesium (Cs):</b> Cesium sulfate (Cs₂SO₄) is extremely soluble in water."
    },
    { 
        question: "Which alkali metal forms the least stable chloride?", 
        options: ["Lithium (Li)", "Sodium (Na)", "Potassium (K)", "Cesium (Cs)"], 
        answer: "Cesium (Cs)", 
        explanation: "<b>Correct Answer:</b> Cesium (Cs)<br>Cesium chloride (CsCl) is the least stable chloride among alkali metals due to the weak lattice energy caused by its large ionic size.<br><br><b>Why other options are incorrect:</b><br><b>Lithium (Li):</b> Lithium chloride (LiCl) is highly stable due to its high lattice energy.<br><b>Sodium (Na):</b> Sodium chloride (NaCl) is very stable and widely used.<br><b>Potassium (K):</b> Potassium chloride (KCl) is stable but less so compared to sodium chloride."
    },
    { 
        question: "Which alkali metal shows the highest hydration energy?", 
        options: ["Lithium (Li)", "Sodium (Na)", "Potassium (K)", "Cesium (Cs)"], 
        answer: "Lithium (Li)", 
        explanation: "<b>Correct Answer:</b> Lithium (Li)<br>Lithium has the highest hydration energy among alkali metals due to its small ionic size and high charge density, allowing it to strongly attract water molecules.<br><br><b>Why other options are incorrect:</b><br><b>Sodium (Na):</b> Sodium has a larger ionic size than lithium, so its hydration energy is lower.<br><b>Potassium (K):</b> Potassium has an even larger ionic size, leading to further reduced hydration energy.<br><b>Cesium (Cs):</b> Cesium, being the largest alkali metal, has the lowest hydration energy of all."
    },
    { 
        question: "Which alkali metal forms the most stable complex with crown ethers?", 
        options: ["Lithium (Li)", "Sodium (Na)", "Potassium (K)", "Rubidium (Rb)"], 
        answer: "Potassium (K)", 
        explanation: "<b>Correct Answer:</b> Potassium (K)<br>Potassium forms the most stable complex with crown ethers due to its optimal ionic size, which fits well within the cavity of crown ethers.<br><br><b>Why other options are incorrect:</b><br><b>Lithium (Li):</b> Lithium is too small to effectively fit into the crown ether cavity.<br><b>Sodium (Na):</b> Sodium can form complexes, but they are less stable compared to potassium.<br><b>Rubidium (Rb):</b> Rubidium is too large for the crown ether cavity, making the complex less stable."
    },
    { 
        question: "Which alkali metal has the lowest boiling point?", 
        options: ["Lithium (Li)", "Sodium (Na)", "Potassium (K)", "Cesium (Cs)"], 
        answer: "Cesium (Cs)", 
        explanation: "<b>Correct Answer:</b> Cesium (Cs)<br>Cesium has the lowest boiling point among alkali metals due to its large atomic size and weak metallic bonding.<br><br><b>Why other options are incorrect:</b><br><b>Lithium (Li):</b> Lithium has the highest boiling point among alkali metals due to its small atomic size and strong metallic bonding.<br><b>Sodium (Na):</b> Sodium has a higher boiling point than cesium but lower than lithium.<br><b>Potassium (K):</b> Potassium has a lower boiling point than sodium but higher than cesium."
    },
    { 
        question: "Which alkali metal is commonly used in liquid-metal cooling systems for nuclear reactors?",
        options: ["Lithium (Li)", "Sodium (Na)", "Potassium (K)", "Rubidium (Rb)"], 
        answer: "Sodium (Na)", 
        explanation: "<b>Correct Answer:</b> Sodium (Na)<br>Sodium is used in liquid-metal cooling systems for nuclear reactors due to its high thermal conductivity and low viscosity.<br><br><b>Why other options are incorrect:</b><br><b>Lithium (Li):</b> Lithium is not used in such systems due to its reactivity and low density.<br><b>Potassium (K):</b> Potassium could be used, but it is less efficient than sodium.<br><b>Rubidium (Rb):</b> Rubidium is too reactive and expensive for practical use in cooling systems."
    },
    { 
        question: "Which alkali metal is used in atomic clocks?", 
        options: ["Lithium (Li)", "Sodium (Na)", "Potassium (K)", "Cesium (Cs)"], 
        answer: "Cesium (Cs)", 
        explanation: "<b>Correct Answer:</b> Cesium (Cs)<br>Cesium is used in atomic clocks due to the precise frequency of radiation emitted by its isotopes during electron transitions.<br><br><b>Why other options are incorrect:</b><br><b>Lithium (Li):</b> Lithium is not used in atomic clocks as its electron transitions do not produce stable frequencies.<br><b>Sodium (Na):</b> Sodium's transitions are not as stable and precise as cesium's.<br><b>Potassium (K):</b> Potassium is sometimes used in experimental clocks but is less common than cesium."
    },
    { 
        question: "Which alkali metal reacts directly with nitrogen at room temperature?", 
        options: ["Lithium (Li)", "Sodium (Na)", "Potassium (K)", "Rubidium (Rb)"], 
        answer: "Lithium (Li)", 
        explanation: "<b>Correct Answer:</b> Lithium (Li)<br>Lithium reacts directly with nitrogen at room temperature to form lithium nitride (Li₃N). This is due to lithium's high charge density and strong attraction to nitrogen.<br><br><b>Why other options are incorrect:</b><br><b>Sodium (Na):</b> Sodium does not react with nitrogen under standard conditions.<br><b>Potassium (K):</b> Potassium does not react with nitrogen at room temperature.<br><b>Rubidium (Rb):</b> Rubidium also does not react with nitrogen under normal conditions."
    },
    { 
        question: "Which alkali metal forms the least soluble hydroxide in water?", 
        options: ["Lithium (Li)", "Sodium (Na)", "Potassium (K)", "Rubidium (Rb)"], 
        answer: "Lithium (Li)", 
        explanation: "<b>Correct Answer:</b> Lithium (Li)<br>Lithium hydroxide (LiOH) is the least soluble hydroxide among alkali metals due to the high lattice energy of LiOH compared to the hydration energy.<br><br><b>Why other options are incorrect:</b><br><b>Sodium (Na):</b> Sodium hydroxide (NaOH) is highly soluble in water.<br><b>Potassium (K):</b> Potassium hydroxide (KOH) is even more soluble than NaOH.<br><b>Rubidium (Rb):</b> Rubidium hydroxide (RbOH) is extremely soluble in water."
    },
    { 
        question: "Which alkali metal is used in the manufacture of heat-resistant glass?", 
        options: ["Lithium (Li)", "Sodium (Na)", "Potassium (K)", "Cesium (Cs)"], 
        answer: "Lithium (Li)", 
        explanation: "<b>Correct Answer:</b> Lithium (Li)<br>Lithium compounds, such as lithium carbonate (Li₂CO₃), are used in heat-resistant glass production because they reduce the melting point and improve thermal shock resistance.<br><br><b>Why other options are incorrect:</b><br><b>Sodium (Na):</b> Sodium is used in ordinary glass but not in heat-resistant glass.<br><b>Potassium (K):</b> Potassium is not commonly used in heat-resistant glass.<br><b>Cesium (Cs):</b> Cesium is not used in glass manufacturing due to its high cost and reactivity."
    },
    { 
        question: "Which alkali metal forms the most stable peroxide?", 
        options: ["Lithium (Li)", "Sodium (Na)", "Potassium (K)", "Rubidium (Rb)"], 
        answer: "Sodium (Na)", 
        explanation: "<b>Correct Answer:</b> Sodium (Na)<br>Sodium forms the most stable peroxide (Na₂O₂) due to its optimal ionic size and charge density.<br><br><b>Why other options are incorrect:</b><br><b>Lithium (Li):</b> Lithium forms only simple oxides, not peroxides.<br><b>Potassium (K):</b> Potassium forms peroxides, but they are less stable than sodium peroxides.<br><b>Rubidium (Rb):</b> Rubidium peroxides are even less stable than potassium peroxides."
    },
    { 
        question: "Which alkali metal is used in anti-depression medications?", 
        options: ["Lithium (Li)", "Sodium (Na)", "Potassium (K)", "Rubidium (Rb)"], 
        answer: "Lithium (Li)", 
        explanation: "<b>Correct Answer:</b> Lithium (Li)<br>Lithium salts, such as lithium carbonate, are widely used in medications for depression and bipolar disorder.<br><br><b>Why other options are incorrect:</b><br><b>Sodium (Na):</b> Sodium has no direct application in psychiatric treatments.<br><b>Potassium (K):</b> Potassium is essential for physiological functions but is not used in medications for depression.<br><b>Rubidium (Rb):</b> Rubidium has limited medical applications and is not used in psychiatric treatments."
    },
    { 
        question: "What is the product formed when alkali metals react with water?", 
        options: ["Metal Oxide", "Metal Hydroxide", "Metal Carbonate", "Metal Sulfate"], 
        answer: "Metal Hydroxide", 
        explanation: "<b>Correct Answer:</b> Metal Hydroxide<br>When alkali metals react with water, they form metal hydroxides and release hydrogen gas. For example: Na + H₂O → NaOH + H₂.<br><br><b>Why other options are incorrect:</b><br><b>Metal Oxide:</b> Metal oxides are formed when alkali metals react with oxygen, not water.<br><b>Metal Carbonate:</b> Metal carbonates are formed when alkali metals react with carbon dioxide or carbonate ions, not water.<br><b>Metal Sulfate:</b> Metal sulfates are formed when alkali metals react with sulfuric acid (H₂SO₄), not water."
    },
    { 
        question: "Which alkali metal is used in the treatment of bipolar disorder?", 
        options: ["Sodium (Na)", "Potassium (K)", "Lithium (Li)", "Rubidium (Rb)"], 
        answer: "Lithium (Li)", 
        explanation: "<b>Correct Answer:</b> Lithium (Li)<br>Lithium compounds, particularly lithium carbonate, are widely used as mood stabilizers in the treatment of bipolar disorder.<br><br><b>Why other options are incorrect:</b><br><b>Sodium (Na):</b> Sodium is essential for physiological functions but is not used as a treatment for bipolar disorder.<br><b>Potassium (K):</b> Potassium plays a vital role in maintaining cellular functions but does not have applications in psychiatric treatments.<br><b>Rubidium (Rb):</b> Rubidium has limited medical applications and is not used in treating bipolar disorder."
    },
    { 
        question: "Which alkali metal forms a superoxide when reacting with oxygen?", 
        options: ["Lithium (Li)", "Sodium (Na)", "Potassium (K)", "Rubidium (Rb)"], 
        answer: "Potassium (K)", 
        explanation: "<b>Correct Answer:</b> Potassium (K)<br>Potassium reacts with oxygen to form a superoxide (KO₂), which contains the superoxide ion (O₂⁻). This ability is due to potassium's larger atomic size and lower ionization energy.<br><br><b>Why other options are incorrect:</b><br><b>Lithium (Li):</b> Lithium reacts with oxygen to form a simple oxide (Li₂O), not a superoxide.<br><b>Sodium (Na):</b> Sodium reacts with oxygen to form a peroxide (Na₂O₂), not a superoxide.<br><b>Rubidium (Rb):</b> Rubidium can form superoxides like potassium, but potassium is more commonly used for this reaction."
    },
    { 
        question: "What is the flame color observed when lithium is burned?", 
        options: ["Yellow", "Red", "Green", "Blue"], 
        answer: "Red", 
        explanation: "<b>Correct Answer:</b> Red<br>Lithium burns with a red flame due to the excitation of electrons in the lithium atoms and subsequent emission of light in the red region of the spectrum.<br><br><b>Why other options are incorrect:</b><br><b>Yellow:</b> Yellow flame is characteristic of sodium, not lithium.<br><b>Green:</b> Green flame is typically observed for elements like barium or boron compounds.<br><b>Blue:</b> Blue flame is observed for copper or certain hydrocarbons, but not lithium."
    },
    { 
        question: "What is the trend of melting points in alkali metals?", 
        options: ["Increases down the group", "Decreases down the group", "No trend", "Varies irregularly"], 
        answer: "Decreases down the group", 
        explanation: "<b>Correct Answer:</b> Decreases down the group<br>The melting points of alkali metals decrease down the group due to weaker metallic bonding as atomic size increases.<br><br><b>Why other options are incorrect:</b><br><b>Increases down the group:</b> This is incorrect as alkali metals show a decreasing trend in melting points due to weaker bonds in larger atoms.<br><b>No trend:</b> There is a clear trend, so this option is incorrect.<br><b>Varies irregularly:</b> The melting points follow a predictable trend and do not vary irregularly."
    },
    { 
        question: "Which alkali metal reacts most vigorously with water?", 
        options: ["Lithium (Li)", "Sodium (Na)", "Potassium (K)", "Cesium (Cs)"], 
        answer: "Cesium (Cs)", 
        explanation: "<b>Correct Answer:</b> Cesium (Cs)<br>Cesium reacts most vigorously with water because it has the largest atomic size among alkali metals, resulting in the lowest ionization energy. This makes it easier for cesium to lose its outermost electron, leading to an extremely exothermic reaction.<br><br><b>Why other options are incorrect:</b><br><b>Lithium (Li):</b> Lithium reacts the least vigorously with water due to its small atomic size, which gives it the highest ionization energy among alkali metals.<br><b>Sodium (Na):</b> Sodium reacts moderately with water, producing hydrogen gas and sodium hydroxide (NaOH), but it is less reactive than cesium.<br><b>Potassium (K):</b> Potassium is more reactive than sodium but still less reactive than cesium due to its smaller atomic size compared to cesium."
    },
    { 
        question: "What is the flame color observed when sodium is burned?", 
        options: ["Yellow", "Red", "Green", "Blue"], 
        answer: "Yellow", 
        explanation: "<b>Correct Answer:</b> Yellow<br>Sodium imparts a bright yellow color to the flame due to the excitation of electrons to higher energy levels. When these electrons return to their ground state, they emit light in the yellow region of the visible spectrum.<br><br><b>Why other options are incorrect:</b><br><b>Red:</b> A red flame is typically observed for elements like lithium or strontium, not sodium.<br><b>Green:</b> Green flame is characteristic of elements like barium or boron compounds.<br><b>Blue:</b> A blue flame is observed for elements like copper or certain hydrocarbons, but not for sodium."
    },
    { 
        question: "What is the general electronic configuration of alkali metals?", 
        options: ["ns¹", "ns²", "np¹", "np²"], 
        answer: "ns¹",
        explanation: "<b>Correct Answer:</b> ns¹<br>The electronic configuration of alkali metals is ns¹, where 'n' represents the principal quantum number of the outermost shell. This configuration corresponds to the presence of a single electron in their outermost shell.<br><br><b>Why other options are incorrect:</b><br><b>ns²:</b> This configuration is characteristic of alkaline earth metals, not alkali metals.<br><b>np¹:</b> This configuration corresponds to elements in the p-block, such as boron or aluminum.<br><b>np²:</b> This configuration is also characteristic of p-block elements, such as carbon or silicon, not alkali metals."
    },
    { 
        question: "Which alkali metal is the most abundant in Earth's crust?", 
        options: ["Lithium (Li)", "Sodium (Na)", "Potassium (K)", "Rubidium (Rb)"], 
        answer: "Sodium (Na)", 
        explanation: "<b>Correct Answer:</b> Sodium (Na)<br>Sodium is the most abundant alkali metal in Earth's crust, primarily found in the form of sodium chloride (NaCl) in oceans and salt deposits.<br><br><b>Why other options are incorrect:</b><br><b>Lithium (Li):</b> Lithium is much less abundant in the Earth's crust compared to sodium and is primarily found in minerals like spodumene.<br><b>Potassium (K):</b> Potassium is more abundant than lithium but less abundant than sodium. It is commonly found in feldspar and other minerals.<br><b>Rubidium (Rb):</b> Rubidium is a trace element in the Earth's crust and is much less abundant than sodium, potassium, or lithium."
    },
    { 
        question: "What is the trend of reactivity in alkali metals?", 
        options: ["Increases down the group", "Decreases down the group", "No trend", "Varies irregularly"], 
        answer: "Increases down the group", 
        explanation: "<b>Correct Answer:</b> Increases down the group<br>The reactivity of alkali metals increases down the group due to their larger atomic size and lower ionization energy, which makes it easier for them to lose their outermost electron.<br><br><b>Why other options are incorrect:</b><br><b>Decreases down the group:</b> This is incorrect because smaller alkali metals like lithium are less reactive than larger ones like cesium.<br><b>No trend:</b> There is a clear trend of increasing reactivity down the group, so this option is incorrect.<br><b>Varies irregularly:</b> Reactivity follows a predictable trend and does not vary irregularly in alkali metals."
    },
    { 
        question: "Which alkali metal is the lightest element?", 
        options: ["Lithium (Li)", "Sodium (Na)", "Potassium (K)", "Rubidium (Rb)"], 
        answer: "Lithium (Li)", 
        explanation: "Lithium is the lightest alkali metal and has the lowest atomic mass among the alkali metals (approximately 6.94 g/mol)." 
    },
    { 
        question: "What is the oxidation state of alkali metals in their compounds?", 
        options: ["+1", "+2", "0", "-1"], 
        answer: "+1", 
        explanation: "Alkali metals always show a +1 oxidation state in their compounds because they have one electron in their outermost shell, which they readily lose to form cations." 
    },
    { 
        question: "Which alkali metal reacts most vigorously with water?", 
        options: ["Lithium (Li)", "Sodium (Na)", "Potassium (K)", "Cesium (Cs)"], 
        answer: "Cesium (Cs)", 
        explanation: "Cesium reacts most vigorously with water due to its larger atomic size and lower ionization energy, making the reaction highly exothermic." 
    },
    { 
        question: "What is the flame color observed when sodium is burned?", 
        options: ["Yellow", "Red", "Green", "Blue"], 
        answer: "Yellow", 
        explanation: "Sodium imparts a bright yellow color to the flame due to the excitation of electrons and subsequent emission of light in the yellow region." 
    },
    { 
        question: "Which alkali metal is used in the treatment of bipolar disorder?", 
        options: ["Sodium (Na)", "Potassium (K)", "Lithium (Li)", "Rubidium (Rb)"], 
        answer: "Lithium (Li)", 
        explanation: "Lithium compounds, particularly lithium carbonate, are widely used in the treatment of bipolar disorder as mood stabilizers." 
    },
    { 
        question: "What is the general electronic configuration of alkali metals?", 
        options: ["ns¹", "ns²", "np¹", "np²"], 
        answer: "ns¹", 
        explanation: "Alkali metals have a general electronic configuration of ns¹, where 'n' represents the principal quantum number of the outermost shell." 
    },
    { 
        question: "Which alkali metal is the most abundant in Earth's crust?", 
        options: ["Lithium (Li)", "Sodium (Na)", "Potassium (K)", "Rubidium (Rb)"], 
        answer: "Sodium (Na)", 
        explanation: "Sodium is the most abundant alkali metal in Earth's crust and is primarily found in the form of sodium chloride (NaCl)." 
    },
    { 
        question: "What is the product formed when alkali metals react with water?", 
        options: ["Metal Oxide", "Metal Hydroxide", "Metal Carbonate", "Metal Sulfate"], 
        answer: "Metal Hydroxide", 
        explanation: "When alkali metals react with water, they form metal hydroxides and release hydrogen gas. For example, Na + H₂O → NaOH + H₂." 
    },
    { 
        question: "Which alkali metal forms a superoxide when reacting with oxygen?", 
        options: ["Lithium (Li)", "Sodium (Na)", "Potassium (K)", "Rubidium (Rb)"], 
        answer: "Potassium (K)", 
        explanation: "Potassium reacts with oxygen to form a superoxide (KO₂) due to its larger atomic size and ability to stabilize the superoxide ion (O₂⁻)." 
    },
    { 
        question: "What is the characteristic property of alkali metals in terms of density?", 
        options: ["High Density", "Low Density", "Medium Density", "Variable Density"], 
        answer: "Low Density", 
        explanation: "Alkali metals have low density compared to other metals due to their large atomic size and relatively low atomic mass." 
    },
        ],
    "EXAM002": [
    {
        question: "Which separation technique is most suitable for separating a mixture of two volatile liquids with a large difference in boiling points?",
        options: ["Simple Distillation", "Fractional Distillation", "Sublimation", "Chromatography"],
        answer: "Simple Distillation",
        explanation: "<b>Correct Answer:</b> Simple Distillation<br>Simple distillation is used when the boiling point difference between two volatile liquids is greater than 25°C. It separates the liquids based on their boiling points.<br><br><b>Why other options are incorrect:</b><br><b>Fractional Distillation:</b> Fractional distillation is used for separating liquids with close boiling points (less than 25°C difference).<br><b>Sublimation:</b> Sublimation is used to separate solids that sublimate directly into gas, not volatile liquids.<br><b>Chromatography:</b> Chromatography is used for separating components of a mixture based on their movement through a stationary phase, not for volatile liquid mixtures."
    },
    {
        question: "Which separation technique is best for purifying a solid that sublimes on heating?",
        options: ["Sublimation", "Crystallization", "Distillation", "Extraction"],
        answer: "Sublimation",
        explanation: "<b>Correct Answer:</b> Sublimation<br>Sublimation is used to purify solids that change directly from solid to gas upon heating, bypassing the liquid phase. Examples include iodine and naphthalene.<br><br><b>Why other options are incorrect:</b><br><b>Crystallization:</b> Crystallization is used for purifying solids that dissolve in solvents and recrystallize upon cooling, not subliming solids.<br><b>Distillation:</b> Distillation is used for separating liquids based on boiling points, not solids.<br><b>Extraction:</b> Extraction is used to separate components based on solubility in different solvents, not for subliming solids."
    },
    {
        question: "What principle is chromatography based on?",
        options: ["Boiling point differences", "Differential solubility", "Magnetic properties", "Particle size"],
        answer: "Differential solubility",
        explanation: "<b>Correct Answer:</b> Differential solubility<br>Chromatography separates components of a mixture based on their differing solubilities in the stationary and mobile phases.<br><br><b>Why other options are incorrect:</b><br><b>Boiling point differences:</b> Boiling point differences are the basis of distillation, not chromatography.<br><b>Magnetic properties:</b> Magnetic properties are used in magnetic separation, not chromatography.<br><b>Particle size:</b> Particle size is a factor in filtration, not chromatography."
    },
    {
        question: "Which separation technique is used to separate immiscible liquids?",
        options: ["Separating Funnel", "Distillation", "Filtration", "Crystallization"],
        answer: "Separating Funnel",
        explanation: "<b>Correct Answer:</b> Separating Funnel<br>Immiscible liquids, such as oil and water, can be separated using a separating funnel based on their densities.<br><br><b>Why other options are incorrect:</b><br><b>Distillation:</b> Distillation is used for separating miscible liquids based on boiling points, not immiscible liquids.<br><b>Filtration:</b> Filtration is used for separating solids from liquids, not immiscible liquids.<br><b>Crystallization:</b> Crystallization is used to purify solids, not to separate liquids."
    },
    {
        question: "What is the purpose of adding activated charcoal during recrystallization?",
        options: ["To remove colored impurities", "To increase solubility", "To reduce evaporation", "To act as a catalyst"],
        answer: "To remove colored impurities",
        explanation: "<b>Correct Answer:</b> To remove colored impurities<br>Activated charcoal adsorbs colored impurities from the solution, ensuring a pure recrystallized product.<br><br><b>Why other options are incorrect:</b><br><b>To increase solubility:</b> Activated charcoal does not affect solubility.<br><b>To reduce evaporation:</b> Activated charcoal does not reduce evaporation.<br><b>To act as a catalyst:</b> Activated charcoal is not a catalyst in recrystallization."
    },
    {
        question: "Which method is most suitable for separating a mixture of a solid and a liquid when the solid is insoluble?",
        options: ["Filtration", "Distillation", "Extraction", "Crystallization"],
        answer: "Filtration",
        explanation: "<b>Correct Answer:</b> Filtration<br>Filtration separates insoluble solids from liquids by passing the mixture through a porous medium like filter paper.<br><br><b>Why other options are incorrect:</b><br><b>Distillation:</b> Distillation is used for separating liquid mixtures, not insoluble solids.<br><b>Extraction:</b> Extraction separates components based on solubility in different solvents, not insoluble solids.<br><b>Crystallization:</b> Crystallization purifies solids that dissolve in solvents, not insoluble solids."
    },
    {
        question: "Which separation technique is used to obtain pure water from a saltwater solution?",
        options: ["Distillation", "Filtration", "Chromatography", "Sublimation"],
        answer: "Distillation",
        explanation: "<b>Correct Answer:</b> Distillation<br>Distillation separates water from saltwater by evaporating the water and condensing it back to liquid form, leaving the salt behind.<br><br><b>Why other options are incorrect:</b><br><b>Filtration:</b> Filtration cannot separate dissolved salts from water.<br><b>Chromatography:</b> Chromatography is not used for separating water from salts.<br><b>Sublimation:</b> Sublimation is used for solids that sublime, not for liquid separation."
    },
    {
        question: "What is the stationary phase in paper chromatography?",
        options: ["Water in the paper", "The solvent", "The glass plate", "The sample"],
        answer: "Water in the paper",
        explanation: "<b>Correct Answer:</b> Water in the paper<br>The stationary phase in paper chromatography is water molecules trapped in the cellulose fibers of the paper.<br><br><b>Why other options are incorrect:</b><br><b>The solvent:</b> The solvent is the mobile phase, not the stationary phase.<br><b>The glass plate:</b> The glass plate is not involved in paper chromatography.<br><b>The sample:</b> The sample is what is being separated, not the stationary phase."
    },
    {
        question: "Which technique is used to separate pigments in ink?",
        options: ["Paper Chromatography", "Filtration", "Distillation", "Crystallization"],
        answer: "Paper Chromatography",
        explanation: "<b>Correct Answer:</b> Paper Chromatography<br>Paper chromatography separates pigments in ink based on their solubility and affinity for the stationary and mobile phases.<br><br><b>Why other options are incorrect:</b><br><b>Filtration:</b> Filtration cannot separate dissolved pigments.<br><b>Distillation:</b> Distillation is not suitable for separating pigments.<br><b>Crystallization:</b> Crystallization is used to purify solids, not to separate pigments."
    },
    {
        question: "Which separation technique involves the use of a Soxhlet apparatus?",
        options: ["Extraction", "Distillation", "Filtration", "Sublimation"],
        answer: "Extraction",
        explanation: "<b>Correct Answer:</b> Extraction<br>The Soxhlet apparatus is used for extracting a compound from a solid using a solvent. This is commonly employed in organic extractions.<br><br><b>Why other options are incorrect:</b><br><b>Distillation:</b> Distillation is not performed using a Soxhlet apparatus.<br><b>Filtration:</b> Filtration does not use a Soxhlet apparatus.<br><b>Sublimation:</b> Sublimation does not involve a Soxhlet apparatus."
    },
        
    { 
        question: "What is the primary purpose of centrifugation in the separation of mixtures?", 
        options: ["To separate suspended particles from a solution", "To separate immiscible liquids", "To purify solids based on solubility", "To remove volatile components"], 
        answer: "To separate suspended particles from a solution", 
        explanation: "Centrifugation is used to separate suspended particles from a solution by spinning them at high speeds.<br>Other options describe techniques for separating immiscible liquids, purifying solids, or removing volatile components." 
    },
    { 
        question: "In chromatography, what determines the separation of compounds?", 
        options: ["Their affinity for the mobile and stationary phases", "Their boiling points", "Their solubility in water", "Their density differences"], 
        answer: "Their affinity for the mobile and stationary phases", 
        explanation: "Chromatography separates compounds based on their differing affinities for the mobile and stationary phases.<br>Other options misinterpret the separation mechanism by referencing boiling points, solubility, or density." 
    },
    { 
        question: "During solvent extraction, what does a low partition coefficient (Kₐ) indicate?", 
        options: ["The solute prefers the aqueous solvent over the organic solvent", "The solute prefers the organic solvent over the aqueous solvent", "The solute is equally distributed between the solvents", "The solute remains insoluble in both solvents"], 
        answer: "The solute prefers the aqueous solvent over the organic solvent", 
        explanation: "A low Kₐ value indicates that the solute has a stronger affinity for the aqueous solvent compared to the organic solvent.<br>Other options misinterpret the significance of Kₐ or describe incorrect scenarios." 
    },
    { 
        question: "Which technique uses steam to separate immiscible organic compounds?", 
        options: ["Steam distillation", "Simple distillation", "Fractional distillation", "Sublimation"], 
        answer: "Steam distillation", 
        explanation: "Steam distillation uses steam to separate immiscible organic compounds.<br>Simple distillation and fractional distillation separate based on boiling points.<br>Sublimation separates solids that transition directly to gas." 
    },
    { 
        question: "What is the purpose of using a fractionating column in fractional distillation?",
        options: ["To increase the efficiency of separation by repeated condensation and vaporization", "To lower the boiling point of the mixture", "To remove impurities from the liquid", "To facilitate sublimation"], 
        answer: "To increase the efficiency of separation by repeated condensation and vaporization", 
        explanation: "A fractionating column increases the efficiency of separation by providing surfaces for repeated condensation and vaporization.<br>Other options misinterpret the function of the column or describe unrelated processes." 
    },
    { 
        question: "What happens to the boiling point of components in steam distillation?", 
        options: ["The boiling point is lowered due to combined vapor pressures", "The boiling point remains unchanged", "The boiling point increases due to higher atmospheric pressure", "The boiling point is determined solely by the organic compound"], 
        answer: "The boiling point is lowered due to combined vapor pressures", 
        explanation: "In steam distillation, the boiling point of components is lowered because the combined vapor pressures exceed the atmospheric pressure.<br>Other options incorrectly attribute the change to atmospheric pressure, solubility, or the organic compound alone." 
    },
    { 
        question: "Which technique is used to separate mixtures based on their boiling points?", 
        options: ["Simple distillation", "Filtration", "Centrifugation", "Chromatography"], 
        answer: "Simple distillation", 
        explanation: "Simple distillation separates mixtures based on their boiling points.<br>Filtration separates solids from liquids.<br>Centrifugation separates suspended particles.<br>Chromatography separates based on affinity." 
    },
    { 
        question: "In solvent extraction, what does the partition coefficient (Kₐ) express?", 
        options: ["The ratio of solute concentration in two immiscible solvents", "The boiling point difference between two solvents", "The density difference between solvents", "The solubility of the solute in one solvent"], 
        answer: "The ratio of solute concentration in two immiscible solvents", 
        explanation: "Kₐ represents the ratio of solute concentration in two immiscible solvents.<br>Other options misinterpret the concept by referencing boiling points, density, or solubility." 
    },
    {         question: "If Kₐ = 10, what is the distribution ratio of solute concentration between solvent X and solvent Y?", 
        options: ["10:1", "1:10", "5:5", "20:2"], 
        answer: "10:1", 
        explanation: "Kₐ = 10 means the solute concentration in solvent X is 10 times higher than in solvent Y.<br>Other options incorrectly interpret the coefficient or reverse the ratio." 
    },
    { 
        question: "A solution contains 20 g of organic compound A in 200 cm³ of water. When 80 cm³ of ether is added (Kₐ = 10), what is the mass of A transferred to the ether layer?", 
        options: ["12.5 g", "10 g", "7.5 g", "13 g"], 
        answer: "12.5 g", 
        explanation: "Using the formula:<br>Kₐ = (mass in ether ÷ volume of ether) ÷ (mass in water ÷ volume of water),<br>The mass of A transferred to the ether layer is calculated as 12.5 g.<br>Other options result from errors in formula application or assumptions." 
    },
    { 
        question: "Why is batch extraction more effective than single extraction?", 
        options: ["It increases the total mass of solute extracted", "It reduces the vapor pressure of the solvents", "It minimizes solvent usage", "It decreases the boiling point of the solvents"], 
        answer: "It increases the total mass of solute extracted", 
        explanation: "Batch extraction redistributes the solute between solvents more effectively, resulting in higher total extraction.<br>Other options describe unrelated effects or incorrect assumptions." 
    },
    { 
        question: "What happens to the solubility of a solute in recrystallization as the temperature decreases?", 
        options: ["The solubility decreases, allowing the solute to crystallize", "The solubility increases, dissolving more solute", "The solubility remains constant", "The solubility fluctuates unpredictably"], 
        answer: "The solubility decreases, allowing the solute to crystallize", 
        explanation: "As the temperature decreases, the solubility of the solute decreases, causing it to crystallize out of the solution.<br>Other options misinterpret the relationship between temperature and solubility." 
    },
    { 
        question: "What is the molecular mass of compound A if mₐ = 15 g, Pₐ = 30 mmHg, Pₕ₂ₒ = 720 mmHg, Mₕ₂ₒ = 18 g/mol, and mₕ₂ₒ = 50 g?", 
        options: ["129.60 g/mol", "135.90 g/mol", "125.40 g/mol", "140.00 g/mol"], 
        answer: "129.60 g/mol", 
        explanation: "Using the formula:<br>Mₐ = (mₐ × Pₕ₂ₒ × Mₕ₂ₒ) / (Pₐ × mₕ₂ₒ),<br>Mₐ = (15 × 720 × 18) / (30 × 50) = 129.60 g/mol.<br>Other options arise from calculation errors or incorrect formula application." 
    },
    { 
        question: "In solvent extraction, what is the effect of increasing the volume of the organic solvent?", 
        options: ["It increases the amount of solute extracted into the organic solvent", "It decreases the partition coefficient (Kₐ)", "It reduces the solubility of the solute", "It increases the boiling point of the organic solvent"], 
        answer: "It increases the amount of solute extracted into the organic solvent", 
        explanation: "Increasing the volume of the organic solvent generally increases the amount of solute extracted into it.<br>Other options incorrectly describe the effects on Kₐ, solubility, or boiling point." 
    },
    { 
        question: "Which technique is used to separate compounds based on their affinity for mobile and stationary phases?", 
        options: ["Chromatography", "Filtration", "Centrifugation", "Evaporation"], 
        answer: "Chromatography", 
        explanation: "Chromatography separates compounds based on their differing affinities for the mobile and stationary phases.<br>Filtration separates solids from liquids.<br>Centrifugation separates suspended particles.<br>Evaporation removes liquids from mixtures." 
    },
    { 
        question: "Why is steam distillation preferred for separating heat-sensitive compounds?", 
        options: ["It allows separation at lower temperatures", "It increases the boiling point of the mixture", "It removes impurities effectively", "It enhances solubility of the compounds"], 
        answer: "It allows separation at lower temperatures", 
        explanation: "Steam distillation allows separation at lower temperatures, preventing decomposition of heat-sensitive compounds.<br>Other options misinterpret the benefits or describe unrelated processes." 
    },
    { 
        question: "What is the primary advantage of using fractional distillation over simple distillation?", 
        options: ["It provides better separation for components with close boiling points", "It requires less energy", "It is faster", "It can separate immiscible liquids"], 
        answer: "It provides better separation for components with close boiling points", 
        explanation: "Fractional distillation provides better separation for components with close boiling points due to the use of a fractionating column.<br>Other options incorrectly describe the advantages or misinterpret the technique." 
    },
    { 
        question: "Which technique is used to separate suspended particles from a solution?", 
        options: ["Centrifugation", "Filtration", "Recrystallization", "Chromatography"], 
        answer: "Centrifugation", 
        explanation: "Centrifugation separates suspended particles from a solution by spinning them at high speeds.<br>Filtration separates solids from liquids.<br>Recrystallization purifies solids.<br>Chromatography separates compounds based on affinity." 
    },
    { 
        question: "In steam distillation, if the atmospheric pressure is 760 mmHg and the vapor pressure of water is 720 mmHg, what is the vapor pressure of the organic compound?", 
        options: ["40 mmHg", "720 mmHg", "760 mmHg", "780 mmHg"], 
        answer: "40 mmHg", 
        explanation: "The vapor pressure of the organic compound is calculated as:<br>760 mmHg (atmospheric pressure) - 720 mmHg (vapor pressure of water) = 40 mmHg.<br>Other options arise from misinterpretation or incorrect subtraction." 
    },
    { 
        question: "What is the molecular mass of compound B if mₐ = 20 g, Pₐ = 25 mmHg, Pₕ₂ₒ = 750 mmHg, Mₕ₂ₒ = 18 g/mol, and mₕ₂ₒ = 55 g?", 
        options: ["196.4 g/mol", "130.50 g/mol", "118.20 g/mol", "135.00 g/mol"], 
        answer: "196.4 g/mol", 
        explanation: "Using the formula:<br>Mₐ = (mₐ × Pₕ₂ₒ × Mₕ₂ₒ) / (Pₐ × mₕ₂ₒ),<br>Mₐ = (20 × 750 × 18) / (25 × 55) = 196.4 g/mol.<br>Other options arise from calculation errors or incorrect formula application." 
    },
    { 
        question: "Which technique is suitable for separating liquid mixtures with boiling points close to one another?", 
        options: ["Fractional distillation", "Simple distillation", "Steam distillation", "Filtration"], 
        answer: "Fractional distillation", 
        explanation: "Fractional distillation is used for mixtures with boiling points close to one another as it utilizes a fractionating column for effective separation.<br>Simple distillation is used for mixtures with boiling points far apart.<br>Steam distillation separates immiscible compounds.<br>Filtration separates solids from liquids." 
    },
    { 
        question: "What is the significance of a fractionating column in fractional distillation?", 
        options: [
            "It increases the surface area for vapor condensation.", 
            "It reduces the boiling point of the mixture.", 
            "It allows sublimation of the compounds.", 
            "It removes impurities from the liquid."
        ], 
        answer: "It increases the surface area for vapor condensation.", 
        explanation: "The fractionating column increases the surface area for vapor condensation and re-evaporation, enhancing the separation of components.<br>Other options misinterpret the function of the column or describe unrelated processes." 
    },
    { 
        question: "Which technique is ideal for purifying a solid by removing insoluble impurities?", 
        options: ["Recrystallization", "Filtration", "Evaporation", "Chromatography"], 
        answer: "Recrystallization", 
        explanation: "Recrystallization purifies a solid by dissolving it in a solvent and allowing it to crystallize upon cooling.<br>Filtration separates solids from liquids.<br>Evaporation removes liquids.<br>Chromatography separates based on affinity." 
    },
    { 
        question: "In steam distillation, why does the boiling point of the mixture decrease?", 
        options: [
            "Due to the combined vapor pressure of immiscible components.", 
            "Due to the reduced atmospheric pressure.", 
            "Due to the high solubility of components.", 
            "Due to the sublimation of the solid component."
        ], 
        answer: "Due to the combined vapor pressure of immiscible components.",
        explanation: "The boiling point decreases because the combined vapor pressure of the immiscible components exceeds the atmospheric pressure.<br>Other options incorrectly attribute the change to solubility, sublimation, or atmospheric pressure changes." 
    },
    { 
        question: "What is the role of water in steam distillation?", 
        options: [
            "It provides steam to lower the boiling point of the mixture.", 
            "It acts as a solvent for the organic compound.", 
            "It removes impurities from the organic compound.", 
            "It increases the vapor pressure of the organic compound."
        ], 
        answer: "It provides steam to lower the boiling point of the mixture.", 
        explanation: "Water in steam distillation generates steam, which lowers the boiling point of the mixture by increasing the combined vapor pressure.<br>Other options misinterpret its role or describe unrelated functions." 
    },
    { 
        question: "In solvent extraction, what happens if the partition coefficient (Kₐ) is very high?", 
        options: [
            "The solute prefers the organic solvent over the aqueous solvent.", 
            "The solute is equally distributed between the two solvents.", 
            "The solute prefers the aqueous solvent over the organic solvent.", 
            "The solute remains insoluble in both solvents."
        ], 
        answer: "The solute prefers the organic solvent over the aqueous solvent.", 
        explanation: "A high Kₐ value indicates that the solute has a strong affinity for the organic solvent and prefers it over the aqueous solvent.<br>Other options misinterpret the significance of Kₐ or describe incorrect scenarios." 
    },
    { 
        question: "Which factor affects the efficiency of solvent extraction?", 
        options: [
            "The partition coefficient (Kₐ) of the solute.", 
            "The boiling point of the solvents.", 
            "The atmospheric pressure during extraction.", 
            "The density difference between solvents."
        ], 
        answer: "The partition coefficient (Kₐ) of the solute.", 
        explanation: "The efficiency of solvent extraction is primarily determined by the partition coefficient (Kₐ), which measures the solute's preference for one solvent over another.<br>Other factors like boiling point, atmospheric pressure, or density are secondary and less relevant." 
    },
    { 
        question: "Why is extraction in multiple batches more effective than single extraction?", 
        options: [
            "It increases the total mass of solute extracted.", 
            "It reduces the vapor pressure of the solvents.", 
            "It minimizes solvent usage.", 
            "It decreases the boiling point of the solvents."
        ], 
        answer: "It increases the total mass of solute extracted.", 
        explanation: "Batch extraction redistributes the solute between solvents more effectively, resulting in higher total extraction.<br>Other options describe unrelated effects or incorrect assumptions." 
    },
    { 
        question: "What happens to the solubility of a solute in recrystallization as the temperature decreases?", 
        options: [
            "The solubility decreases, allowing the solute to crystallize.", 
            "The solubility increases, dissolving more solute.", 
            "The solubility remains constant.", 
            "The solubility fluctuates unpredictably."
        ], 
        answer: "The solubility decreases, allowing the solute to crystallize.", 
        explanation: "As the temperature decreases, the solubility of the solute decreases, causing it to crystallize out of the solution.<br>Other options misinterpret the relationship between temperature and solubility." 
    },
    { 
        question: "What is the molecular mass of compound A if mₐ = 15 g, Pₐ = 30 mmHg, Pₕ₂ₒ = 720 mmHg, Mₕ₂ₒ = 18 g/mol, and mₕ₂ₒ = 50 g?", 
        options: ["129.60 g/mol", "135.90 g/mol", "125.40 g/mol", "140.00 g/mol"], 
        answer: "129.60 g/mol", 
        explanation: "Using the formula:<br>Mₐ = (mₐ × Pₕ₂ₒ × Mₕ₂ₒ) / (Pₐ × mₕ₂ₒ),<br>Mₐ = (15 × 720 × 18) / (30 × 50) = 129.60 g/mol.<br>Other options arise from calculation errors or incorrect formula application." 
    },
    { 
        question: "Which technique separates immiscible organic compounds using water vapor?", 
        options: ["Simple distillation", "Fractional distillation", "Steam distillation", "Chromatography"], 
        answer: "Steam distillation", 
        explanation: "Steam distillation is used to separate immiscible organic compounds by passing steam through the mixture.<br>Simple distillation is for mixtures with significantly different boiling points.<br>Fractional distillation is for mixtures with close boiling points.<br>Chromatography separates compounds based on their affinity for mobile and stationary phases." 
    },
    { 
        question: "When calculating the molecular mass of a compound in steam distillation, what is the role of water's molar mass (Mₕ₂ₒ)?", 
        options: [
            "It accounts for the proportional vapor pressure of water.", 
            "It balances the organic compound's mass.", 
            "It determines the boiling point of the mixture.", 
            "It is unrelated to the calculation."
        ], 
        answer: "It accounts for the proportional vapor pressure of water.", 
        explanation: "Water's molar mass (Mₕ₂ₒ) is used in the calculation to account for its proportional vapor pressure during the distillation.<br>Other options either misinterpret the role of Mₕ₂ₒ or describe unrelated factors." 
    },
    { 
        question: "A liquid mixture is subjected to distillation. If the vapor pressure of water is 740 mmHg and the atmospheric pressure is 760 mmHg, what is the vapor pressure of the organic compound?", 
        options: ["20 mmHg", "740 mmHg", "760 mmHg", "780 mmHg"], 
        answer: "20 mmHg", 
        explanation: "The vapor pressure of the organic compound is calculated as:<br>760 mmHg (atmospheric pressure) - 740 mmHg (vapor pressure of water) = 20 mmHg.<br>Other options arise from misinterpretation or incorrect subtraction." 
    },
    { 
        question: "Which separation technique is based on differences in solubility at varying temperatures?", 
        options: ["Recrystallization", "Filtration", "Centrifugation", "Sublimation"], 
        answer: "Recrystallization",
        explanation: "Recrystallization purifies solids by dissolving them in a solvent at high temperatures and allowing them to crystallize out upon cooling.<br>Filtration separates solids from liquids.<br>Centrifugation separates suspended particles.<br>Sublimation separates solids that transition directly to gas." 
    },
    { 
        question: "What does the partition coefficient (Kₐ) represent in solvent extraction?", 
        options: [
            "The ratio of solute concentration between two immiscible solvents.", 
            "The boiling point difference between solvents.", 
            "The density difference between solvents.", 
            "The solubility of the solute in one solvent."
        ], 
        answer: "The ratio of solute concentration between two immiscible solvents.", 
        explanation: "Kₐ represents the ratio of solute concentration in two immiscible solvents.<br>Other options misinterpret the concept by referencing boiling points, density, or solubility." 
    },
    { 
        question: "If Kₐ = 10, what is the distribution ratio of solute concentration between solvent X and solvent Y?", 
        options: ["10:1", "1:10", "5:5", "20:2"], 
        answer: "10:1", 
        explanation: "Kₐ = 10 means the solute concentration in solvent X is 10 times higher than in solvent Y.<br>Other options incorrectly interpret the coefficient or reverse the ratio." 
    },
    { 
        question: "A solution contains 20 g of organic compound A in 200 cm³ of water. When 80 cm³ of ether is added (Kₐ = 10), what is the mass of A transferred to the ether layer?", 
        options: ["12.5 g", "10 g", "7.5 g", "13 g"], 
        answer: "12.5 g", 
        explanation: "Using the formula:<br>Kₐ = (mass in ether ÷ volume of ether) ÷ (mass in water ÷ volume of water),<br>The mass of A transferred to the ether layer is calculated as 12.5 g.<br>Other options result from errors in formula application or assumptions." 
    },
    { 
        question: "Why is batch extraction more effective than single extraction?", 
        options: [
            "It maximizes the distribution of solute between solvents.", 
            "It minimizes solvent usage.", 
            "It reduces the boiling point of the solute.", 
            "It increases the solubility of the solute."
        ], 
        answer: "It maximizes the distribution of solute between solvents.", 
        explanation: "Batch extraction enhances the distribution of solute between solvents, increasing the total mass extracted.<br>Other options describe unrelated effects or incorrect assumptions." 
    },
    { 
        question: "Which technique is used to separate suspended particles from a solution or solvent?", 
        options: ["Centrifugation", "Filtration", "Chromatography", "Evaporation"], 
        answer: "Centrifugation", 
        explanation: "Centrifugation separates suspended particles by spinning them at high speeds.<br>Filtration separates solids from liquids.<br>Chromatography separates compounds based on affinity.<br>Evaporation removes liquids from mixtures." 
    },
    { 
        question: "What is the molecular mass of compound A if mₐ = 10 g, Pₐ = 20 mmHg, Pₕ₂ₒ = 740 mmHg, Mₕ₂ₒ = 18 g/mol, and mₕ₂ₒ = 60 g?", 
        options: ["121.89 g/mol", "115.42 g/mol", "130.00 g/mol", "111.00 g/mol"], 
        answer: "111.00 g/mol", 
        explanation: "Using the formula:<br>Mₐ = (mₐ × Pₕ₂ₒ × Mₕ₂ₒ) / (Pₐ × mₕ₂ₒ),<br>The molecular mass of compound A is calculated as:<br>Mₐ = (10 × 740 × 18) / (20 × 60) = 111.00 g/mol.<br>Other options result from calculation errors or incorrect formula application." 
    },
],

    "EXAM004": [
    { question: "If 16 cm³ of a gaseous hydrocarbon is mixed with 90 cm³ of oxygen, producing 32 cm³ of CO₂ and leaving 34 cm³ of residual oxygen, what is the molecular formula of the hydrocarbon?", options: ["C₃H₆", "C₂H₄", "C₃H₄", "C₄H₈"], answer: "C₃H₆", explanation: "The combustion reaction indicates that for every 1 mole of hydrocarbon, 3.5 moles of carbon dioxide and 6 moles of hydrogen would be produced, leading to the molecular formula C₃H₆.<br>Other options:<br>- C₂H₄: This suggests fewer hydrogen atoms than calculated.<br>- C₃H₄: This indicates fewer hydrogen atoms than actually present.<br>- C₄H₈: This formula suggests a larger hydrocarbon than the one analyzed." },

    { question: "How many moles of carbon dioxide are produced if the volume of CO₂ produced is 32 cm³?", options: ["0.00133 moles", "0.00267 moles", "0.0015 moles", "0.003 moles"], answer: "0.00133 moles", explanation: "To calculate moles: Volume in dm³ = 32 cm³ = 0.032 dm³. Moles = Volume / Molar Volume = 0.032 / 24 = 0.00133 moles.<br>Other options:<br>- 0.00267 moles: This value exceeds the calculated amount.<br>- 0.0015 moles: This does not match the calculated moles.<br>- 0.003 moles: This value is too high based on the volume given." },

    { question: "What are the balanced equations for the complete combustion of the hydrocarbon C₃H₈?", options: ["C₃H₈ + 5 O₂ → 3 CO₂ + 4 H₂O", "C₃H₈ + 4 O₂ → 3 CO₂ + 3 H₂O", "2 C₃H₈ + 7 O₂ → 6 CO₂ + 8 H₂O", "C₃H₈ + 3 O₂ → 3 CO₂ + 3 H₂O"], answer: "C₃H₈ + 5 O₂ → 3 CO₂ + 4 H₂O", explanation: "This represents the correct balanced equation for the combustion of propane (C₃H₈), producing carbon dioxide and water.<br>Other options:<br>- C₃H₈ + 4 O₂ → 3 CO₂ + 3 H₂O: This is not balanced correctly for propane.<br>- 2 C₃H₈ + 7 O₂ → 6 CO₂ + 8 H₂O: This is incorrect for the combustion of propane.<br>- C₃H₈ + 3 O₂ → 3 CO₂ + 3 H₂O: This does not reflect the correct stoichiometry." },

    { question: "If 0.33 g of acetanilide is used and the ammonia produced is collected in 50 cm³ of 0.50 M H₂SO₄, what is the molarity of the ammonia?", options: ["0.006 M", "0.025 M", "0.050 M", "0.067 M"], answer: "0.025 M", explanation: "The moles of H₂SO₄ used are calculated as 0.50 M × 0.050 L = 0.025 moles, indicating the same amount of ammonia produced.<br>Other options:<br>- 0.006 M: This is too low based on the calculations.<br>- 0.050 M: This value does not accurately reflect the dilution of ammonia.<br>- 0.067 M: This exceeds the calculated value based on the amount of acetanilide." },

    { question: "What is the balanced equation for the reaction of sodium carbonate with sulfuric acid?", options: ["Na₂CO₃ + H₂SO₄ → Na₂SO₄ + CO₂ + H₂O", "Na₂CO₃ + 2 H₂SO₄ → Na₂SO₄ + CO₂ + 2 H₂O", "Na₂CO₃ + H₂SO₄ → NaSO₄ + CO₂ + H₂O", "2 Na₂CO₃ + H₂SO₄ → 2 Na₂SO₄ + CO₂ + H₂O"], answer: "Na₂CO₃ + H₂SO₄ → Na₂SO₄ + CO₂ + H₂O", explanation: "This equation correctly represents the reaction of sodium carbonate with sulfuric acid, producing sodium sulfate, carbon dioxide, and water.<br>Other options:<br>- Na₂CO₃ + 2 H₂SO₄ → Na₂SO₄ + CO₂ + 2 H₂O: This is not balanced correctly for the stoichiometry.<br>- Na₂CO₃ + H₂SO₄ → NaSO₄ + CO₂ + H₂O: This does not properly represent the coefficients of sodium sulfate.<br>- 2 Na₂CO₃ + H₂SO₄ → 2 Na₂SO₄ + CO₂ + H₂O: This is incorrect and does not balance properly." },

    { question: "Which equation represents the reaction for determining the nitrogen content using the Kjeldahl method?", options: ["N₂ + H₂ → NH₃", "NH₄Cl + NaOH → NH₃ + NaCl + H₂O", "2 NH₃ + H₂SO₄ → (NH₄)₂SO₄", "NH₃ + HCl → NH₄Cl"], answer: "NH₄Cl + NaOH → NH₃ + NaCl + H₂O", explanation: "This equation represents the reaction in the Kjeldahl method where ammonium chloride reacts with sodium hydroxide to produce ammonia, which is quantified.<br>Other options:<br>- N₂ + H₂ → NH₃: This is not the reaction relevant to the Kjeldahl method.<br>- 2 NH₃ + H₂SO₄ → (NH₄)₂SO₄: This is not part of the Kjeldahl determination process.<br>- NH₃ + HCl → NH₄Cl: This is not the reaction used for nitrogen quantification." },

    { question: "What is the balanced equation for the reaction of sulfur with oxygen?", options: ["S + O₂ → SO₂", "S + HNO₃ → H₂SO₄", "SO₂ + H₂O → H₂SO₃", "H₂S + O₂ → SO₂ + H₂O"], answer: "S + O₂ → SO₂", explanation: "This equation represents the combustion of sulfur in the presence of oxygen to form sulfur dioxide (SO₂), which is used to quantify sulfur in organic compounds.<br>Other options:<br>- S + HNO₃ → H₂SO₄: This reaction is not specifically for determining sulfur content.<br>- SO₂ + H₂O → H₂SO₃: This is not a method for quantifying sulfur.<br>- H₂S + O₂ → SO₂ + H₂O: This represents a different reaction involving hydrogen sulfide." },

    { question: "What is the correct balanced equation for the combustion of C₃H₈?", options: ["C₃H₈ + 5 O₂ → 3 CO₂ + 4 H₂O", "C₃H₈ + 4 O₂ → 3 CO₂ + 3 H₂O", "2 C₃H₈ + 7 O₂ → 6 CO₂ + 8 H₂O", "C₃H₈ + 3 O₂ → 3 CO₂ + 3 H₂O"], answer: "C₃H₈ + 5 O₂ → 3 CO₂ + 4 H₂O", explanation: "This balanced equation accurately represents the complete combustion of propane (C₃H₈), producing carbon dioxide and water.<br>Other options:<br>- C₃H₈ + 4 O₂ → 3 CO₂ + 3 H₂O: This is not balanced correctly.<br>- 2 C₃H₈ + 7 O₂ → 6 CO₂ + 8 H₂O: This is incorrect for the combustion of propane.<br>- C₃H₈ + 3 O₂ → 3 CO₂ + 3 H₂O: This does not reflect the correct stoichiometry." },
    { question: "What is the balanced equation for the reaction of sodium with sulfur to form sodium sulfide?", options: ["2 Na + S → Na₂S", "Na + S → NaS", "Na + S → Na₂S₂", "2 Na + S → NaS₂"], answer: "2 Na + S → Na₂S", explanation: "The balanced equation shows that two sodium (Na) atoms react with one sulfur (S) atom to form sodium sulfide (Na₂S).<br>Other options:<br>- Na + S → NaS: This is not correctly balanced for sodium sulfide formation.<br>- Na + S → Na₂S₂: This compound does not exist and is not formed in this reaction.<br>- 2 Na + S → NaS₂: This does not represent the correct stoichiometry of the reaction." },

    { question: "What is the correct equation for the formation of sodium cyanide from sodium and nitrogen?", options: ["Na + N₂ → NaN", "3 Na + N₂ → Na₃N", "Na + C + N → NaCN", "2 Na + N → Na₂N"], answer: "Na + C + N → NaCN", explanation: "This equation correctly represents the reaction of sodium with carbon and nitrogen to form sodium cyanide (NaCN).<br>Other options:<br>- Na + N₂ → NaN: This does not accurately represent the product formed in the sodium fusion test.<br>- 3 Na + N₂ → Na₃N: This compound does not relate to the sodium fusion test for nitrogen.<br>- 2 Na + N → Na₂N: This compound also does not exist in this context." },

    { question: "What is the balanced equation for the reaction of sodium sulfide with hydrochloric acid?", options: ["Na₂S + 2 HCl → 2 NaCl + H₂S", "NaS + HCl → NaCl + H₂S", "Na₂S + HCl → NaCl + H₂S", "Na₂S + 2 HCl → NaCl + H₂S"], answer: "Na₂S + 2 HCl → 2 NaCl + H₂S", explanation: "This balanced equation shows that sodium sulfide (Na₂S) reacts with hydrochloric acid (HCl) to produce sodium chloride (NaCl) and hydrogen sulfide gas (H₂S).<br>Other options:<br>- NaS + HCl → NaCl + H₂S: This is not balanced and does not represent the correct stoichiometry.<br>- Na₂S + HCl → NaCl + H₂S: This is not balanced as it does not account for the number of sodium ions produced.<br>- Na₂S + 2 HCl → NaCl + H₂S: This is also not balanced correctly." },

    { question: "What is the correct balanced equation for the reaction of sodium with water?", options: ["2 Na + 2 H₂O → 2 NaOH + H₂", "Na + H₂O → NaOH + H₂", "2 Na + H₂O → Na₂O + H₂", "Na + 2 H₂O → NaOH + H₂"], answer: "2 Na + 2 H₂O → 2 NaOH + H₂", explanation: "In this balanced equation, sodium (Na) reacts with water (H₂O) to form sodium hydroxide (NaOH) and hydrogen gas (H₂).<br>Other options:<br>- Na + H₂O → NaOH + H₂: This is not balanced as it does not account for the number of sodium atoms.<br>- 2 Na + H₂O → Na₂O + H₂: This would imply the formation of sodium oxide, which is incorrect for this reaction.<br>- Na + 2 H₂O → NaOH + H₂: This is not balanced correctly as it does not account for the number of water molecules." },

    { question: "What is the balanced equation for the reaction of sodium with chlorine gas?", options: ["2 Na + Cl₂ → 2 NaCl", "Na + Cl → NaCl", "2 Na + Cl → Na₂Cl", "Na + Cl₂ → NaCl"], answer: "2 Na + Cl₂ → 2 NaCl", explanation: "This balanced equation shows that sodium (Na) reacts with chlorine gas (Cl₂) to form sodium chloride (NaCl).<br>Other options:<br>- Na + Cl → NaCl: This is not balanced as it does not account for the number of chlorine atoms.<br>- 2 Na + Cl → Na₂Cl: This compound does not exist and is not formed in this reaction.<br>- Na + Cl₂ → NaCl: This is not balanced as it does not account for the number of sodium atoms." },

    { question: "What is the balanced equation for the formation of lead sulfide when testing for sulfur?", options: ["Pb + S → PbS", "2 Pb + S → Pb₂S", "Pb + Na₂S → PbS + Na", "2 Pb + Na₂S → 2 PbS + Na"], answer: "Pb + S → PbS", explanation: "This balanced equation shows that lead (Pb) reacts with sulfur (S) to form lead sulfide (PbS).<br>Other options:<br>- 2 Pb + S → Pb₂S: This compound does not exist in this context.<br>-Pb + Na₂S → PbS + Na: This is not a direct reaction for the formation of lead sulfide.<br>- 2 Pb + Na₂S → 2 PbS + Na: This is not the correct stoichiometry for the formation of lead sulfide." },

    { question: "What is the balanced equation for the reaction of silver nitrate with sodium halides?", options: ["AgNO₃ + NaX → AgX + NaNO₃", "Ag + NaX → AgX + Na", "AgNO₃ + NaCl → AgCl + NaNO₃", "AgNO₃ + NaBr → AgBr + NaNO₃"], answer: "AgNO₃ + NaX → AgX + NaNO₃", explanation: "This general equation represents the reaction of silver nitrate with any sodium halide (NaX) to form the respective silver halide (AgX) and sodium nitrate (NaNO₃).<br>Other options:<br>- Ag + NaX → AgX + Na: This does not involve silver nitrate and does not represent the correct reaction.<br>- AgNO₃ + NaCl → AgCl + NaNO₃: This is a specific case of the general equation but does not represent all halides.<br>- AgNO₃ + NaBr → AgBr + NaNO₃: This is another specific case but does not represent the general reaction with halides." },

    { question: "What is the correct equation for the reaction between sodium and acetic acid?", options: ["Na + CH₃COOH → CH₃COONa + H₂", "2 Na + CH₃COOH → 2 CH₃COONa + H₂", "Na + CH₃COOH → NaCH₃COO + H₂", "Na + 2 CH₃COOH → 2 CH₃COONa + H₂"], answer: "Na + CH₃COOH → CH₃COONa + H₂", explanation: "This reaction shows that sodium (Na) reacts with acetic acid (CH₃COOH) to form sodium acetate (CH₃COONa) and hydrogen gas (H₂).<br>Other options:<br>- 2 Na + CH₃COOH → 2 CH₃COONa + H₂: This is not balanced correctly and implies excess sodium.<br>- Na + CH₃COOH → NaCH₃COO + H₂: This notation is incorrect as it does not represent the correct product.<br>- Na + 2 CH₃COOH → 2 CH₃COONa + H₂: This is not balanced and incorrectly implies excess acetic acid." },

    { question: "What is the balanced equation for the reaction of sodium sulfide with nitric acid?", options: ["Na₂S + 2 HNO₃ → 2 NaNO₃ + H₂S + S", "Na₂S + HNO₃ → NaNO₃ + H₂S", "Na₂S + 2 HNO₃ → Na₂NO₃ + H₂S", "Na₂S + 4 HNO₃ → 2 NaNO₃ + H₂S + 2 NO₂ + 2 H₂O"], answer: "Na₂S + 4 HNO₃ → 2 NaNO₃ + H₂S + 2 NO₂ + 2 H₂O", explanation: "This balanced equation correctly represents the reaction of sodium sulfide (Na₂S) with nitric acid (HNO₃), producing sodium nitrate (NaNO₃), hydrogen sulfide (H₂S), nitrogen dioxide (NO₂), and water (H₂O).<br>Other options:<br>- Na₂S + 2 HNO₃ → 2 NaNO₃ + H₂S + S: This does not include nitrogen dioxide and is not balanced.<br>- Na₂S + HNO₃ → NaNO₃ + H₂S: This is not balanced and does not represent the complete reaction.<br>- Na₂S + 2 HNO₃ → Na₂NO₃ + H₂S: This is incorrect as it does not account for all products." },

    { question: "What is the balanced equation for the reaction of silver nitrate with sodium chloride?", options: ["AgNO₃ + NaCl → AgCl + NaNO₃", "Ag + NaCl → AgCl + Na", "AgNO₃ + NaCl → Ag + NaNO₃", "AgNO₃ + NaCl → AgCl + Na"], answer: "AgNO₃ + NaCl → AgCl + NaNO₃", explanation: "This balanced equation shows that silver nitrate (AgNO₃) reacts with sodium chloride (NaCl) to form silver chloride (AgCl) and sodium nitrate (NaNO₃).<br>Other options:<br>- Ag + NaCl → AgCl + Na: This is not the correct reaction with silver nitrate.<br>- AgNO₃ + NaCl → Ag + NaNO₃: This does not represent the correct products of the reaction.<br>- AgNO₃ + NaCl → AgCl + Na: This is not balanced and incorrectly suggests the formation of elemental sodium." },

    { question: "What is the equation for the reaction of sodium with hydrochloric acid?", options: ["Na + HCl → NaCl + H₂", "Na + 2 HCl → NaCl + H₂", "Na + HCl → NaH + Cl", "2 Na + 2 HCl → 2 NaCl + H₂"], answer: "Na + HCl → NaCl + H₂", explanation: "This equation correctly represents the reaction of sodium (Na) with hydrochloric acid (HCl), resulting in sodium chloride (NaCl) and hydrogen gas (H₂).<br>Other options:<br>- Na + 2 HCl → NaCl + H₂: This is not balanced and implies excess hydrochloric acid.<br>- Na + HCl → NaH + Cl: This does not represent the correct products of the reaction.<br>- 2 Na + 2 HCl → 2 NaCl + H₂: This is not correctly balanced for the reaction." },

    { question: "What is the balanced equation for the reaction of sodium with nitric acid?", options: ["Na + HNO₃ → NaNO₃ + H₂", "Na + 2 HNO₃ → NaNO₃ + H₂", "Na + HNO₃ → NaNO₃ + NO + H₂O", "2 Na + 2 HNO₃ → 2 NaNO₃ + H₂"], answer: "Na + HNO₃ → NaNO₃ + NO + H₂O", explanation: "This balanced equation shows that sodium (Na) reacts with nitric acid (HNO₃) to produce sodium nitrate (NaNO₃), nitrogen monoxide (NO), and water (H₂O).<br>Other options:<br>- Na + HNO₃ → NaNO₃ + H₂: This is not balanced and does not account for all products.<br>- Na + 2 HNO₃ → NaNO₃ + H₂: This is incorrect as it does not consider the complete reaction.<br>- 2 Na + 2 HNO₃ → 2 NaNO₃ + H₂: This is not correctly balanced for the reaction." },
    { question: "In the sodium fusion test, which of the following compounds is formed specifically when nitrogen is present?", options: ["NaN₃", "Na₂N", "NaCN", "NaNO₃"], answer: "NaCN", explanation: "Sodium cyanide (NaCN) is formed when sodium reacts with nitrogen during the sodium fusion test, indicating the presence of nitrogen in the organic compound.<br>Other options:<br>- NaN₃: Sodium azide is not formed in this test and is unrelated to nitrogen detection.<br>- Na₂N: This compound does not exist in the context of sodium fusion.<br>- NaNO₃: Sodium nitrate is not a product of the sodium fusion test." },

    { question: "Which of the following is a secondary test for confirming the presence of sulfur in an organic compound after the sodium fusion test?", options: ["Lead acetate test", "Barium chloride test", "Silver nitrate test", "Potassium chromate test"], answer: "Lead acetate test", explanation: "The lead acetate test is used to confirm sulfur's presence by forming a black precipitate of lead sulfide (PbS) when lead acetate is added to the filtrate.<br>Other options:<br>- Barium chloride test: This test is used for sulfate detection, not sulfur.<br>- Silver nitrate test: This test is for halogens, not specifically for sulfur.<br>- Potassium chromate test: This test is used for detecting barium or lead ions, not for sulfur." },

    { question: "When testing for halogens, what does the formation of a pale yellow precipitate suggest?", options: ["Presence of bromine", "Presence of chlorine", "Presence of iodine", "Presence of nitrogen"], answer: "Presence of bromine", explanation: "A pale yellow precipitate, specifically silver bromide (AgBr), indicates the presence of bromine in the sample.<br>Other options:<br>- Presence of chlorine: Chlorine would form a white precipitate of silver chloride, not yellow.<br>- Presence of iodine: Iodine produces a bright yellow precipitate of silver iodide, which is more intense than pale yellow.<br>- Presence of nitrogen: Nitrogen does not contribute to the color of precipitates in this test." },

    { question: "What is the implication of obtaining a colorless solution after adding acetic acid to the sodium fusion filtrate?", options: ["Presence of nitrogen", "Presence of sulfur", "Absence of halogens", "Absence of cyanides"], answer: "Absence of cyanides", explanation: "A colorless solution after the addition of acetic acid indicates that cyanides have been neutralized, allowing for accurate halogen testing.<br>Other options:<br>- Presence of nitrogen: The presence of nitrogen would still allow for the formation of NaCN, which does not affect color.<br>- Presence of sulfur: Sulfur would still be present, potentially forming precipitates.<br>- Absence of halogens: The absence of halogens cannot be confirmed solely by the solution's color." },

    { question: "In the context of qualitative analysis, what is the primary function of using dilute nitric acid after sodium fusion?", options: ["To precipitate silver salts", "To neutralize excess sodium", "To eliminate interfering ions", "To indicate the presence of carbon"], answer: "To eliminate interfering ions", explanation: "Dilute nitric acid is used to remove any potential interfering ions such as cyanides and sulfides, ensuring accurate testing for halogens.<br>Other options:<br>- To precipitate silver salts: This occurs later with silver nitrate, not nitric acid.<br>- To neutralize excess sodium: This is not the purpose of using nitric acid in this context.<br>- To indicate the presence of carbon: Carbon is not detected directly through this acid treatment." },

    { question: "What is the significance of a white precipitate that dissolves in excess ammonium hydroxide during halogen testing?", options: ["Presence of iodine", "Presence of bromine", "Presence of chlorine", "Presence of nitrogen"], answer: "Presence of chlorine", explanation: "A white precipitate that dissolves in excess ammonium hydroxide indicates the presence of chlorine, which forms soluble complex ions.<br>Other options:<br>- Presence of iodine: Iodine does not form a white precipitate that dissolves; it forms a yellow precipitate.<br>- Presence of bromine: Bromine typically forms an off-white precipitate that does not dissolve in ammonium hydroxide.<br>- Presence of nitrogen: Nitrogen is not tested in this manner and does not affect the solubility of precipitates." },

    { question: "What outcome suggests the presence of sulfur when testing with lead acetate?", options: ["Black precipitate", "White precipitate", "Colorless solution", "Yellow precipitate"], answer: "Black precipitate", explanation: "The formation of a black precipitate of lead sulfide (PbS) when lead acetate is added indicates the presence of sulfur in the organic compound.<br>Other options:<br>- White precipitate: This would indicate the presence of halogens, not sulfur.<br>- Colorless solution: A colorless solution does not provide evidence for sulfur's presence.<br>- Yellow precipitate: This indicates the presence of iodine, not sulfur." },

    { question: "Which reaction occurs when sodium sulfide reacts with dilute hydrochloric acid?", options: ["Release of H₂S gas", "Formation of NaCl", "Formation of NaOH", "Release of SO₂ gas"], answer: "Release of H₂S gas", explanation: "When sodium sulfide (Na₂S) reacts with dilute hydrochloric acid (HCl), hydrogen sulfide (H₂S) gas is released, which has a characteristic rotten egg odor.<br>Other options:<br>- Formation of NaCl: Sodium chloride is formed, but it is not the primary product of interest in this context.<br>- Formation of NaOH: Sodium hydroxide does not form in this reaction.<br>- Release of SO₂ gas: Sulfur dioxide is not produced in this reaction." },

    { question: "What does a bright yellow precipitate indicate when testing for halogens?", options: ["Presence of bromine", "Presence of iodine", "Presence of chlorine", "Presence of nitrogen"], answer: "Presence of iodine", explanation: "The bright yellow precipitate formed during the test indicates the presence of iodine, specifically silver iodide (AgI).<br>Other options:<br>- Presence of bromine: Bromine typically forms a pale yellow or off-white precipitate, not bright yellow.<br>- Presence of chlorine: Chlorine forms a white precipitate, not yellow.<br>- Presence of nitrogen: Nitrogen does not influence the color of precipitates in this test." },

    { question: "What is the significance of using excess ammonium hydroxide in confirming halogen presence?", options: ["To enhance precipitation", "To dissolve silver halides", "To indicate the presence of sulfur", "To neutralize acids"], answer: "To dissolve silver halides", explanation: "Excess ammonium hydroxide is used to dissolve silver halides, except for silver iodide, which indicates the presence of iodine if it remains undissolved.<br>Other options:<br>- To enhance precipitation: Ammonium hydroxide does not enhance precipitation; it can dissolve precipitates.<br>- To indicate the presence of sulfur: Sulfur is tested separately and not affected by ammonium hydroxide.<br>- To neutralize acids: This is not the primary role of ammonium hydroxide in this context." },

    { question: "What test confirms the presence of nitrogen in organic compounds when using sodium fusion?", options: ["Lead acetate test", "Sodium hydroxide test", "Sodium cyanide formation", "Barium chloride test"], answer: "Sodium cyanide formation", explanation: "The formation of sodium cyanide (NaCN) during the sodium fusion test confirms the presence of nitrogen in organic compounds.<br>Other options:<br>- Lead acetate test: This test is for sulfur, not nitrogen.<br>- Sodium hydroxide test: This does not specifically confirm nitrogen's presence.<br>- Barium chloride test: This is used for sulfate detection, not nitrogen." },

    { question: "What does the reaction of sodium with sulfur produce?", options: ["Na₂S", "NaS", "Na₂S₂", "NaS₂"], answer: "Na₂S", explanation: "The reaction between sodium and sulfur produces sodium sulfide (Na₂S), indicating the presence of sulfur in the compound.<br>Other options:<br>- NaS: This compound does not exist in this context.<br>- Na₂S₂: This compound is not formed in this reaction.<br>- NaS₂: This compound does not represent the products of this reaction." },

    { question: "What type of precipitate is formed when testing for sulfur with lead acetate?", options: ["Black precipitate", "White precipitate", "Yellow precipitate", "Colorless solution"], answer: "Black precipitate", explanation: "The formation of a black precipitate of lead sulfide (PbS) indicates the presence of sulfur when lead acetate is added to the filtrate.<br>Other options:<br>- White precipitate: This indicates the presence of halogens, not sulfur.<br>- Yellow precipitate: This indicates the presence of iodine, not sulfur.<br>- Colorless solution: A colorless solution does not indicate sulfur's presence." },

    { question: "In the presence of halogens, what does the formation of a white precipitate that remains insoluble in excess ammonium hydroxide indicate?", options: ["Presence of iodine", "Presence of chlorine", "Presence of bromine", "Presence of sulfur"], answer: "Presence of bromine", explanation: "A white precipitate that remains insoluble in excess ammonium hydroxide indicates the presence of bromine, typically forming silver bromide (AgBr).<br>Other options:<br>- Presence of iodine: Iodine forms a bright yellow precipitate, not white.<br>- Presence of chlorine: Chlorine would dissolve in excess ammonium hydroxide.<br>- Presence of sulfur: Sulfur is tested separately and does not affect this reaction." },

    { question: "What indicates the presence of carbon in the context of qualitative analysis?", options: ["Formation of a black precipitate", "Release of gas", "Color change", "No visible change"], answer: "No visible change", explanation: "In qualitative analysis, the presence of carbon does not produce a visible change in the sodium fusion test; it is present in organic compounds but not directly detected.<br>Other options:<br>- Formation of a black precipitate: This indicates sulfur, not carbon.<br>- Release of gas: This can occur in other reactions but does not indicate carbon's presence.<br>- Color change: Carbon does not cause a color change in this context." },

    { question: "What does the reaction of sodium sulfide with hydrochloric acid produce?", options: ["H₂S gas", "NaCl", "NaOH", "SO₂ gas"], answer: "H₂S gas", explanation: "The reaction of sodium sulfide (Na₂S) with hydrochloric acid (HCl) produces hydrogen sulfide gas (H₂S), which is characterized by a strong odor.<br>Other options:<br>- NaCl: Sodium chloride is a by-product but not the main focus of this reaction.<br>- NaOH: Sodium hydroxide does not form in this reaction.<br>- SO₂ gas: Sulfur dioxide is not produced in this context." },

    { question: "What is the main purpose of using silver nitrate in the halogen test?", options: ["To form precipitates", "To neutralize acids", "To indicate the presence of sulfur", "To dissolve halides"], answer: "To form precipitates", explanation: "Silver nitrate is used to form precipitates of silver halides, indicating the presence of halogens in the sample.<br>Other options:<br>- To neutralize acids: This is not the primary function of silver nitrate.<br>- To indicate the presence of sulfur: Sulfur is tested separately.<br>- To dissolve halides: Silver nitrate forms precipitates rather than dissolving them." },
    { question: "What is the purpose of the sodium fusion test?", options: ["To test for carbon", "To test for nitrogen", "To test for sulfur", "To test for halogens"], answer: "To test for nitrogen", explanation: "The sodium fusion test is primarily used to detect nitrogen in organic compounds by converting it to sodium cyanide (NaCN).<br>Other options:<br>- To test for carbon: While carbon is present in organic compounds, the sodium fusion test specifically focuses on nitrogen.<br>- To test for sulfur: Although sulfur can be tested, it is not the primary aim of the sodium fusion test.<br>- To test for halogens: Halogens are tested in the filtrate after the sodium fusion test, not during the test itself." },

    { question: "What does the formation of a black precipitate in the sodium fusion test indicate?", options: ["Presence of nitrogen", "Presence of sulfur", "Presence of carbon", "Presence of halogens"], answer: "Presence of sulfur", explanation: "The formation of a black precipitate occurs when sodium sulfide (Na₂S) is formed, indicating the presence of sulfur in the organic compound.<br>Other options:<br>- Presence of nitrogen: The test detects nitrogen by forming NaCN, but this does not produce a black precipitate.<br>- Presence of carbon: Carbon does not directly affect the color of precipitates in this test.<br>- Presence of halogens: Halogens are tested separately and do not produce a black precipitate." },

    { question: "What is the equation for testing sulfur using sodium fusion?", options: ["2 Na + S → Na₂S", "Na + C + N → NaCN", "Na + Cl → NaCl", "2 Na + X → NaX"], answer: "2 Na + S → Na₂S", explanation: "The reaction shows that sodium reacts with sulfur to form sodium sulfide (Na₂S), which is indicative of sulfur's presence.<br>Other options:<br>- Na + C + N → NaCN: This reaction is for nitrogen detection, not sulfur.<br>- Na + Cl → NaCl: This is the reaction for halogens, not sulfur.<br>- 2 Na + X → NaX: This is a general reaction for halogens, not specific to sulfur." },

    { question: "How is the presence of halogens tested in the filtrate from the sodium fusion test?", options: ["By adding nitric acid", "By adding acetic acid", "By adding hydrochloric acid", "By adding sulfuric acid"], answer: "By adding nitric acid", explanation: "Nitric acid is used to acidify the filtrate to eliminate cyanides and sulfides, allowing accurate detection of halogens.<br>Other options:<br>- By adding acetic acid: Acetic acid is used to test for sulfur, not halogens.<br>- By adding hydrochloric acid: Hydrochloric acid is not used in this step; it may interfere with halogen detection.<br>- By adding sulfuric acid: Sulfuric acid is not suitable for this specific test." },

    { question: "What does the formation of an off-white precipitate indicate in the halogen test?", options: ["Presence of chlorine", "Presence of bromine", "Presence of iodine", "Presence of sulfur"], answer: "Presence of bromine", explanation: "An off-white precipitate indicates the presence of bromine in the sample, formed when silver bromide (AgBr) precipitates out.<br>Other options:<br>- Presence of chlorine: Chlorine forms a white precipitate with silver nitrate, not off-white.<br>- Presence of iodine: Iodine produces a yellow precipitate with silver nitrate, not off-white.<br>- Presence of sulfur: Sulfur is detected separately in the sodium fusion test." },

    { question: "What is the result of adding lead acetate to the sodium fusion filtrate?", options: ["Black precipitate", "White precipitate", "Yellow precipitate", "No precipitate"], answer: "Black precipitate", explanation: "The addition of lead acetate to the sodium fusion filtrate can produce a black precipitate of lead sulfide (PbS), indicating sulfur's presence.<br>Other options:<br>- White precipitate: This indicates the presence of chlorine or other halogens, not sulfur.<br>- Yellow precipitate: This indicates the presence of iodine, not sulfur.<br>- No precipitate: This would suggest the absence of sulfur." },

    { question: "What happens when sodium cyanide reacts with hydrochloric acid?", options: ["Formation of NaCl", "Release of cyanide gas", "Formation of NaOH", "Formation of Na₂S"], answer: "Release of cyanide gas", explanation: "When sodium cyanide (NaCN) reacts with hydrochloric acid (HCl), it releases hydrogen cyanide gas (HCN), which is toxic.<br>Other options:<br>- Formation of NaCl: This does occur in the reaction, but it is not the primary concern.<br>- Formation of NaOH: Sodium hydroxide does not form in this reaction.<br>- Formation of Na₂S: Sodium sulfide is not a product of this reaction." },

    { question: "What is indicated by the presence of a white precipitate when testing for halogens?", options: ["Presence of chlorine", "Presence of bromine", "Presence of iodine", "Presence of sulfur"], answer: "Presence of chlorine", explanation: "A white precipitate indicates the presence of chlorine, formed as silver chloride (AgCl) when silver nitrate is added to the solution.<br>Other options:<br>- Presence of bromine: Bromine forms an off-white precipitate, not a white one.<br>- Presence of iodine: Iodine produces a yellow precipitate, not white.<br>- Presence of sulfur: Sulfur is not tested in this step." },

    { question: "What is the role of ammonium hydroxide in the halogen test?", options: ["To precipitate silver halides", "To dissolve precipitates", "To indicate the presence of iodine", "To neutralize acids"], answer: "To indicate the presence of iodine", explanation: "Ammonium hydroxide helps dissolve silver halide precipitates except for silver iodide (AgI), indicating the presence of iodine if a yellow precipitate remains.<br>Other options:<br>- To precipitate silver halides: This is not the role of ammonium hydroxide.<br>- To dissolve precipitates: It does dissolve most silver halides, but not AgI.<br>- To neutralize acids: This is not the primary function in this context." },

    { question: "What is the purpose of adding acetic acid to the sodium fusion filtrate?", options: ["To precipitate lead sulfide", "To test for sulfur", "To test for nitrogen", "To eliminate interference from cyanides"], answer: "To eliminate interference from cyanides", explanation: "Acetic acid is added to help remove cyanides that can interfere with subsequent tests.<br>Other options:<br>- To precipitate lead sulfide: This is not the role of acetic acid.<br>- To test for sulfur: Testing for sulfur occurs with lead acetate, not acetic acid.<br>- To test for nitrogen: Nitrogen is tested with sodium cyanide formation." },

    { question: "Which compound forms a yellow precipitate when tested for halogens?", options: ["NaCl", "NaBr", "NaI", "Na₂S"], answer: "NaI", explanation: "Sodium iodide (NaI) will produce a yellow precipitate of silver iodide (AgI) when silver nitrate is added.<br>Other options:<br>- NaCl: Sodium chloride forms a white precipitate with silver nitrate.<br>- NaBr: Sodium bromide forms an off-white precipitate, not yellow.<br>- Na₂S: Sodium sulfide is tested separately and does not produce a yellow precipitate." },

    { question: "What does the reaction of sodium with carbon and nitrogen produce?", options: ["Na₂C", "NaCN", "Na₂N", "NaC₂"], answer: "NaCN", explanation: "The reaction of sodium with carbon and nitrogen produces sodium cyanide (NaCN), indicating the presence of nitrogen.<br>Other options:<br>- Na₂C: This compound does not exist in this context.<br>- Na₂N: This compound is not formed in the reaction.<br>- NaC₂: This compound does not represent the products of this reaction." },

    { question: "What indicates the presence of chlorine in the sodium fusion test?", options: ["White precipitate", "Black precipitate", "Yellow precipitate", "No precipitate"], answer: "White precipitate", explanation: "The presence of chlorine is indicated by the formation of a white precipitate of silver chloride (AgCl).<br>Other options:<br>- Black precipitate: This indicates the presence of sulfur, not chlorine.<br>- Yellow precipitate: This indicates the presence of iodine, not chlorine.<br>- No precipitate: This would suggest the absence of chlorine." },

    { question: "Which ion is formed when sulfur is detected in organic compounds?", options: ["S²⁻", "HS⁻", "Na₂S", "NaHS"], answer: "Na₂S", explanation: "Sodium sulfide (Na₂S) is formed when sulfur is detected in the sodium fusion test.<br>Other options:<br>- S²⁻: This is the sulfide ion, but it is not the product of the test.<br>- HS⁻: This is the hydrosulfide ion, not directly related to the sodium fusion test.<br>- NaHS: This is sodium hydrosulfide and is not the main product detected in this context." },

    { question: "What does the yellow precipitate indicate in the halogen test?", options: ["Presence of bromine", "Presence of chlorine", "Presence of iodine", "Presence of nitrogen"], answer: "Presence of iodine", explanation: "The formation of a yellow precipitate indicates the presence of iodine, specifically silver iodide (AgI) when silver nitrate is added.<br>Other options:<br>- Presence of bromine: Bromine produces an off-white precipitate, not yellow.<br>- Presence of chlorine: Chlorine results in a white precipitate, not yellow.<br>- Presence of nitrogen: Nitrogen is tested separately and does not produce a yellow precipitate." },

    { question: "What is the correct equation for the reaction of sodium with sulfur?", options: ["2 Na + S → Na₂S", "Na + S → NaS", "Na + S → Na₂S₂", "Na + S → NaS₂"], answer: "2 Na + S → Na₂S", explanation: "This equation correctly represents the reaction between sodium and sulfur to form sodium sulfide (Na₂S).<br>Other options:<br>- Na + S → NaS: This does not accurately reflect the stoichiometry of the reaction.<br>- Na + S → Na₂S₂: This compound does not exist in this context.<br>- Na + S → NaS₂: This does not represent the products formed in the reaction." },

    { question: "What does the presence of a black precipitate in the sodium fusion test indicate?", options: ["Presence of carbon", "Presence of nitrogen", "Presence of sulfur", "Presence of halogens"], answer: "Presence of sulfur", explanation: "The black precipitate formed during the sodium fusion test indicates the presence of sulfur, which forms sodium sulfide (Na₂S).<br>Other options:<br>- Presence of carbon: Carbon does not produce a black precipitate in this test.<br>- Presence of nitrogen: Nitrogen is tested separately and does not produce a black precipitate.<br>- Presence of halogens: Halogens are tested later and do not affect the color of precipitates in this test." },

    { question: "What is detected by adding lead acetate to the sodium fusion filtrate?", options: ["Sulfur", "Nitrogen", "Halogens", "Carbon"], answer: "Sulfur", explanation: "The addition of lead acetate to the filtrate can precipitate lead sulfide (PbS), indicating the presence of sulfur.<br>Other options:<br>- Nitrogen: Nitrogen is detected by the formation of sodium cyanide, not lead acetate.<br>- Halogens: Halogens are not detected with lead acetate in this context.<br>- Carbon: Carbon is not directly tested with lead acetate." },

    { question: "What gas is released when sodium cyanide reacts with acids?", options: ["Hydrogen gas", "Cyanide gas", "Carbon dioxide", "Ammonia"], answer: "Cyanide gas", explanation: "When sodium cyanide reacts with acids, it releases hydrogen cyanide gas (HCN), which is highly toxic.<br>Other options:<br>- Hydrogen gas: This is released in other reactions but not specifically with sodium cyanide and acids.<br>- Carbon dioxide: Carbon dioxide is not a product of this reaction.<br>- Ammonia: Ammonia is not formed in this reaction." },

    { question: "What is the role of nitric acid in the halogen test?", options: ["To precipitate silver halides", "To eliminate interference", "To test for sulfur", "To dissolve precipitates"], answer: "To eliminate interference", explanation: "Nitric acid is added to the solution to remove any cyanide and sulfide that could interfere with the detection of halogens.<br>Other options:<br>- To precipitate silver halides: This occurs later with silver nitrate, not nitric acid.<br>- To test for sulfur: Sulfur is tested separately in the sodium fusion test.<br>- To dissolve precipitates: This is not the main function of nitric acid in this context." },
],

    "EXAM003": [
    { question: "If 16 cm³ of a gaseous hydrocarbon is mixed with 90 cm³ of oxygen, producing 32 cm³ of CO₂ and leaving 34 cm³ of residual oxygen, what is the molecular formula of the hydrocarbon?", options: ["C₃H₆", "C₂H₄", "C₃H₄", "C₄H₈"], answer: "C₃H₆", explanation: "The combustion reaction indicates that for every 1 mole of hydrocarbon, 3.5 moles of carbon dioxide and 6 moles of hydrogen would be produced, leading to the molecular formula C₃H₆.<br>Other options:<br>- C₂H₄: This suggests fewer hydrogen atoms than calculated.<br>- C₃H₄: This indicates fewer hydrogen atoms than actually present.<br>- C₄H₈: This formula suggests a larger hydrocarbon than the one analyzed." },

    { question: "How many moles of carbon dioxide are produced if the volume of CO₂ produced is 32 cm³?", options: ["0.00133 moles", "0.00267 moles", "0.0015 moles", "0.003 moles"], answer: "0.00133 moles", explanation: "To calculate moles: Volume in dm³ = 32 cm³ = 0.032 dm³. Moles = Volume / Molar Volume = 0.032 / 24 = 0.00133 moles.<br>Other options:<br>- 0.00267 moles: This value exceeds the calculated amount.<br>- 0.0015 moles: This does not match the calculated moles.<br>- 0.003 moles: This value is too high based on the volume given." },

    { question: "What are the balanced equations for the complete combustion of the hydrocarbon C₃H₈?", options: ["C₃H₈ + 5 O₂ → 3 CO₂ + 4 H₂O", "C₃H₈ + 4 O₂ → 3 CO₂ + 3 H₂O", "2 C₃H₈ + 7 O₂ → 6 CO₂ + 8 H₂O", "C₃H₈ + 3 O₂ → 3 CO₂ + 3 H₂O"], answer: "C₃H₈ + 5 O₂ → 3 CO₂ + 4 H₂O", explanation: "This represents the correct balanced equation for the combustion of propane (C₃H₈), producing carbon dioxide and water.<br>Other options:<br>- C₃H₈ + 4 O₂ → 3 CO₂ + 3 H₂O: This is not balanced correctly for propane.<br>- 2 C₃H₈ + 7 O₂ → 6 CO₂ + 8 H₂O: This is incorrect for the combustion of propane.<br>- C₃H₈ + 3 O₂ → 3 CO₂ + 3 H₂O: This does not reflect the correct stoichiometry." },

    { question: "If 0.33 g of acetanilide is used and the ammonia produced is collected in 50 cm³ of 0.50 M H₂SO₄, what is the molarity of the ammonia?", options: ["0.006 M", "0.025 M", "0.050 M", "0.067 M"], answer: "0.025 M", explanation: "The moles of H₂SO₄ used are calculated as 0.50 M × 0.050 L = 0.025 moles, indicating the same amount of ammonia produced.<br>Other options:<br>- 0.006 M: This is too low based on the calculations.<br>- 0.050 M: This value does not accurately reflect the dilution of ammonia.<br>- 0.067 M: This exceeds the calculated value based on the amount of acetanilide." },

    { question: "What is the balanced equation for the reaction of sodium carbonate with sulfuric acid?", options: ["Na₂CO₃ + H₂SO₄ → Na₂SO₄ + CO₂ + H₂O", "Na₂CO₃ + 2 H₂SO₄ → Na₂SO₄ + CO₂ + 2 H₂O", "Na₂CO₃ + H₂SO₄ → NaSO₄ + CO₂ + H₂O", "2 Na₂CO₃ + H₂SO₄ → 2 Na₂SO₄ + CO₂ + H₂O"], answer: "Na₂CO₃ + H₂SO₄ → Na₂SO₄ + CO₂ + H₂O", explanation: "This equation correctly represents the reaction of sodium carbonate with sulfuric acid, producing sodium sulfate, carbon dioxide, and water.<br>Other options:<br>- Na₂CO₃ + 2 H₂SO₄ → Na₂SO₄ + CO₂ + 2 H₂O: This is not balanced correctly for the stoichiometry.<br>- Na₂CO₃ + H₂SO₄ → NaSO₄ + CO₂ + H₂O: This does not properly represent the coefficients of sodium sulfate.<br>- 2 Na₂CO₃ + H₂SO₄ → 2 Na₂SO₄ + CO₂ + H₂O: This is incorrect and does not balance properly." },

    { question: "Which equation represents the reaction for determining the nitrogen content using the Kjeldahl method?", options: ["N₂ + H₂ → NH₃", "NH₄Cl + NaOH → NH₃ + NaCl + H₂O", "2 NH₃ + H₂SO₄ → (NH₄)₂SO₄", "NH₃ + HCl → NH₄Cl"], answer: "NH₄Cl + NaOH → NH₃ + NaCl + H₂O", explanation: "This equation represents the reaction in the Kjeldahl method where ammonium chloride reacts with sodium hydroxide to produce ammonia, which is quantified.<br>Other options:<br>- N₂ + H₂ → NH₃: This is not the reaction relevant to the Kjeldahl method.<br>- 2 NH₃ + H₂SO₄ → (NH₄)₂SO₄: This is not part of the Kjeldahl determination process.<br>- NH₃ + HCl → NH₄Cl: This is not the reaction used for nitrogen quantification." },

    { question: "What is the balanced equation for the reaction of sulfur with oxygen?", options: ["S + O₂ → SO₂", "S + HNO₃ → H₂SO₄", "SO₂ + H₂O → H₂SO₃", "H₂S + O₂ → SO₂ + H₂O"], answer: "S + O₂ → SO₂", explanation: "This equation represents the combustion of sulfur in the presence of oxygen to form sulfur dioxide (SO₂), which is used to quantify sulfur in organic compounds.<br>Other options:<br>- S + HNO₃ → H₂SO₄: This reaction is not specifically for determining sulfur content.<br>- SO₂ + H₂O → H₂SO₃: This is not a method for quantifying sulfur.<br>- H₂S + O₂ → SO₂ + H₂O: This represents a different reaction involving hydrogen sulfide." },

    { question: "What is the correct balanced equation for the combustion of C₃H₈?", options: ["C₃H₈ + 5 O₂ → 3 CO₂ + 4 H₂O", "C₃H₈ + 4 O₂ → 3 CO₂ + 3 H₂O", "2 C₃H₈ + 7 O₂ → 6 CO₂ + 8 H₂O", "C₃H₈ + 3 O₂ → 3 CO₂ + 3 H₂O"], answer: "C₃H₈ + 5 O₂ → 3 CO₂ + 4 H₂O", explanation: "This balanced equation accurately represents the complete combustion of propane (C₃H₈), producing carbon dioxide and water.<br>Other options:<br>- C₃H₈ + 4 O₂ → 3 CO₂ + 3 H₂O: This is not balanced correctly.<br>- 2 C₃H₈ + 7 O₂ → 6 CO₂ + 8 H₂O: This is incorrect for the combustion of propane.<br>- C₃H₈ + 3 O₂ → 3 CO₂ + 3 H₂O: This does not reflect the correct stoichiometry." },
    { question: "What is the balanced equation for the reaction of sodium with sulfur to form sodium sulfide?", options: ["2 Na + S → Na₂S", "Na + S → NaS", "Na + S → Na₂S₂", "2 Na + S → NaS₂"], answer: "2 Na + S → Na₂S", explanation: "The balanced equation shows that two sodium (Na) atoms react with one sulfur (S) atom to form sodium sulfide (Na₂S).<br>Other options:<br>- Na + S → NaS: This is not correctly balanced for sodium sulfide formation.<br>- Na + S → Na₂S₂: This compound does not exist and is not formed in this reaction.<br>- 2 Na + S → NaS₂: This does not represent the correct stoichiometry of the reaction." },

    { question: "What is the correct equation for the formation of sodium cyanide from sodium and nitrogen?", options: ["Na + N₂ → NaN", "3 Na + N₂ → Na₃N", "Na + C + N → NaCN", "2 Na + N → Na₂N"], answer: "Na + C + N → NaCN", explanation: "This equation correctly represents the reaction of sodium with carbon and nitrogen to form sodium cyanide (NaCN).<br>Other options:<br>- Na + N₂ → NaN: This does not accurately represent the product formed in the sodium fusion test.<br>- 3 Na + N₂ → Na₃N: This compound does not relate to the sodium fusion test for nitrogen.<br>- 2 Na + N → Na₂N: This compound also does not exist in this context." },

    { question: "What is the balanced equation for the reaction of sodium sulfide with hydrochloric acid?", options: ["Na₂S + 2 HCl → 2 NaCl + H₂S", "NaS + HCl → NaCl + H₂S", "Na₂S + HCl → NaCl + H₂S", "Na₂S + 2 HCl → NaCl + H₂S"], answer: "Na₂S + 2 HCl → 2 NaCl + H₂S", explanation: "This balanced equation shows that sodium sulfide (Na₂S) reacts with hydrochloric acid (HCl) to produce sodium chloride (NaCl) and hydrogen sulfide gas (H₂S).<br>Other options:<br>- NaS + HCl → NaCl + H₂S: This is not balanced and does not represent the correct stoichiometry.<br>- Na₂S + HCl → NaCl + H₂S: This is not balanced as it does not account for the number of sodium ions produced.<br>- Na₂S + 2 HCl → NaCl + H₂S: This is also not balanced correctly." },

    { question: "What is the correct balanced equation for the reaction of sodium with water?", options: ["2 Na + 2 H₂O → 2 NaOH + H₂", "Na + H₂O → NaOH + H₂", "2 Na + H₂O → Na₂O + H₂", "Na + 2 H₂O → NaOH + H₂"], answer: "2 Na + 2 H₂O → 2 NaOH + H₂", explanation: "In this balanced equation, sodium (Na) reacts with water (H₂O) to form sodium hydroxide (NaOH) and hydrogen gas (H₂).<br>Other options:<br>- Na + H₂O → NaOH + H₂: This is not balanced as it does not account for the number of sodium atoms.<br>- 2 Na + H₂O → Na₂O + H₂: This would imply the formation of sodium oxide, which is incorrect for this reaction.<br>- Na + 2 H₂O → NaOH + H₂: This is not balanced correctly as it does not account for the number of water molecules." },

    { question: "What is the balanced equation for the reaction of sodium with chlorine gas?", options: ["2 Na + Cl₂ → 2 NaCl", "Na + Cl → NaCl", "2 Na + Cl → Na₂Cl", "Na + Cl₂ → NaCl"], answer: "2 Na + Cl₂ → 2 NaCl", explanation: "This balanced equation shows that sodium (Na) reacts with chlorine gas (Cl₂) to form sodium chloride (NaCl).<br>Other options:<br>- Na + Cl → NaCl: This is not balanced as it does not account for the number of chlorine atoms.<br>- 2 Na + Cl → Na₂Cl: This compound does not exist and is not formed in this reaction.<br>- Na + Cl₂ → NaCl: This is not balanced as it does not account for the number of sodium atoms." },

    { question: "What is the balanced equation for the formation of lead sulfide when testing for sulfur?", options: ["Pb + S → PbS", "2 Pb + S → Pb₂S", "Pb + Na₂S → PbS + Na", "2 Pb + Na₂S → 2 PbS + Na"], answer: "Pb + S → PbS", explanation: "This balanced equation shows that lead (Pb) reacts with sulfur (S) to form lead sulfide (PbS).<br>Other options:<br>- 2 Pb + S → Pb₂S: This compound does not exist in this context.<br>-Pb + Na₂S → PbS + Na: This is not a direct reaction for the formation of lead sulfide.<br>- 2 Pb + Na₂S → 2 PbS + Na: This is not the correct stoichiometry for the formation of lead sulfide." },

    { question: "What is the balanced equation for the reaction of silver nitrate with sodium halides?", options: ["AgNO₃ + NaX → AgX + NaNO₃", "Ag + NaX → AgX + Na", "AgNO₃ + NaCl → AgCl + NaNO₃", "AgNO₃ + NaBr → AgBr + NaNO₃"], answer: "AgNO₃ + NaX → AgX + NaNO₃", explanation: "This general equation represents the reaction of silver nitrate with any sodium halide (NaX) to form the respective silver halide (AgX) and sodium nitrate (NaNO₃).<br>Other options:<br>- Ag + NaX → AgX + Na: This does not involve silver nitrate and does not represent the correct reaction.<br>- AgNO₃ + NaCl → AgCl + NaNO₃: This is a specific case of the general equation but does not represent all halides.<br>- AgNO₃ + NaBr → AgBr + NaNO₃: This is another specific case but does not represent the general reaction with halides." },

    { question: "What is the correct equation for the reaction between sodium and acetic acid?", options: ["Na + CH₃COOH → CH₃COONa + H₂", "2 Na + CH₃COOH → 2 CH₃COONa + H₂", "Na + CH₃COOH → NaCH₃COO + H₂", "Na + 2 CH₃COOH → 2 CH₃COONa + H₂"], answer: "Na + CH₃COOH → CH₃COONa + H₂", explanation: "This reaction shows that sodium (Na) reacts with acetic acid (CH₃COOH) to form sodium acetate (CH₃COONa) and hydrogen gas (H₂).<br>Other options:<br>- 2 Na + CH₃COOH → 2 CH₃COONa + H₂: This is not balanced correctly and implies excess sodium.<br>- Na + CH₃COOH → NaCH₃COO + H₂: This notation is incorrect as it does not represent the correct product.<br>- Na + 2 CH₃COOH → 2 CH₃COONa + H₂: This is not balanced and incorrectly implies excess acetic acid." },

    { question: "What is the balanced equation for the reaction of sodium sulfide with nitric acid?", options: ["Na₂S + 2 HNO₃ → 2 NaNO₃ + H₂S + S", "Na₂S + HNO₃ → NaNO₃ + H₂S", "Na₂S + 2 HNO₃ → Na₂NO₃ + H₂S", "Na₂S + 4 HNO₃ → 2 NaNO₃ + H₂S + 2 NO₂ + 2 H₂O"], answer: "Na₂S + 4 HNO₃ → 2 NaNO₃ + H₂S + 2 NO₂ + 2 H₂O", explanation: "This balanced equation correctly represents the reaction of sodium sulfide (Na₂S) with nitric acid (HNO₃), producing sodium nitrate (NaNO₃), hydrogen sulfide (H₂S), nitrogen dioxide (NO₂), and water (H₂O).<br>Other options:<br>- Na₂S + 2 HNO₃ → 2 NaNO₃ + H₂S + S: This does not include nitrogen dioxide and is not balanced.<br>- Na₂S + HNO₃ → NaNO₃ + H₂S: This is not balanced and does not represent the complete reaction.<br>- Na₂S + 2 HNO₃ → Na₂NO₃ + H₂S: This is incorrect as it does not account for all products." },

    { question: "What is the balanced equation for the reaction of silver nitrate with sodium chloride?", options: ["AgNO₃ + NaCl → AgCl + NaNO₃", "Ag + NaCl → AgCl + Na", "AgNO₃ + NaCl → Ag + NaNO₃", "AgNO₃ + NaCl → AgCl + Na"], answer: "AgNO₃ + NaCl → AgCl + NaNO₃", explanation: "This balanced equation shows that silver nitrate (AgNO₃) reacts with sodium chloride (NaCl) to form silver chloride (AgCl) and sodium nitrate (NaNO₃).<br>Other options:<br>- Ag + NaCl → AgCl + Na: This is not the correct reaction with silver nitrate.<br>- AgNO₃ + NaCl → Ag + NaNO₃: This does not represent the correct products of the reaction.<br>- AgNO₃ + NaCl → AgCl + Na: This is not balanced and incorrectly suggests the formation of elemental sodium." },

    { question: "What is the equation for the reaction of sodium with hydrochloric acid?", options: ["Na + HCl → NaCl + H₂", "Na + 2 HCl → NaCl + H₂", "Na + HCl → NaH + Cl", "2 Na + 2 HCl → 2 NaCl + H₂"], answer: "Na + HCl → NaCl + H₂", explanation: "This equation correctly represents the reaction of sodium (Na) with hydrochloric acid (HCl), resulting in sodium chloride (NaCl) and hydrogen gas (H₂).<br>Other options:<br>- Na + 2 HCl → NaCl + H₂: This is not balanced and implies excess hydrochloric acid.<br>- Na + HCl → NaH + Cl: This does not represent the correct products of the reaction.<br>- 2 Na + 2 HCl → 2 NaCl + H₂: This is not correctly balanced for the reaction." },

    { question: "What is the balanced equation for the reaction of sodium with nitric acid?", options: ["Na + HNO₃ → NaNO₃ + H₂", "Na + 2 HNO₃ → NaNO₃ + H₂", "Na + HNO₃ → NaNO₃ + NO + H₂O", "2 Na + 2 HNO₃ → 2 NaNO₃ + H₂"], answer: "Na + HNO₃ → NaNO₃ + NO + H₂O", explanation: "This balanced equation shows that sodium (Na) reacts with nitric acid (HNO₃) to produce sodium nitrate (NaNO₃), nitrogen monoxide (NO), and water (H₂O).<br>Other options:<br>- Na + HNO₃ → NaNO₃ + H₂: This is not balanced and does not account for all products.<br>- Na + 2 HNO₃ → NaNO₃ + H₂: This is incorrect as it does not consider the complete reaction.<br>- 2 Na + 2 HNO₃ → 2 NaNO₃ + H₂: This is not correctly balanced for the reaction." },
    { question: "In the sodium fusion test, which of the following compounds is formed specifically when nitrogen is present?", options: ["NaN₃", "Na₂N", "NaCN", "NaNO₃"], answer: "NaCN", explanation: "Sodium cyanide (NaCN) is formed when sodium reacts with nitrogen during the sodium fusion test, indicating the presence of nitrogen in the organic compound.<br>Other options:<br>- NaN₃: Sodium azide is not formed in this test and is unrelated to nitrogen detection.<br>- Na₂N: This compound does not exist in the context of sodium fusion.<br>- NaNO₃: Sodium nitrate is not a product of the sodium fusion test." },

    { question: "Which of the following is a secondary test for confirming the presence of sulfur in an organic compound after the sodium fusion test?", options: ["Lead acetate test", "Barium chloride test", "Silver nitrate test", "Potassium chromate test"], answer: "Lead acetate test", explanation: "The lead acetate test is used to confirm sulfur's presence by forming a black precipitate of lead sulfide (PbS) when lead acetate is added to the filtrate.<br>Other options:<br>- Barium chloride test: This test is used for sulfate detection, not sulfur.<br>- Silver nitrate test: This test is for halogens, not specifically for sulfur.<br>- Potassium chromate test: This test is used for detecting barium or lead ions, not for sulfur." },

    { question: "When testing for halogens, what does the formation of a pale yellow precipitate suggest?", options: ["Presence of bromine", "Presence of chlorine", "Presence of iodine", "Presence of nitrogen"], answer: "Presence of bromine", explanation: "A pale yellow precipitate, specifically silver bromide (AgBr), indicates the presence of bromine in the sample.<br>Other options:<br>- Presence of chlorine: Chlorine would form a white precipitate of silver chloride, not yellow.<br>- Presence of iodine: Iodine produces a bright yellow precipitate of silver iodide, which is more intense than pale yellow.<br>- Presence of nitrogen: Nitrogen does not contribute to the color of precipitates in this test." },

    { question: "What is the implication of obtaining a colorless solution after adding acetic acid to the sodium fusion filtrate?", options: ["Presence of nitrogen", "Presence of sulfur", "Absence of halogens", "Absence of cyanides"], answer: "Absence of cyanides", explanation: "A colorless solution after the addition of acetic acid indicates that cyanides have been neutralized, allowing for accurate halogen testing.<br>Other options:<br>- Presence of nitrogen: The presence of nitrogen would still allow for the formation of NaCN, which does not affect color.<br>- Presence of sulfur: Sulfur would still be present, potentially forming precipitates.<br>- Absence of halogens: The absence of halogens cannot be confirmed solely by the solution's color." },

    { question: "In the context of qualitative analysis, what is the primary function of using dilute nitric acid after sodium fusion?", options: ["To precipitate silver salts", "To neutralize excess sodium", "To eliminate interfering ions", "To indicate the presence of carbon"], answer: "To eliminate interfering ions", explanation: "Dilute nitric acid is used to remove any potential interfering ions such as cyanides and sulfides, ensuring accurate testing for halogens.<br>Other options:<br>- To precipitate silver salts: This occurs later with silver nitrate, not nitric acid.<br>- To neutralize excess sodium: This is not the purpose of using nitric acid in this context.<br>- To indicate the presence of carbon: Carbon is not detected directly through this acid treatment." },

    { question: "What is the significance of a white precipitate that dissolves in excess ammonium hydroxide during halogen testing?", options: ["Presence of iodine", "Presence of bromine", "Presence of chlorine", "Presence of nitrogen"], answer: "Presence of chlorine", explanation: "A white precipitate that dissolves in excess ammonium hydroxide indicates the presence of chlorine, which forms soluble complex ions.<br>Other options:<br>- Presence of iodine: Iodine does not form a white precipitate that dissolves; it forms a yellow precipitate.<br>- Presence of bromine: Bromine typically forms an off-white precipitate that does not dissolve in ammonium hydroxide.<br>- Presence of nitrogen: Nitrogen is not tested in this manner and does not affect the solubility of precipitates." },

    { question: "What outcome suggests the presence of sulfur when testing with lead acetate?", options: ["Black precipitate", "White precipitate", "Colorless solution", "Yellow precipitate"], answer: "Black precipitate", explanation: "The formation of a black precipitate of lead sulfide (PbS) when lead acetate is added indicates the presence of sulfur in the organic compound.<br>Other options:<br>- White precipitate: This would indicate the presence of halogens, not sulfur.<br>- Colorless solution: A colorless solution does not provide evidence for sulfur's presence.<br>- Yellow precipitate: This indicates the presence of iodine, not sulfur." },

    { question: "Which reaction occurs when sodium sulfide reacts with dilute hydrochloric acid?", options: ["Release of H₂S gas", "Formation of NaCl", "Formation of NaOH", "Release of SO₂ gas"], answer: "Release of H₂S gas", explanation: "When sodium sulfide (Na₂S) reacts with dilute hydrochloric acid (HCl), hydrogen sulfide (H₂S) gas is released, which has a characteristic rotten egg odor.<br>Other options:<br>- Formation of NaCl: Sodium chloride is formed, but it is not the primary product of interest in this context.<br>- Formation of NaOH: Sodium hydroxide does not form in this reaction.<br>- Release of SO₂ gas: Sulfur dioxide is not produced in this reaction." },

    { question: "What does a bright yellow precipitate indicate when testing for halogens?", options: ["Presence of bromine", "Presence of iodine", "Presence of chlorine", "Presence of nitrogen"], answer: "Presence of iodine", explanation: "The bright yellow precipitate formed during the test indicates the presence of iodine, specifically silver iodide (AgI).<br>Other options:<br>- Presence of bromine: Bromine typically forms a pale yellow or off-white precipitate, not bright yellow.<br>- Presence of chlorine: Chlorine forms a white precipitate, not yellow.<br>- Presence of nitrogen: Nitrogen does not influence the color of precipitates in this test." },

    { question: "What is the significance of using excess ammonium hydroxide in confirming halogen presence?", options: ["To enhance precipitation", "To dissolve silver halides", "To indicate the presence of sulfur", "To neutralize acids"], answer: "To dissolve silver halides", explanation: "Excess ammonium hydroxide is used to dissolve silver halides, except for silver iodide, which indicates the presence of iodine if it remains undissolved.<br>Other options:<br>- To enhance precipitation: Ammonium hydroxide does not enhance precipitation; it can dissolve precipitates.<br>- To indicate the presence of sulfur: Sulfur is tested separately and not affected by ammonium hydroxide.<br>- To neutralize acids: This is not the primary role of ammonium hydroxide in this context." },

    { question: "What test confirms the presence of nitrogen in organic compounds when using sodium fusion?", options: ["Lead acetate test", "Sodium hydroxide test", "Sodium cyanide formation", "Barium chloride test"], answer: "Sodium cyanide formation", explanation: "The formation of sodium cyanide (NaCN) during the sodium fusion test confirms the presence of nitrogen in organic compounds.<br>Other options:<br>- Lead acetate test: This test is for sulfur, not nitrogen.<br>- Sodium hydroxide test: This does not specifically confirm nitrogen's presence.<br>- Barium chloride test: This is used for sulfate detection, not nitrogen." },

    { question: "What does the reaction of sodium with sulfur produce?", options: ["Na₂S", "NaS", "Na₂S₂", "NaS₂"], answer: "Na₂S", explanation: "The reaction between sodium and sulfur produces sodium sulfide (Na₂S), indicating the presence of sulfur in the compound.<br>Other options:<br>- NaS: This compound does not exist in this context.<br>- Na₂S₂: This compound is not formed in this reaction.<br>- NaS₂: This compound does not represent the products of this reaction." },

    { question: "What type of precipitate is formed when testing for sulfur with lead acetate?", options: ["Black precipitate", "White precipitate", "Yellow precipitate", "Colorless solution"], answer: "Black precipitate", explanation: "The formation of a black precipitate of lead sulfide (PbS) indicates the presence of sulfur when lead acetate is added to the filtrate.<br>Other options:<br>- White precipitate: This indicates the presence of halogens, not sulfur.<br>- Yellow precipitate: This indicates the presence of iodine, not sulfur.<br>- Colorless solution: A colorless solution does not indicate sulfur's presence." },

    { question: "In the presence of halogens, what does the formation of a white precipitate that remains insoluble in excess ammonium hydroxide indicate?", options: ["Presence of iodine", "Presence of chlorine", "Presence of bromine", "Presence of sulfur"], answer: "Presence of bromine", explanation: "A white precipitate that remains insoluble in excess ammonium hydroxide indicates the presence of bromine, typically forming silver bromide (AgBr).<br>Other options:<br>- Presence of iodine: Iodine forms a bright yellow precipitate, not white.<br>- Presence of chlorine: Chlorine would dissolve in excess ammonium hydroxide.<br>- Presence of sulfur: Sulfur is tested separately and does not affect this reaction." },

    { question: "What indicates the presence of carbon in the context of qualitative analysis?", options: ["Formation of a black precipitate", "Release of gas", "Color change", "No visible change"], answer: "No visible change", explanation: "In qualitative analysis, the presence of carbon does not produce a visible change in the sodium fusion test; it is present in organic compounds but not directly detected.<br>Other options:<br>- Formation of a black precipitate: This indicates sulfur, not carbon.<br>- Release of gas: This can occur in other reactions but does not indicate carbon's presence.<br>- Color change: Carbon does not cause a color change in this context." },

    { question: "What does the reaction of sodium sulfide with hydrochloric acid produce?", options: ["H₂S gas", "NaCl", "NaOH", "SO₂ gas"], answer: "H₂S gas", explanation: "The reaction of sodium sulfide (Na₂S) with hydrochloric acid (HCl) produces hydrogen sulfide gas (H₂S), which is characterized by a strong odor.<br>Other options:<br>- NaCl: Sodium chloride is a by-product but not the main focus of this reaction.<br>- NaOH: Sodium hydroxide does not form in this reaction.<br>- SO₂ gas: Sulfur dioxide is not produced in this context." },

    { question: "What is the main purpose of using silver nitrate in the halogen test?", options: ["To form precipitates", "To neutralize acids", "To indicate the presence of sulfur", "To dissolve halides"], answer: "To form precipitates", explanation: "Silver nitrate is used to form precipitates of silver halides, indicating the presence of halogens in the sample.<br>Other options:<br>- To neutralize acids: This is not the primary function of silver nitrate.<br>- To indicate the presence of sulfur: Sulfur is tested separately.<br>- To dissolve halides: Silver nitrate forms precipitates rather than dissolving them." },
    { question: "What is the purpose of the sodium fusion test?", options: ["To test for carbon", "To test for nitrogen", "To test for sulfur", "To test for halogens"], answer: "To test for nitrogen", explanation: "The sodium fusion test is primarily used to detect nitrogen in organic compounds by converting it to sodium cyanide (NaCN).<br>Other options:<br>- To test for carbon: While carbon is present in organic compounds, the sodium fusion test specifically focuses on nitrogen.<br>- To test for sulfur: Although sulfur can be tested, it is not the primary aim of the sodium fusion test.<br>- To test for halogens: Halogens are tested in the filtrate after the sodium fusion test, not during the test itself." },

    { question: "What does the formation of a black precipitate in the sodium fusion test indicate?", options: ["Presence of nitrogen", "Presence of sulfur", "Presence of carbon", "Presence of halogens"], answer: "Presence of sulfur", explanation: "The formation of a black precipitate occurs when sodium sulfide (Na₂S) is formed, indicating the presence of sulfur in the organic compound.<br>Other options:<br>- Presence of nitrogen: The test detects nitrogen by forming NaCN, but this does not produce a black precipitate.<br>- Presence of carbon: Carbon does not directly affect the color of precipitates in this test.<br>- Presence of halogens: Halogens are tested separately and do not produce a black precipitate." },

    { question: "What is the equation for testing sulfur using sodium fusion?", options: ["2 Na + S → Na₂S", "Na + C + N → NaCN", "Na + Cl → NaCl", "2 Na + X → NaX"], answer: "2 Na + S → Na₂S", explanation: "The reaction shows that sodium reacts with sulfur to form sodium sulfide (Na₂S), which is indicative of sulfur's presence.<br>Other options:<br>- Na + C + N → NaCN: This reaction is for nitrogen detection, not sulfur.<br>- Na + Cl → NaCl: This is the reaction for halogens, not sulfur.<br>- 2 Na + X → NaX: This is a general reaction for halogens, not specific to sulfur." },

    { question: "How is the presence of halogens tested in the filtrate from the sodium fusion test?", options: ["By adding nitric acid", "By adding acetic acid", "By adding hydrochloric acid", "By adding sulfuric acid"], answer: "By adding nitric acid", explanation: "Nitric acid is used to acidify the filtrate to eliminate cyanides and sulfides, allowing accurate detection of halogens.<br>Other options:<br>- By adding acetic acid: Acetic acid is used to test for sulfur, not halogens.<br>- By adding hydrochloric acid: Hydrochloric acid is not used in this step; it may interfere with halogen detection.<br>- By adding sulfuric acid: Sulfuric acid is not suitable for this specific test." },

    { question: "What does the formation of an off-white precipitate indicate in the halogen test?", options: ["Presence of chlorine", "Presence of bromine", "Presence of iodine", "Presence of sulfur"], answer: "Presence of bromine", explanation: "An off-white precipitate indicates the presence of bromine in the sample, formed when silver bromide (AgBr) precipitates out.<br>Other options:<br>- Presence of chlorine: Chlorine forms a white precipitate with silver nitrate, not off-white.<br>- Presence of iodine: Iodine produces a yellow precipitate with silver nitrate, not off-white.<br>- Presence of sulfur: Sulfur is detected separately in the sodium fusion test." },

    { question: "What is the result of adding lead acetate to the sodium fusion filtrate?", options: ["Black precipitate", "White precipitate", "Yellow precipitate", "No precipitate"], answer: "Black precipitate", explanation: "The addition of lead acetate to the sodium fusion filtrate can produce a black precipitate of lead sulfide (PbS), indicating sulfur's presence.<br>Other options:<br>- White precipitate: This indicates the presence of chlorine or other halogens, not sulfur.<br>- Yellow precipitate: This indicates the presence of iodine, not sulfur.<br>- No precipitate: This would suggest the absence of sulfur." },

    { question: "What happens when sodium cyanide reacts with hydrochloric acid?", options: ["Formation of NaCl", "Release of cyanide gas", "Formation of NaOH", "Formation of Na₂S"], answer: "Release of cyanide gas", explanation: "When sodium cyanide (NaCN) reacts with hydrochloric acid (HCl), it releases hydrogen cyanide gas (HCN), which is toxic.<br>Other options:<br>- Formation of NaCl: This does occur in the reaction, but it is not the primary concern.<br>- Formation of NaOH: Sodium hydroxide does not form in this reaction.<br>- Formation of Na₂S: Sodium sulfide is not a product of this reaction." },

    { question: "What is indicated by the presence of a white precipitate when testing for halogens?", options: ["Presence of chlorine", "Presence of bromine", "Presence of iodine", "Presence of sulfur"], answer: "Presence of chlorine", explanation: "A white precipitate indicates the presence of chlorine, formed as silver chloride (AgCl) when silver nitrate is added to the solution.<br>Other options:<br>- Presence of bromine: Bromine forms an off-white precipitate, not a white one.<br>- Presence of iodine: Iodine produces a yellow precipitate, not white.<br>- Presence of sulfur: Sulfur is not tested in this step." },

    { question: "What is the role of ammonium hydroxide in the halogen test?", options: ["To precipitate silver halides", "To dissolve precipitates", "To indicate the presence of iodine", "To neutralize acids"], answer: "To indicate the presence of iodine", explanation: "Ammonium hydroxide helps dissolve silver halide precipitates except for silver iodide (AgI), indicating the presence of iodine if a yellow precipitate remains.<br>Other options:<br>- To precipitate silver halides: This is not the role of ammonium hydroxide.<br>- To dissolve precipitates: It does dissolve most silver halides, but not AgI.<br>- To neutralize acids: This is not the primary function in this context." },

    { question: "What is the purpose of adding acetic acid to the sodium fusion filtrate?", options: ["To precipitate lead sulfide", "To test for sulfur", "To test for nitrogen", "To eliminate interference from cyanides"], answer: "To eliminate interference from cyanides", explanation: "Acetic acid is added to help remove cyanides that can interfere with subsequent tests.<br>Other options:<br>- To precipitate lead sulfide: This is not the role of acetic acid.<br>- To test for sulfur: Testing for sulfur occurs with lead acetate, not acetic acid.<br>- To test for nitrogen: Nitrogen is tested with sodium cyanide formation." },

    { question: "Which compound forms a yellow precipitate when tested for halogens?", options: ["NaCl", "NaBr", "NaI", "Na₂S"], answer: "NaI", explanation: "Sodium iodide (NaI) will produce a yellow precipitate of silver iodide (AgI) when silver nitrate is added.<br>Other options:<br>- NaCl: Sodium chloride forms a white precipitate with silver nitrate.<br>- NaBr: Sodium bromide forms an off-white precipitate, not yellow.<br>- Na₂S: Sodium sulfide is tested separately and does not produce a yellow precipitate." },

    { question: "What does the reaction of sodium with carbon and nitrogen produce?", options: ["Na₂C", "NaCN", "Na₂N", "NaC₂"], answer: "NaCN", explanation: "The reaction of sodium with carbon and nitrogen produces sodium cyanide (NaCN), indicating the presence of nitrogen.<br>Other options:<br>- Na₂C: This compound does not exist in this context.<br>- Na₂N: This compound is not formed in the reaction.<br>- NaC₂: This compound does not represent the products of this reaction." },

    { question: "What indicates the presence of chlorine in the sodium fusion test?", options: ["White precipitate", "Black precipitate", "Yellow precipitate", "No precipitate"], answer: "White precipitate", explanation: "The presence of chlorine is indicated by the formation of a white precipitate of silver chloride (AgCl).<br>Other options:<br>- Black precipitate: This indicates the presence of sulfur, not chlorine.<br>- Yellow precipitate: This indicates the presence of iodine, not chlorine.<br>- No precipitate: This would suggest the absence of chlorine." },

    { question: "Which ion is formed when sulfur is detected in organic compounds?", options: ["S²⁻", "HS⁻", "Na₂S", "NaHS"], answer: "Na₂S", explanation: "Sodium sulfide (Na₂S) is formed when sulfur is detected in the sodium fusion test.<br>Other options:<br>- S²⁻: This is the sulfide ion, but it is not the product of the test.<br>- HS⁻: This is the hydrosulfide ion, not directly related to the sodium fusion test.<br>- NaHS: This is sodium hydrosulfide and is not the main product detected in this context." },

    { question: "What does the yellow precipitate indicate in the halogen test?", options: ["Presence of bromine", "Presence of chlorine", "Presence of iodine", "Presence of nitrogen"], answer: "Presence of iodine", explanation: "The formation of a yellow precipitate indicates the presence of iodine, specifically silver iodide (AgI) when silver nitrate is added.<br>Other options:<br>- Presence of bromine: Bromine produces an off-white precipitate, not yellow.<br>- Presence of chlorine: Chlorine results in a white precipitate, not yellow.<br>- Presence of nitrogen: Nitrogen is tested separately and does not produce a yellow precipitate." },

    { question: "What is the correct equation for the reaction of sodium with sulfur?", options: ["2 Na + S → Na₂S", "Na + S → NaS", "Na + S → Na₂S₂", "Na + S → NaS₂"], answer: "2 Na + S → Na₂S", explanation: "This equation correctly represents the reaction between sodium and sulfur to form sodium sulfide (Na₂S).<br>Other options:<br>- Na + S → NaS: This does not accurately reflect the stoichiometry of the reaction.<br>- Na + S → Na₂S₂: This compound does not exist in this context.<br>- Na + S → NaS₂: This does not represent the products formed in the reaction." },

    { question: "What does the presence of a black precipitate in the sodium fusion test indicate?", options: ["Presence of carbon", "Presence of nitrogen", "Presence of sulfur", "Presence of halogens"], answer: "Presence of sulfur", explanation: "The black precipitate formed during the sodium fusion test indicates the presence of sulfur, which forms sodium sulfide (Na₂S).<br>Other options:<br>- Presence of carbon: Carbon does not produce a black precipitate in this test.<br>- Presence of nitrogen: Nitrogen is tested separately and does not produce a black precipitate.<br>- Presence of halogens: Halogens are tested later and do not affect the color of precipitates in this test." },

    { question: "What is detected by adding lead acetate to the sodium fusion filtrate?", options: ["Sulfur", "Nitrogen", "Halogens", "Carbon"], answer: "Sulfur", explanation: "The addition of lead acetate to the filtrate can precipitate lead sulfide (PbS), indicating the presence of sulfur.<br>Other options:<br>- Nitrogen: Nitrogen is detected by the formation of sodium cyanide, not lead acetate.<br>- Halogens: Halogens are not detected with lead acetate in this context.<br>- Carbon: Carbon is not directly tested with lead acetate." },

    { question: "What gas is released when sodium cyanide reacts with acids?", options: ["Hydrogen gas", "Cyanide gas", "Carbon dioxide", "Ammonia"], answer: "Cyanide gas", explanation: "When sodium cyanide reacts with acids, it releases hydrogen cyanide gas (HCN), which is highly toxic.<br>Other options:<br>- Hydrogen gas: This is released in other reactions but not specifically with sodium cyanide and acids.<br>- Carbon dioxide: Carbon dioxide is not a product of this reaction.<br>- Ammonia: Ammonia is not formed in this reaction." },

    { question: "What is the role of nitric acid in the halogen test?", options: ["To precipitate silver halides", "To eliminate interference", "To test for sulfur", "To dissolve precipitates"], answer: "To eliminate interference", explanation: "Nitric acid is added to the solution to remove any cyanide and sulfide that could interfere with the detection of halogens.<br>Other options:<br>- To precipitate silver halides: This occurs later with silver nitrate, not nitric acid.<br>- To test for sulfur: Sulfur is tested separately in the sodium fusion test.<br>- To dissolve precipitates: This is not the main function of nitric acid in this context." },
],
};
