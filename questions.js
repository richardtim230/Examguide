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
};
