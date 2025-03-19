
const validUserIDs = [
  "USER101", "OAU-ZgXvX", "OAU-Kg78V", "OAU-69FRv", "OAU-ryxMg", "OAU-b97cs", "OAU-oZTc5", "OAU-tUea4", "OAU-4FXLJ", "OAU-0ZqXe", "OAU-ztcIb", "OAU-JCfg0", "OAU-fcBhe", "OAU-1Wmt4", "OAU-ZYEu7", "OAU-sqZ2H", "OAU-YF6b8", "OAU-pRGfP", "OAU-I4KCh", "OAU-vwd1N", "OAU-U6UJd", "OAU-Bs3rn", "OAU-Lmgw1", "OAU-zonhD", "OAU-MQZiX", "OAU-M4FP5", "OAU-AFJF0", "OAU-Dsq5y", "OAU-MXqZ9", "OAU-3Loap", "OAU-aPaYK", "OAU-oDkB8", "ZAT61G", "OAU-gn5H1", "OAU-GBXbW", "OAU-pPtXA", "OAU-8zM0P", "OAU-Cts4O", "OAU-P5nJv", "C9OJNB", "OAU-iM1rP", "YO638H", "OAU-QuKF7", "OAU-eElXp", "OAU-D7QPC", "OAU-vs1He", "OAU-GM7jE", "OAU-nTs6h", "OAU-4iDRs", "OAU-Hx08e", "OAU-giRIJ", "380PSM", "6YF1OG", "NI59IE", "V5KAMW", "ENOKAF", "O34U90", "C4BVOZ", "QM39NB", "KEEWPP", "OAU-8UaFi", "NJ5PKC", "43V107", "DNV83T", "QJ8RJZ", "VUA6KK", "2ZDGJM", "QQTIRS","537G6R", "WFX1S9", "77EOLI", "59UD2L", "2WN6FP", "CEIJ7E", "3IV4RI", "BSIZTQ", "K3RBVK", "XR0QEV", "J2DTAN", "ZKWN3U", "9UR3N6", "KNNP24", "3XHF8Z", "R7F0YO", "GIY77W", "FB32H6", "X64SH5"]; // Admin-activated user IDs

let currentQuestionIndex = 0;
let userAnswers = [];
let timerInterval;
let remainingTime = 30 * 60; // 20 minutes
let selectedCourseCode = "";


// Predefined question banks by course codes
const questionBanks = {
  
  "BOT101-T1": [
    
  {
    text: "What color does aniline blue stain?",
    options: ["Pink", "Red", "Blue", "Green"],
    correct: 2,
    explanation: "Aniline blue stains tissue a blue color."
  },
  {
    text: "What color does borax carmine stain?",
    options: ["Red", "Pink", "Blue", "Yellow"],
    correct: 1,
    explanation: "Borax carmine stains tissue a pink color."
  },
  {
    text: "What color does eosin stain?",
    options: ["Blue", "Green", "Pink or red", "Yellow"],
    correct: 2,
    explanation: "Eosin stains tissue either a pink or red color."
  },
  {
    text: "What color does light/fast green stain?",
    options: ["Blue", "Green", "Pink", "Red"],
    correct: 1,
    explanation: "Light/fast green stains tissue a green color."
  },
  {
    text: "What color does methylene blue stain?",
    options: ["Red", "Green", "Blue", "Yellow"],
    correct: 2,
    explanation: "Methylene blue stains tissue a blue color."
  },
  {
    text: "What color does safranin stain?",
    options: ["Blue", "Red", "Pink", "Yellow"],
    correct: 1,
    explanation: "Safranin stains tissue a red color."
  },
  {
    text: "What color does iodine stain?",
     options: ["Red", "Blue-black", "Pink", "Yellow"],
     correct: 1,
     explanation: "Iodine stains tissue a blue-black color."
  },
   {
    text: "What color does phoroglucinol + HCl stain?",
     options: ["Yellow", "Red", "Pink", "Blue"],
     correct: 1,
     explanation: "Phoroglucinol + HCl stains tissue a red color."
  },
  {
    text: "What color does aniline HCl or SO4 stain?",
     options: ["Blue", "Pink", "Yellow", "Red"],
     correct: 2,
     explanation: "Aniline HCl or SO4 stains tissue a yellow color."
  },
 {
    text: "What color does schultz's solution stain?",
    options: ["Blue", "Yellow", "Pink", "Red"],
    correct: 1,
    explanation: "Schultz's solution stains tissue a yellow color."
  },
  {
    text: "What does aniline blue stain?",
    options: ["Nuclei", "Cytoplasm", "Fungal hyphae and spores", "Starch"],
    correct: 2,
    explanation: "Aniline blue is used to stain fungal hyphae and spores."
  },
  {
     text: "What does borax carmine stain?",
     options: ["Cytoplasm", "Nuclei", "Cellulose", "Lignin"],
     correct: 1,
     explanation: "Borax carmine is used to stain nuclei."
   },
  {
    text: "What does eosin stain?",
    options: ["Nuclei", "Cytoplasm and cellulose", "Lignin", "Fungal spores"],
    correct: 1,
    explanation: "Eosin is used to stain both cytoplasm and cellulose."
  },
  {
    text: "What does light/fast green stain?",
    options: ["Nuclei", "Cytoplasm or cellulose", "Lignin", "Starch"],
    correct: 1,
    explanation: "Light/fast green is used to stain either cytoplasm or cellulose."
  },
  {
    text: "What does methylene blue stain?",
    options: ["Cytoplasm", "Lignin", "Nuclei", "Starch"],
    correct: 2,
    explanation: "Methylene blue is used to stain nuclei."
  },
  {
    text: "What does safranin stain?",
    options: ["Fungal spores", "Starch", "Nuclei, cytoplasm, lignin and suberin", "Cellulose"],
    correct: 2,
     explanation: "Safranin is used to stain nuclei, cytoplasm, lignin, and suberin."
   },
 {
    text: "What does iodine stain?",
    options: ["Nuclei", "Starch", "Lignin", "Cytoplasm"],
    correct: 1,
    explanation: "Iodine is used to stain starch."
  },
  {
    text: "What does phoroglucinol + HCl stain?",
    options: ["Cellulose", "Nuclei", "Lignin", "Starch"],
    correct: 2,
    explanation: "Phoroglucinol + HCl is used to stain lignin."
  },
  {
    text: "What does aniline HCl or SO₄ stain?",
    options: ["Lignin", "Cytoplasm", "Starch", "Cellulose"],
    correct: 0,
    explanation: "Aniline HCl or SO4 is used to stain lignin."
  },
  {
    text: "What does Schultz's solution stain?",
     options: ["Nuclei", "Cytoplasm", "Lignin, cutin, suberin, protein", "Starch"],
     correct: 2,
     explanation: "Schultz's solution is used to stain lignin, cutin, suberin, and protein."
  },
   {
    text: "Which stain identifies fungal structures?",
    options: ["Eosin", "Methylene blue", "Aniline blue", "Safranin"],
    correct: 2,
     explanation: "Aniline blue is used to identify fungal structures such as hyphae and spores."
   },
  {
    text: "Which stains highlight nuclei?",
    options: ["Safranin and Eosin", "Methylene blue and Borax carmine", "Eosin and light green", "Aniline blue and Schultz's solution"],
    correct: 1,
    explanation: "Methylene blue and borax carmine are primarily used to stain nuclei."
  },
    {
    text: "Which stains highlight cytoplasm?",
    options: ["Iodine and Aniline HCl", "Safranin and Eosin", "Methylene blue and Borax carmine", "Iodine and Schultz’s solution"],
    correct: 1,
     explanation: "Safranin and eosin are used to stain cytoplasm."
   },
  {
    text: "Which stains identify cellulose?",
    options: ["Safranin and Iodine", "Eosin and Light/fast green", "Aniline blue and Schultz’s solution", "Methylene blue and Aniline HCl"],
    correct: 1,
    explanation: "Eosin and light/fast green are used to stain cellulose."
  },
  {
    text: "Why is parfocal design useful for a microscope?",
    options: [
      "Allows to see multiple specimen",
      "Keeps focus as magnification is changed",
       "Increases the magnification power",
       "Improves image quality"
    ],
    correct: 1,
    explanation: "A parfocal design is useful because it allows the image to remain in focus (or nearly in focus) when you switch between objective lenses of different magnifications, minimizing the need for major refocusing."
  },
  {
    text: "How does the objective lens affect the image seen through the eyepiece?",
    options: [
      "Provides the main focus",
      "Provides the final magnification",
       "It does not affect the image",
      "Provides the first magnification"
    ],
    correct: 3,
    explanation: "The objective lens provides the first stage of magnification and is essential for collecting light that passes through the specimen and creating an initial enlarged image."
  },
    {
    text: "If the objective lens with the highest magnification is the longest, what does this imply about its focal length?",
    options: [
      "Shorter focal length",
      "Longer focal length",
      "It depends on the microscope",
      "It is not related to focal length"
    ],
    correct: 0,
    explanation: "Objective lenses with higher magnification typically have a shorter focal length, which means they must be closer to the specimen to achieve the desired magnification."
  },
  {
     text: "If you are having trouble with image clarity when focusing with the coarse knob, what should you use first?",
     options: [
      "Diaphragm",
      "Fine focus",
      "Stage clips",
      "Rheostat"
     ],
     correct: 1,
     explanation: "After using the coarse focus to get the image in view, the fine focus should be used to sharpen the image and improve image clarity. The fine focus allows for small precise adjustments that enhance the details of the specimen."
  },
  {
    text: "If the field of view of a microscope is too small, how could you change it?",
    options: [
      "Change the objective to higher magnification",
      "Change the objective to lower magnification",
      "Increase the light",
      "Adjust the diaphragm"
    ],
    correct: 1,
    explanation: "To increase the field of view (see a wider area), you need to switch to a lower magnification objective lens. Lower magnification lenses show a larger area of the specimen."
   },
  {
    text: "If two objective lenses have the same magnification power, what can be different between them?",
    options: [
      "Only focal length is different",
      "Only clarity of images is different",
      "Numerical Aperture or resolution",
      "They are identical"
    ],
    correct: 2,
    explanation: "Even if two objective lenses have the same magnification, they can differ in their numerical aperture (NA), which affects the resolution and light gathering capability of the lens. Higher NA lenses can achieve greater resolution."
  },
   {
     text: "If the text describes the diaphragm as a part of the condenser, what might be a function of the condenser?",
    options: [
      "It helps illuminate the specimen",
      "It helps adjust light intensity",
      "It helps with magnification",
       "It helps with resolution"
     ],
     correct: 0,
     explanation:"The condenser is part of the microscope’s illumination system. The condenser collects and focuses the light from the light source onto the specimen, providing illumination needed for proper viewing. The diaphragm is responsible for adjusting light intensity."
   },
    {
    text: "Based on the parts of the microscope described, what part is designed to directly interact with the sample in order to change magnification?",
    options: [
      "Ocular lens",
      "Objective lens",
      "Revolving nosepiece",
      "Light source"
    ],
    correct: 1,
    explanation: "The objective lens is designed to directly interact with the sample when changing magnification. It's the lens closest to the specimen and provides the initial magnification, which is altered when different objective lenses are used."
  }, 
    {
      
        text: "What is the radiation source for a light microscope?",
        options: ["Electrons", "Light", "X-rays", "UV light"],
        correct: 1,
        explanation: "Light microscopes use light as their radiation source."
    },
    {
        text: "What is the radiation source for a transmission electron microscope (TEM)?",
        options: ["Light", "X-rays", "Electrons", "UV light"],
        correct: 2,
        explanation: "Transmission electron microscopes use electrons as their radiation source."
    },
    {
        text: "What is the approximate wavelength range of light used in light microscopy?",
        options: ["About 0.005 nm", "400-700 nm", "0.5 nm", "200 nm"],
        correct: 1,
        explanation: "The wavelength of visible light used in light microscopy is approximately 400-700 nm."
    },
    {
        text: "What is the approximate wavelength of electrons in TEM?",
        options: ["400-700 nm", "200 nm", "About 0.005 nm", "0.5 nm"],
        correct: 2,
        explanation: "The wavelength of electrons in TEM is approximately 0.005 nm."
    },
    {
        text: "What is the maximum resolution of a light microscope?",
        options: ["About 0.005 nm", "200 nm", "0.5 nm", "400-700nm"],
        correct: 1,
        explanation: "The maximum resolution of a light microscope is about 200 nm."
    },
    {
        text: "What is the maximum resolution of a TEM?",
        options: ["200 nm", "400-700 nm", "About 0.005 nm", "0.5 nm"],
        correct: 3,
        explanation: "The maximum resolution of a TEM is about 0.5 nm."
    },
    {
        text: "What type of system is used as lenses in light microscopy?",
        options: ["Electromagnets", "Glass lenses", "Copper grids", "Heavy metals"],
        correct: 1,
        explanation: "Light microscopes use glass lenses."
    },
    {
        text: "What type of system is used as lenses in TEM?",
        options: ["Glass lenses", "Copper grids", "Heavy metals", "Electromagnets"],
        correct: 3,
        explanation: "TEM uses electromagnets as lenses."
    },
    {
        text: "What is the typical specimen state in light microscopy?",
        options: ["Non-living and dehydrated", "Dehydrated, small and very thin", "Small and on a copper grid", "Living or non-living"],
        correct: 3,
        explanation: "Specimens for light microscopy can be living or non-living."
    },
    {
        text: "What is the typical specimen state in TEM?",
        options: ["Living or non-living", "Small and very thin", "Large and whole", "Non-living and dehydrated"],
        correct: 1,
        explanation: "TEM specimens are typically non-living, small, and very thin."
    },
    {
        text: "What is the typical specimen support for light microscopy?",
        options: ["Copper grid", "Glass slide", "Liquid suspension", "Paper mount"],
        correct: 1,
        explanation: "Light microscopy specimens are typically placed on a glass slide."
    },
    {
        text: "What is the typical specimen support for TEM?",
        options: ["Glass slide", "Liquid suspension", "Small copper grid", "Paper mount"],
        correct: 2,
        explanation: "TEM specimens are typically supported on a small copper grid."
    },
    {
        text: "What do the stains used in light microscopy consist of?",
        options: ["Heavy metals", "Glass", "Coloured dyes", "Resin"],
        correct: 2,
        explanation: "Light microscopy uses coloured dyes for staining."
    },
    {
        text: "What do stains used in TEM contain?",
        options: ["Coloured dyes", "Heavy metals", "Glass", "Water"],
        correct: 1,
        explanation: "TEM uses heavy metals in stains."
    },
    {
        text: "What is the usual color of images in light microscopy?",
        options: ["Black and white", "Greyscale", "Usually coloured", "Transparent"],
        correct: 2,
        explanation: "Images from light microscopy are usually coloured."
    },
    {
        text: "What is the usual color of images in TEM?",
        options: ["Usually coloured", "Black and white", "Transparent", "Greyscale"],
        correct: 1,
        explanation: "Images from TEM are usually black and white."
    },
    {
        text: "What are the two main ways of specimen preparation for microscopy?",
        options: ["Fixation and dehydration", "Embedding and sectioning", "Temporary and permanent slides", "Staining and mounting"],
        correct: 2,
        explanation: "The two main ways are preparing temporary and permanent slides."
    },
    {
        text: "What does FAA stand for as used in microscopy?",
        options: ["Formalin Alcohol Acetic", "Formalin Acetic Alcohol", "Fixation Acetic Alcohol", "Formic Alcohol Acetic"],
        correct: 1,
        explanation: "FAA stands for Formalin Acetic Alcohol."
    },
    {
        text: "What is FAA mainly recommended for?",
        options: ["Electron microscopy", "Light microscopy", "Dissection microscopy", "Fluorescence microscopy"],
        correct: 1,
        explanation: "FAA is mainly recommended for light microscopy."
    },
    {
        text: "What types of fixatives are used in electron microscopy?",
        options: ["Only FAA", "Only Osmium tetroxide", "Both FAA and Osmium Tetroxide", "Combination of primary and secondary"],
        correct: 3,
        explanation: "Electron microscopy uses a combination of primary and secondary fixatives, such as formaldehyde/glutaraldehyde and osmium tetroxide."
    },
    {
        text: "What type of material is resin used for in microscopy?",
options: ["It is used for sectioning", "It is used for embedding in light microscopy", "It is used for embedding in electron microscopy", "It is used for mounting"],
        correct: 2,
        explanation: "Resin is used for embedding in electron microscopy."
    },
    {
        text: "What kind of knives are typically used for sectioning in light microscopy?",
        options: ["Diamond knives only", "Ultramicrotome only", "Metal knives and ordinary microtomes", "Glass knives only"],
        correct: 2,
        explanation: "Metal knives and ordinary microtomes are used for sectioning in light microscopy"

    }, 
  {
    text: "What does 'magnification' refer to?",
    options: [
      "The clarity of detail",
      "The size of the image",
      "The ratio of image size to actual size",
      "The amount of light used"
    ],
    correct: 2,
    explanation: "Magnification is the process of enlarging the apparent size of an object, expressed as the ratio of the image size to the actual size of the object. It makes things appear bigger, but doesn't necessarily improve clarity."
  },
  {
    text: "What is the typical magnification range of a compound microscope?",
    options: [
      "1x to 10x",
      "4x to 100x",
      "100x to 1000x",
      "1000x to 10000x"
    ],
    correct: 2,
    explanation: "Compound microscopes typically have a magnification range from 100x to 1000x. This range is achieved using a combination of objective and ocular lenses."
  },
  {
    text: "What does 'resolution' refer to?",
    options: [
      "The size of the image",
      "The amount of light used",
      "The ability to see fine detail",
      "The number of layers seen"
    ],
    correct: 2,
    explanation: "Resolution is the ability of a microscope to distinguish between two points that are very close together. A higher resolution allows for more clarity and the ability to see fine details."
  },
  {
    text: "What does 'field of view' refer to?",
    options: [
      "The clarity of the image",
      "The focus of the image",
      "How much you can see at one time",
      "The size of the lens"
    ],
    correct: 2,
    explanation: "The field of view is the diameter of the circle of light you see when looking into a microscope. It essentially defines how much of the specimen is visible at one time. A larger field of view means you can see a wider area."
  },
  {
    text: "How does magnification affect the field of view?",
    options: [
      "As magnification increases, the field of view increases",
      "As magnification increases, the field of view decreases",
      "Magnification does not affect field of view",
      "The relationship is variable"
    ],
    correct: 1,
    explanation: "As the magnification of a microscope increases, the field of view decreases. This means that while the image appears larger, you see a smaller portion of the specimen. It's like zooming in; you see less area but with more detail."
  },
  {
    text: "What does 'depth of field' refer to?",
    options: [
      "The number of lenses used",
      "The layers of the specimen you can see in focus",
      "The light intensity",
      "The size of the area that is in focus"
    ],
    correct: 1,
    explanation: "Depth of field refers to the thickness of the specimen that is in focus. It represents the range of distance along the optical axis that appears sharp. A large depth of field means multiple layers of the specimen can be in focus, whereas a small depth of field is useful for viewing detailed layers."
  },
  {
    text: "What is 'total magnification' a product of?",
    options: [
      "The ocular lens only",
      "The objective lens only",
      "The objective and ocular lenses",
      "Light intensity and lenses"
    ],
    correct: 2,
    explanation: "Total magnification is calculated by multiplying the magnification of the objective lens by the magnification of the ocular lens. Both lenses contribute to the final magnification of the image seen."
  },
  {
    text: "If the ocular lens is 10x, what is the total magnification if the objective is 40x?",
    options: [
      "10x",
      "40x",
      "50x",
      "400x"
    ],
    correct: 3,
    explanation: "Total magnification is calculated by multiplying the ocular lens magnification (10x) by the objective lens magnification (40x), resulting in a total magnification of 400x (10 * 40 = 400)."
  },
  {
    text: "What does 'parfocal' mean?",
    options: [
      "Only one lens is used",
      "Focus remains when changing magnification",
      "Focus must be adjusted after changing magnification",
      "Depth of field remains the same"
    ],
    correct: 1,
    explanation: "Parfocal microscopes are designed so that when you change from one objective lens to another, the image remains approximately in focus. This minimizes the amount of fine adjustment needed when switching between objectives and making observation easier."
  },
  {
    text: "What is another name for the 'ocular lens'?",
    options: [
      "Objective",
      "Condenser",
      "Eyepiece",
      "Diaphragm"
    ],
    correct: 2,
    explanation: "The ocular lens is also commonly known as the 'eyepiece' because it is the lens closest to the viewer's eye. It's the lens through which you look at the magnified image."
  },
  {
    text: "Where is the ocular lens located?",
    options: [
      "Closest to the sample",
      "Below the stage",
      "At the top where you look",
      "In the base"
    ],
    correct: 2,
    explanation: "The ocular lens (or eyepiece) is located at the top of the microscope, where the user looks to view the magnified image of the sample."
  },
  {
    text: "What does the ocular lens provide?",
    options: [
      "Only magnification of image",
      "Final magnification of the object",
      "First magnification of the object",
      "Condensation of light to sample"
    ],
    correct: 1,
    explanation: "The ocular lens provides the final magnification of the object, typically multiplying the image from the objective lens to make the object viewable to the observer."
  },
  {
    text: "What is the typical magnification power of ocular lenses?",
    options: [
      "1x to 5x",
      "5x to 10x",
      "10x to 15x",
      "20x to 25x"
    ],
    correct: 1,
    explanation: "Ocular lenses typically have a magnification power between 5x to 10x. However, 10x is the most common magnification found on a standard compound microscope."
  },
  {
    text: "What do objective lenses do?",
    options: [
      "Provide final magnification",
      "Collect light",
      "First magnify the object",
      "Focus the light source"
    ],
    correct: 2,
    explanation: "The objective lenses are responsible for the initial magnification of the specimen. They collect light that passes through the specimen and create an enlarged image."
  },
  {
    text: "How many objective lenses are typically found on a microscope?",
    options: [
      "1 or 2",
      "2 or 3",
      "3 or 4",
      "5 or 6"
    ],
    correct: 2,
    explanation: "Compound microscopes typically have 3 or 4 objective lenses. These different lenses allow for varying levels of magnification."
  },
  {
    text: "Which objective lens has the lowest power?",
    options: [
      "Longest lens",
      "Shortest lens",
      "Medium lens",
      "Rotating lens"
    ],
    correct: 1,
    explanation: "The shortest objective lens typically has the lowest magnification power. This lens is used for initial viewing and locating the specimen."
  },
  {
    text: "Which lens has the highest power?",
    options: [
      "Shortest lens",
      "Longest lens",
      "Medium lens",
      "Rotating lens"
    ],
    correct: 1,
    explanation: "The longest objective lens typically has the highest magnification power. This lens provides the most magnified view of the specimen and is used for detailed observation."
  },
  {
    text: "What connects the eyepiece to the objective lenses?",
    options: [
      "Arm",
      "Base",
      "Body tube",
      "Nosepiece"
    ],
    correct: 2,
    explanation: "The body tube is the hollow part of the microscope that connects the eyepiece (ocular lens) to the objective lenses. It ensures the proper alignment of the lenses."
  },
  {
    text: "What houses the objective lenses and is used to change them?",
    options: [
      "Stage",
      "Revolving nosepiece",
      "Body tube",
      "Condenser"
    ],
    correct: 1,
    explanation: "The revolving nosepiece is a rotating mechanism that holds the objective lenses. By rotating the nosepiece, one can easily switch between objectives with different magnifications."
  },
  {
    text: "What part of the microscope is used to carry it and connects the tube to the base?",
    options: [
      "Base",
      "Stage",
      "Arm",
      "Revolving nosepiece"
    ],
    correct: 2,
    explanation: "The arm is the part of the microscope that connects the body tube to the base, and it is also used to carry the microscope. It provides a stable structure and safe handling point."
  },
  {
    text: "What is the flat platform where you place slides?",
    options: [
      "Base",
      "Stage",
      "Arm",
      "Revolving nosepiece"
    ],
    correct: 1,
    explanation: "The stage is the flat platform where the specimen slide is placed for observation. It provides a stable surface for the slide and sometimes includes clips to hold the slide in place."
  },
  {
    text: "What part holds the slide on the stage?",
    options: [
      "Fine adjustment knob",
      "Coarse adjustment knob",
      "Stage clips",
      "Diaphragm"
    ],
    correct: 2,
    explanation: "Stage clips are small metal clips on the microscope's stage that are used to secure the slide in place and prevent it from moving during viewing. They are very important for stable observation."
  },
  {
    text: "What is used for focusing the specimen?",
    options: [
      "Diaphragm",
      "Stage clips",
      "Fine adjustment knob",
      "Coarse adjustment knob"
    ],
    correct: 3,
    explanation: "The fine and coarse adjustment knobs are used to bring the specimen into focus. The coarse adjustment knob makes large adjustments, while the fine adjustment knob makes small, precise adjustments for optimal image clarity."
  },
  {
    text: "Which knob is for fine focusing?",
    options: [
      "Diaphragm",
      "Stage clips",
      "Fine adjustment knob",
      "Coarse adjustment knob"
    ],
    correct: 2,
    explanation: "The fine adjustment knob is specifically used to make small, precise adjustments to the focus. It is used after the coarse adjustment knob to get a sharp and clear image."
  },
  {
    text: "What is the role of the 'Diaphragm'?",
    options: [
      "It controls light intensity",
      "It adjusts magnification",
      "It controls focus",
      "It holds the slides"
    ],
    correct: 0,
    explanation: "The diaphragm is used to control the amount of light that passes through the specimen. Adjusting the diaphragm can improve image contrast and visibility."
  },
  {
    text: "What is the “light source”?",
    options: [
      "Where you place slides",
      "Where light comes through",
      "Where the eyepiece is",
      "Where objective lenses are"
    ],
    correct: 1,
     explanation: "The light source of the microscope is where light is emitted. The light shines up through the specimen and the lenses, allowing you to see the magnified image. "
      }, 
      ], 
  "ZOO101-E1":[
    
  {
    text: "What is the source of the muscles and blood vascular system in animals?",
    options: ["Ectoderm", "Mesoderm", "Endoderm", "Blastoderm"],
    correct: 1,
    explanation: "The mesoderm is responsible for forming the muscles and blood vascular system."
  },
  {
    text: "The cavity of the double-walled cup is called:",
    options: ["Blastocoel", "Archenteron", "Coelom", "Gastrula"],
    correct: 1,
    explanation: "The cavity of the double-walled cup is called the Archenteron."
  },
  {
    text: "During which phase of development does organogenesis occur?",
    options: ["Cleavage", "Gastrulation", "Organogenesis", "Implantation"],
    correct: 2,
    explanation: "Organogenesis is the phase of development where organs are formed."
  },
  {
    text: "The germinal layers are produced by the disappearance of which structure?",
    options: ["Zygote", "Blastoderm", "Germ layers", "Embryo"],
    correct: 1,
    explanation: "The germinal layers are produced by the disappearance of a part of the blastoderm."
  },
  {
    text: "What is the term for the process of cell movement and folding that forms the gastrula?",
    options: ["Invagination", "Epiboly", "Ingression", "Delamination"],
    correct: 0,
    explanation: "Gastrulation is formed by invagination during the development of the gastrula."
  },
  {
    text: "What are the two primary germ layers mentioned in the text?",
    options: ["Ectoderm and endoderm", "Mesoderm and ectoderm", "Endoderm and ectoderm", "Mesoderm and endoderm"],
    correct: 0,
    explanation: "The two primary germ layers mentioned are ectoderm and endoderm."
  },
  {
    text: "The endoderm forms which of the following structures?",
    options: ["Muscles", "Nervous system", "Alimentary canal", "Skin"],
    correct: 2,
    explanation: "The endoderm forms the alimentary canal and digestive glands."
  },
  {
    text: "What structure is formed from the primary germ layers during organogenesis?",
    options: ["Tissues", "Organs", "Cells", "Embryos"],
    correct: 1,
    explanation: "Organogenesis involves the formation of organs from the primary germ layers."
  },
  {
    text: "What is the main role of the primary germ layers?",
    options: ["To form the placenta", "To produce the nervous system", "To give rise to various organs", "To store nutrients"],
    correct: 2,
    explanation: "The primary germ layers give rise to various organs during development."
  },
  {    text: "Which phase of development involves the splitting of the germinal layers into smaller groups?",
    options: ["Gastrulation", "Organogenesis", "Cleavage", "Implantation"],
    correct: 0,
    explanation: "In gastrulation, the germinal layers split into smaller groups to form different structures."
  },
  {
    text: "The sixth phase of development is referred to as:",
    options: ["Implantation", "Gastrulation", "Organogenesis", "Histological differentiation"],
    correct: 3,
    explanation: "The sixth phase of development is the period of growth and histological differentiation."
  },
  {
    text: "What does the term 'larva' refer to in this context?",
    options: ["An adult organism", "A newly fertilized egg", "A young organism undergoing metamorphosis", "An embryonic structure"],
    correct: 2,
    explanation: "A larva is a young organism that undergoes metamorphosis before becoming an adult."
  },
  {
    text: "The ability of some animals to repair injuries is known as:",
    options: ["Regeneration", "Metamorphosis", "Plasticity", "Morphogenesis"],
    correct: 0,
    explanation: "Regeneration is the ability of some animals to repair injuries sustained from the environment."
  },
  {
    text: "Which of the following structures is derived from the mesoderm?",
    options: ["Skin", "Nervous system", "Muscles", "Digestive tract"],
    correct: 2,
    explanation: "The mesoderm gives rise to muscles and other connective tissues."
  },
  {
    text: "The term 'organogenesis' specifically refers to the formation of:",
    options: ["Cells", "Organs", "Tissues", "Germ layers"],
    correct: 1,
    explanation: "Organogenesis is the phase where specific organs are formed from the germ layers."
  },
  {
    text: "What is the significance of the size of the egg in development?",
    options: ["Larger eggs develop faster", "Smaller eggs are more viable", "Larger eggs have more nutrients", "Size does not matter"],
    correct: 2,
    explanation: "The size of the egg is significant because larger eggs contain more nutrients for the developing embryo."
  },
  {
    text: "The process of fertilization involves which two components?",
    options: ["Ovum and spermatozoon", "Embryo and yolk", "Zygote and blastomere", "Germ layers and organs"],
    correct: 0,
    explanation: "Fertilization involves the union of the ovum and spermatozoon."
  },
  {
    text: "Which germ layer is responsible for forming the skin and nervous system?",
    options: ["Mesoderm", "Endoderm", "Ectoderm", "Blastoderm"],
    correct: 2,
    explanation: "The ectoderm is responsible for forming the skin and nervous system."
  },
  {
    text: "What happens to the yolk during development?",
    options: ["It is absorbed by the embryo", "It provides nutrients for growth", "It forms the digestive system", "It is expelled during hatching"],
    correct: 1,
    explanation: "The yolk provides essential nutrients to the developing embryo."
  },
  {
    text: "The process by which the embryo attaches to the uterine wall is called:",
    options: ["Cleavage", "Implantation", "Fertilization", "Gastrulation"],
    correct: 1,
    explanation: "The embryo attaches to the uterine wall during implantation."
  },
  {
    text: "The term 'embryonic stem cells' refers to:",
    options: ["Cells that can only differentiate into specific tissues", "Cells that can develop into any cell type in the body", "Cells that are restricted to forming the placenta", "Cells that are specialized for a specific function"],
    correct: 1,
    explanation: "Embryonic stem cells are pluripotent and can develop into any cell type."
  },
  {
    text: "Which of the following is a key characteristic of embryonic development?",
    options: ["It is a continuous process with no clear stages", "It involves a series of well-defined stages", "It only occurs in mammals", "It is independent of environmental factors"],
    correct: 1,
    explanation: "Embryonic development has clear stages that can be defined."
  },
  {
    text: "The development of an organism from a single cell to a multicellular structure is referred to as:",
    options: ["Differentiation", "Morphogenesis", "Developmental biology", "Ontogeny"],
    correct: 3,
    explanation: "Ontogeny refers to the development of an organism from a single cell to a multicellular structure."
  },
  {
    text: "What is the primary function of the yolk in an egg?",
    options: ["To provide nutrients to the developing embryo", "To protect the embryo from external damage", "To assist in gas exchange", "To facilitate the movement of the embryo"],
    correct: 0,
    explanation: "The yolk serves as a source of nourishment for the developing embryo."
  },
  {
    text: "What is the significance of the first meiotic division in oogenesis?",
    options: ["It produces a haploid egg", "It produces two functional gametes", "It reduces the chromosome number by half", "It initiates the formation of polar bodies"],
    correct: 2,
    explanation: "The first meiotic division is essential for halving the chromosome count in the egg."
  },
  {
    text: "Which cleavage type is characterized by the uneven distribution of yolk?",
    options: ["Holoblastic", "Meroblastic", "Radial", "Spiral"],
    correct: 1,
    explanation: "Meroblastic cleavage is characterized by uneven distribution of yolk."
  },
  {
    text: "In which type of cleavage do all cells divide completely?",
    options: ["Holoblastic", "Meroblastic", "Telolecithal", "Isolecithal"],
    correct: 0,
    explanation: "Holoblastic cleavage occurs in eggs with little yolk, allowing complete division."
  },
  {
    text: "What does the term 'microlecithal' refer to?",
    options: ["A moderate amount of yolk", "A large amount of yolk", "A small amount of yolk", "No yolk"],
    correct: 2,
    explanation: "Microlecithal eggs contain a small amount of yolk."
  },
  {
    text: "Which structure is essential for gas exchange in embryos?",
    options: ["Yolk sac", "Amnion", "Chorion", "Allantois"],
    correct: 2,
    explanation: "The chorion is essential for gas exchange in embryos."
  },
  {
    text: "The primary role of embryonic membranes is to:",
    options: ["Provide nutrients", "Facilitate movement", "Protect the embryo", "All of the above"],
    correct: 3,
    explanation: "Embryonic membranes serve multiple roles, including protection and nutrient provision."
  },
  {
    text: "Radial cleavage occurs in which group of organisms?",
    options: ["Deuterostomes", "Protostomes", "Unicellular organisms", "Fungi"],
    correct: 0,
    explanation: "Radial cleavage occurs in deuterostomes, such as vertebrates and echinoderms."
  },
   {
     text: "How is a compound microscope image described?",
      options: [
         "3D with low resolution",
         "2D and highly magnified",
        "Inverted with low magnification",
       "3D and highly magnified"
    ],
      correct: 1,
      explanation:"A compound microscope image is typically described as 2D (two-dimensional) and highly magnified, allowing detailed observation of small specimens."
    },
    {
    text: "Which microscope is generally considered the most complex?",
    options: [
      "Dissection microscope",
      "Compound microscope",
      "Fluorescence microscope",
      "All are equally complex"
    ],
    correct: 2,
      explanation: "Fluorescence microscopes are generally considered to be the most complex because they involve additional components like specialized light sources, filters and detectors."
   },
   {
    text: "Which microscope is likely to have dual eyepieces?",
    options: [
      "Dissection microscope",
       "Compound microscope",
      "Fluorescence microscope",
       "Both compound and fluorescence"
    ],
     correct: 0,
      explanation:"Dissection microscopes are often designed with dual eyepieces to provide the user with stereoscopic vision, creating the three-dimensional image of the specimen."
    },
  {
    text: "Which type of microscope seems best suited to looking at large and whole specimens?",
    options: [
      "Dissection",
      "Compound",
      "Fluorescence",
      "They are all equal in capability"
    ],
    correct: 0,
     explanation: "Based on their function, dissection microscopes are best suited for looking at large and whole specimens due to their wide field of view, long working distance, and three-dimensional image."
  },
   {
    text: "Why is a dissection microscope useful for dissection?",
    options: [
      "Its high magnification allows for detailed views of cells",
      "Its illumination is specifically for dissection",
     "Its 3D image provides depth perception",
      "Its low resolution prevents damage"
    ],
    correct: 2,
     explanation: "The 3D image provided by a dissection microscope gives the user depth perception, making it easier to manipulate tools when dissecting or working with the specimen."
  }, 
  {
    text: "What does it mean that a compound microscope is 'most commonly used'?",
    options: [
      "It's the best microscope",
      "It's the cheapest microscope",
      "It has a balance of magnification and usability",
      "All biologists use it"
    ],
    correct: 2,
    explanation: "The phrase 'most commonly used' implies that the compound microscope strikes a good balance between magnification capabilities, resolution, and overall ease of use making it a good all-purpose tool."
  },
  {
    text: "Which of these microscopy techniques is advancing most rapidly?",
     options: [
      "Dissection microscopy",
      "Compound microscopy",
      "Fluorescence microscopy",
      "All are rapidly advancing"
    ],
    correct: 2,
    explanation: "Fluorescence microscopy is advancing most rapidly due to its high growth in application in medicine and biology, with the development of new techniques and accessories."
  },
  {
    text: "What is a key difference between fluorescence and phosphorescence?",
     options: [
       "Phosphorescence is higher in intensity",
        "Fluorescence is a delayed light emission",
      "Phosphorescence is a delayed light emission",
       "Fluorescence uses shorter wavelengths"
    ],
    correct: 2,
    explanation: "While both fluorescence and phosphorescence involve the emission of light after excitation, a key difference is that phosphorescence is a delayed light emission, lasting longer than fluorescence which is immediate."
  },
    {
    text: "Why is it important to have different types of microscopes?",
     options: [
      "All microscopes are the same",
      "Each microscope is suitable for specific specimens and study",
       "Some microscopes are more expensive",
      "Some microscopes are more old fashioned"
    ],
    correct: 1,
     explanation: "It is important to have different types of microscopes because each type is specifically designed and suited for observing particular specimens and answering specific scientific questions. Not all microscopes have the same resolution, magnification, or field of view."
   },
   {
    text: "If a sample does not fluoresce or phosphoresce, which microscope would be least suitable for studying it?",
    options: [
       "Dissection microscope",
       "Compound microscope",
      "Fluorescence microscope",
       "Either dissection or compound microscope"
    ],
    correct: 2,
    explanation: "If a sample does not fluoresce or phosphoresce, a fluorescence microscope would be the least suitable since it relies on those properties to visualize the sample."
  },
  {
    text: "What kind of samples are not suitable to study with a compound microscope?",
     options: [
       "Large and whole samples",
      "Single cell samples",
       "Living cell samples",
      "Dead cell samples"
    ],
    correct: 0,
    explanation: "Compound microscopes are not well-suited for studying large and whole samples because they have a smaller field of view and are better designed for microscopic specimens like cells."
  },
  {
    text: "Which microscope would be preferred to observe live organisms in their natural state?",
    options: [
      "Dissection microscope",
      "Compound microscope",
      "Fluorescence microscope",
       "Electron microscope"
    ],
    correct: 0,
    explanation: "A dissection microscope would be preferred for observing live organisms in their natural state because it provides a 3D view, a large working distance and an easier way to view whole and often larger organisms."
  },
  {
    text: "Which microscope would you choose for general biology studies and why?",
    options: [
      "Dissection microscope, because it’s easy to see the whole specimens",
      "Compound microscope, because it provides a balance of magnification and usability",
       "Fluorescence microscope, because it is the most versatile",
      "None of them, you need all three equally"
    ],
      correct: 1,
       explanation: "For general biology studies, the compound microscope is the most suitable choice because it balances magnification, resolution, and ease of use, making it a good all-purpose instrument."
    },
 {
    text: "If you were to improve on the design of the fluorescence microscope, what would be the first improvement?",
    options: [
       "Making it smaller",
       "More ease of use",
       "Improving resolution and magnification power",
       "Making it more affordable"
    ],
    correct: 2,
    explanation: "While all options are beneficial, the first improvement for a fluorescence microscope would be to enhance the resolution and magnification power since those are its limiting factors, allowing for better image clarity and detail."
  }, 
  {
    text: "When did Charles A. Spencer build his microscopes?",
    options: [
      "Early 18th century",
      "Mid 19th century",
      "Late 19th century",
      "Early 20th century"
    ],
    correct: 1,
    explanation: "Charles A. Spencer built his microscopes in the mid-19th century."
  },
  {
    text: "How were the instruments built by Charles A. Spencer described?",
    options: [
      "Basic",
      "Complex",
      "Finest",
      "Simplistic"
    ],
    correct: 2,
    explanation: "The microscopes built by Charles A. Spencer were known as some of the finest instruments of their time."
  },
  {
    text: "What was the magnification of Spencer's microscopes with ordinary light?",
     options: [
      "Up to 125 diameters",
      "Up to 1250 diameters",
      "Up to 500 diameters",
      "Up to 5000 diameters"
    ],
    correct: 0,
    explanation: "With ordinary light, Spencer's microscopes had a magnification of up to 125 diameters."
  },
  {
    text: "What was the highest magnification achieved with blue light in Spencer's microscopes?",
    options: [
      "Up to 1250 diameters",
      "Up to 12500 diameters",
      "Up to 5000 diameters",
      "Up to 500 diameters"
    ],
    correct: 0,
    explanation: "The highest magnification achieved with blue light in Spencer's microscopes was up to 1250 diameters."
  },
  {
    text: "How does magnification with blue light compare to ordinary light in Spencer's microscopes?",
     options: [
       "Lower",
       "The same",
      "Higher",
      "Unaffected"
    ],
    correct: 2,
     explanation: "Magnification with blue light was higher compared to ordinary light in Spencer's microscopes."
  },
  {
    text: "What defines a 'simple microscope'?",
     options: [
      "It has multiple lenses",
      "It has only one lens",
       "It has an adjustable stage",
      "It uses a light source"
    ],
    correct: 1,
    explanation: "A 'simple microscope' is defined by having only one lens to magnify the image."
  },
    {
    text: "What kind of lens is typically in a simple microscope?",
    options: [
      "Ocular only",
       "Objective only",
      "Both ocular and objective",
      "Condenser"
    ],
     correct: 1,
      explanation: "A simple microscope typically uses only one objective lens."
  },
    {
    text: "What defines a 'compound microscope'?",
    options: [
       "High resolution",
      "Adjustable stage",
       "Both objective and ocular lenses",       "Electronic components"
    ],
    correct: 2,
    explanation: "A 'compound microscope' is defined by having both objective and ocular lenses working together to magnify the image."
   },
   {
    text: "What does a compound microscope use?",
     options: [
       "A single lens system",
       "One type of lens",
      "Multiple lens types",
       "A simpler design"
    ],
      correct: 2,
      explanation: "A compound microscope uses multiple types of lenses, including objective and ocular lenses, to achieve a higher magnification."
   },
    {
    text: "How many lens types are in a simple microscope?",
     options: [
      "Two or more",
      "Only one",
       "Either one or two",
       "None"
    ],
      correct: 1,
     explanation: "A simple microscope has only one lens type, usually a single objective lens."
    },
   {
    text: "What is the 'Handle' on the simple microscope?",
    options: [
     "The light source",
      "The base",
      "The focusing knob",
       "Part to move it"
    ],
    correct: 3,
    explanation: "On a simple microscope, the 'Handle' is the part used to move the instrument."
   },
  {
    text: "Where is the 'Slide' placed on a simple microscope?",
     options: [
       "On the lamp",
       "On the stand",
        "On the stage",
       "Above the eyepiece"
     ],
      correct: 2,
       explanation: "On a simple microscope, the 'Slide' is placed on the stage for observation."
   },
  {
    text: "Where is the 'eyepiece' located on a compound microscope?",
    options: [
      "On the base",
      "At the bottom near the light source",
      "At the top",
      "Below the objective lens"
    ],
    correct: 2,
    explanation: "On a compound microscope, the 'eyepiece' is located at the top, where the user looks through to view the magnified image."
  },
   {
     text: "What does the 'Nosepiece' hold on a compound microscope?",
      options: [
        "The support structure",
        "The stage",
        "Multiple objective lenses",
        "The lens closest to the eye"
      ],
      correct: 2,
      explanation: "On a compound microscope, the 'Nosepiece' holds multiple objective lenses, allowing the user to switch between them."
   },
   {
     text: "What is below the stage on a compound microscope?",
      options: [
        "The objective",
       "The slide",
        "The Sub stage",
        "The light source"
      ],
      correct: 3,
      explanation: "Below the stage of a compound microscope is the light source, which provides illumination for viewing the specimen."
    },
    {
      text: "What does the 'Coarse Adjustment knob' do on a compound microscope?",
      options: [
        "Holds the sample",
       "Does overall focusing",
        "Does fine focusing",
        "Is closest to the objective"
      ],
      correct: 1,
      explanation:"The 'Coarse Adjustment knob' on a compound microscope is used for large focusing adjustments to get the sample into view."
    },
  {
    text: "How many main microscope types are used by biologists?",
     options: [
      "Two",
      "Three",
      "Four",
      "Five"
    ],
    correct: 1,
    explanation: "Biologists commonly use three main types of microscopes."
  },
  {
    text: "Which is NOT a main microscope type?",
     options: [
      "Optical Dissection",
       "Confocal",
      "Scanning Electron (SEM)",
       "Dark Field"
    ],
    correct: 3,
    explanation: "Dark field is a mode within an optical compound microscope, and is not a main type of microscope itself."
  },
    {
     text: "What does 'SEM' stand for?",
    options: [
      "Scanning Emission",
      "Scanning Electron",
      "Scanning Elemental",
      "Surface Electron"
    ],
     correct: 1,
      explanation:"'SEM' stands for Scanning Electron Microscope."
  },
   {
     text: "What does 'TEM' stand for?",
    options: [
      "Thermal Electron",
      "Transmission Electron",
      "Total Electron",
     "Transforming Electron"
    ],
correct: 1,
      explanation: "'TEM' stands for Transmission Electron Microscope."
   },
  {
    text: "What is the combined type of 'Optical Compound - Light, Fluorescence and Confocal'?",
     options: [
       "Separate types",
       "Compound microscope with different modes",
        "A single mode microscope",
       "It's a light only microscope"
    ],
     correct: 1,
      explanation: "Optical Compound microscopes are versatile. They use light and can come with different modes such as fluorescence and confocal capabilities which work together as one instrument."
   },
  {
    text: "What does 'ordinary light' most likely mean?",
    options: [
      "Sunlight",
      "Incandescent light",
      "Visible light",
      "Laser light"
    ],
    correct: 2,
     explanation: "'Ordinary light' most likely refers to visible light, which encompasses the range of wavelengths that are visible to the human eye."
  },
  {
     text: "Why is the term 'diameters' significant in early microscopy?",
      options: [
        "Specifies microscope length",
       "Describes linear enlargement",
       "Measures lens diameter",
        "Calculates resolution"
    ],
     correct: 1,
      explanation: "The term 'diameters' is significant because it describes the linear enlargement or magnification of the specimen. In early microscopy, magnification was expressed in terms of how many times larger an image was compared to the actual specimen."
   },
   {
    text: "What does the use of 'blue light' suggest about Spencer’s microscopes?",
     options: [
      "Coloured images",
      "Fluorescence microscopy",
        "Higher magnification and resolution",
      "Cooling the specimen"
    ],
    correct: 2,
    explanation: "The use of 'blue light' suggests that Spencer’s microscopes could achieve higher magnification and resolution, as shorter wavelengths of light allow for better separation of tiny structures."
   },
  {
    text: "What is the main difference between simple and compound microscopes?",
    options: [
       "Size",
      "Number of lenses",
       "Resolution",
        "Light source"
    ],
    correct: 1,
     explanation: "The main difference between simple and compound microscopes is the number of lenses used for magnification; simple microscopes use one, while compound microscopes use multiple."
  }, 
  {
    text: "What do the four listed microscope types suggest?",
    options: [
      "Only four options for biological study",
      "Need for diverse techniques",
      "Microscopy is limiting",
       "All microscope types are the same"
    ],
    correct: 1,
    explanation: "The different microscope types listed suggest the need for diverse techniques in biological study because each type is designed for specific applications and provides unique insights."
  },
  {
    text: "Why are electron microscopes listed separately from optical ones?",
    options: [
       "Not used by biologists",
       "No lenses",
      "Different illumination",
      "Same design"
    ],
    correct: 2,
    explanation: "Electron microscopes are listed separately from optical ones because they use electrons for illumination instead of light, which allows for much higher resolution."
  },
  {
    text: "How does 'blue light' relate to resolution?",
    options: [
      "Reduces resolution",
      "Increases magnification",
      "Shorter wavelengths for better resolution",
      "For fluorescent microscopy only"
    ],
    correct: 2,
    explanation: "Blue light, having shorter wavelengths than other visible light, provides higher resolution in microscopy, allowing for the separation of fine details."
  },
  {
    text: "If using 'light,' 'fluorescence,' and 'confocal' modes, what microscope type is used?",
    options: [
      "Optical Dissection",
      "Optical Compound",
      "Scanning Electron",
      "Transmission Electron"
    ],
    correct: 1,
    explanation: "If using 'light', 'fluorescence' and 'confocal' modes, the microscope type in use is an Optical Compound microscope, which can incorporate these different modes."
  },
  {
    text: "How are electron microscopes different from optical microscopes?",
    options: [
      "Electron microscopes use lenses, optical use mirrors",
      "Optical uses electrons, electron uses light",
      "Electron microscopes use electrons for imaging",
      "They have same design"
    ],
    correct: 2,
     explanation: "Electron microscopes are different from optical microscopes because they use electrons instead of light to generate images, enabling much higher magnifications and resolutions."
  },
    {
    text: "What is 'diameter' closest to in terms of magnification?",
     options: [
      "Area",
      "Linear magnification",
      "Resolution",
      "Field of view"
      ],
     correct: 1,
     explanation: "The term 'diameter' is closely related to linear magnification, as it refers to the enlargement of a specimen's length or width, not its area."
   },
  {
    text: "Is 'ocular lens' the same as 'eyepiece'?",
     options: [
      "Yes, they are the same",
      "No, eyepiece is objective",
       "No, ocular is part of eyepiece",
       "It depends on microscope"
    ],
      correct: 0,
      explanation:"Yes, the terms 'ocular lens' and 'eyepiece' are generally used interchangeably to refer to the lens closest to the user's eye."
    },
    {
      text: "What can be inferred about the evolution of microscopy?",
        options: [
          "Microscopy is progressing to more simple designs",
          "Microscopy is progressing to higher complex designs",
        "Microscopy progressed all at the same time",
         "Microscopes didn’t evolve"
      ],
      correct: 1,
      explanation: "Microscopy has progressed toward more complex designs, incorporating new technologies and functionalities to achieve better image quality and resolution."
    },
  {
    text: "What unit of magnification is more accurate than 'diameters'?",
      options: [
        "Resolution",
        "Area",
        "Linear magnification with a numerical value",
       "Field of view"
       ],
    correct: 2,
     explanation: "Linear magnification with a numerical value is a more accurate way to express magnification than 'diameters', as it specifies how many times larger the image is than the specimen with an exact number."
   },
 {
    text: "How do simple microscopes like Leeuwenhoek’s relate to compound microscopes?",
    options: [
       "Unrelated inventions",
      "Compound microscopes are direct descendant of simple microscopes",
       "Modern microscopes similar structure and principle as Leeuwenhoek’s",
      "No relationship"
    ],
    correct: 1,
     explanation: "Compound microscopes are considered direct descendants of simple microscopes, as they built upon the basic principle of magnification, adding more lenses for increased magnification and resolution."
   },
    {
    text: "Why is distinguishing between optical and electron microscopes important for biologists?",
     options: [
        "Determines image quality",
       "Determines observable sample type",
        "Determines resolution and sample nature",
        "Determines ease of use"
    ],
     correct: 2,
     explanation: "Distinguishing between optical and electron microscopes is important for biologists because it determines the resolution capabilities and the type of sample that can be observed and studied."
   },
  {
    text: "If 'confocal microscopy' is mentioned, what other microscopic technique is likely used?",
    options: [
      "Electron microscopy",
      "Fluorescence microscopy",
       "Dissection microscopy",
      "Simple microscopy"
    ],
    correct: 1,
     explanation: "Confocal microscopy is often used in conjunction with fluorescence microscopy, as confocal techniques improve the resolution and image quality of fluorescent signals by removing out-of-focus light."
    },
    {
    text: "What is a likely next focus of development in microscopy?",
    options: [
       "More manual focusing",
        "Higher resolution without blue light",
        "Better light and electron sources",
      "Easier user experience"
    ],
    correct: 2,
      explanation: "A likely next focus of development in microscopy is on improving light and electron sources, which can enable higher resolution, contrast, and more detailed images in general."
    }, 
      ], 
  "BOT101-E1": [
    {
      
    }, 
      ], 
  "BOT101-E2": [
    {
      
    }, 
      ], 
  "BOT101-E3": [
    {
      
    }, 
      ], 
  "CHM101-E1": [
    {
      
    }, 
      ], 
  "CHM101-E2": [
    {
      
    }, 
      ], 
  "ZOO101-E2": [
    
  {
    text: "How does hemolymph circulation in the arthropod hemocoel MOST accurately occur?",
    options: [
      "Through a network of branching vessels that directly deliver nutrients to tissues.",
      "Primarily driven by diffusion, with the heart playing a minor role in mixing.",
      "Circulation is driven by the heart and assisted by body movements, bathing organs directly.",
      "Via specialized cells within the hemolymph that actively transport nutrients."
    ],
    correct: 2,
    explanation:
      "Hemolymph circulation is driven by a heart that pumps hemolymph through vessels, but ultimately empties into the hemocoel, bathing the organs directly. Body movements assist in circulation."
  },
  {
    text: "What is the MOST distinctive anatomical feature that defines Chelicerata?",
    options: [
      "The presence of mandibles adapted for chewing plant matter.",
      "The presence of antennae used for sensing chemical cues in the environment.",
      "The presence of chelicerae, which are modified appendages near the mouth used for grasping or piercing.",
      "The presence of a cephalothorax and abdomen, connected by a narrow pedicel."
    ],
    correct: 2,
    explanation:
      "The presence of chelicerae, modified appendages near the mouth, is a defining feature of Chelicerata. These are used for grasping or piercing prey."
  },
  {
    text: "Which characteristic is ALWAYS present in Arachnids and serves to distinguish them from other Chelicerates?",
    options: [
      "Silk production for web building or egg protection.",
      "Four pairs of walking legs attached to the cephalothorax.",
      "The presence of book lungs for gas exchange in terrestrial environments.",
      "A segmented abdomen clearly demarcated from the cephalothorax."
    ],
    correct: 1,
    explanation:
      "Arachnids have four pairs of legs attached to the cephalothorax which distinguishes them. While silk, book lungs, and segmented abdomens are not always present."
  },
  {
    text: "Which sensory modality is MOST reliant on the pedipalps in arachnids?",
    options: [
      "Vision, by detecting light intensity and polarization.",
      "Chemoreception, detecting airborne pheromones for mate location.",
      "Mechanoreception, sensing vibrations and air currents for prey detection.",
      "Proprioception, providing information about body position and movement."
    ],
    correct: 2,
    explanation:
      "Arachnids rely mostly on mechanoreception through pedipalps, allowing them to sense vibrations and air currents for prey detection."
  },
  {
    text: "What is a defining characteristic of the Merostomata (horseshoe crabs) that reflects their ancient lineage?",
    options: [
      "The ability to regenerate lost limbs through epimorphic regeneration.",
      "The presence of both compound and simple eyes for vision.",
      "The use of book gills for gas exchange, located on the abdomen.",
      "Their complex social behavior characterized by cooperative breeding."
    ],
    correct: 2,
    explanation:
      "Merostomata have book gills located on the abdomen, used for gas exchange. This is a characteristic which displays their ancient lineage."
  }, 
  {
    text: "What role do arthropods play in the carbon cycle?",
    options: [
      "Photosynthesis",
      "Decomposition and respiration",
      "Nitrogen fixation",
      "Chemosynthesis"
    ],
    correct: 1,
    explanation: "Arthropods play a significant role in the carbon cycle through decomposition of organic matter and respiration, releasing carbon dioxide back into the atmosphere."
  },
  {
    text: "What type of circulatory system is found in arthropods?",
    options: [
      "Closed circulatory system",
      "Open circulatory system",
      "Lymphatic system",
      "No circulatory system"
    ],
    correct: 1,
    explanation: "Arthropods have an open circulatory system, where hemolymph is not confined to vessels but circulates through a hemocoel, bathing the tissues and organs directly."
  },
  {
    text: "Which of the following best describes the structure of the arthropod brain?",
    options: [
      "A single, large ganglion",
      "A ventral nerve cord with segmental ganglia",
      "A cerebral ganglion with connectives to a ventral nerve cord",
      "A diffuse nerve net"
    ],
    correct: 2,
    explanation: "The arthropod brain consists of a cerebral ganglion (or ganglia) located in the head, connected to a ventral nerve cord with segmental ganglia running along the length of the body."
  },
  {
    text: "What are the primary excretory organs in insects?",
    options: ["Nephridia", "Green glands", "Malpighian tubules", "Kidneys"],
    correct: 2,
    explanation: "Insects primarily use Malpighian tubules for excretion. These tubules remove nitrogenous waste from the hemolymph and empty it into the hindgut."
  },
  {
    text: "Which of the following is NOT a type of sensory receptor found in arthropods?",
    options: [
      "Chemoreceptors",
      "Mechanoreceptors",
      "Photoreceptors",
      "Magnetoreceptors"
    ],
    correct: 3,
    explanation: "While arthropods possess chemoreceptors (for taste and smell), mechanoreceptors (for touch and pressure), and photoreceptors (for vision), they do not possess magnetoreceptors, for magnetic field detection, unlike some other animals."
  },
  {
    text: "How do arthropods detect gravity and orientation?",
    options: ["Ocelli", "Statocysts", "Ommatidia", "Setae"],
    correct: 1,
    explanation: "Arthropods use statocysts, which are sensory organs that contain statoliths (dense particles) to detect gravity and orientation."
  },
  {    text: "Which of the following groups is most closely related to the insects (Hexapoda)?",
    options: ["Crustacea", "Myriapoda", "Chelicerata", "All are equally related."],
    correct: 0,
    explanation: "While all are related, molecular data suggests Hexapoda is more closely related to Crustacea than the others."
  },
  {
    text: "Which of the following classes contains the largest number of described species?",
    options: ["Arachnida", "Crustacea", "Insecta", "Myriapoda"],
    correct: 2,
    explanation: "The class Insecta (insects) contains the largest number of described species, making up a significant portion of the Earth's biodiversity."
  },
  {
    text: "Which of the following subphyla includes organisms with biramous appendages?",
    options: ["Chelicerata", "Myriapoda", "Crustacea", "Hexapoda"],
    correct: 2,
    explanation: "Crustaceans are characterized by having biramous appendages, which are appendages that branch into two parts."
  },
  {
    text: "The extinct trilobites belong to which of the following groups?",
    options: [
      "A subphylum of Arthropoda",
      "A class of Annelida",
      "A phylum of Mollusca",
      "A class of Echinodermata"
    ],
    correct: 0,
    explanation: "Trilobites are an extinct group of marine arthropods that belong to a subphylum of Arthropoda."
  },
  {
    text: "Which subphylum is entirely terrestrial?",
    options: ["Crustacea", "Chelicerata", "Hexapoda", "Myriapoda"],
    correct: 1,
    explanation: "Chelicerata are entirely terrestrial, and insects are terrestrial. Note that some Chelicerata are also aquatic"
  }, 
  {
    text: "Which of the following is NOT a characteristic feature of insects?",
    options: ["Three body segments", "Six legs", "Eight legs", "Antennae"],
    correct: 2,
    explanation: "Insects are characterized by having three body segments (head, thorax, and abdomen), six legs, and antennae."
  },
  {
    text: "What is the function of the Malpighian tubules in insects?",
    options: ["Gas exchange", "Digestion", "Excretion", "Circulation"],
    correct: 2,
    explanation: "Malpighian tubules are excretory organs found in insects and other arthropods that function to remove nitrogenous waste from the hemolymph."
  },
  {
    text: "Which of the following best describes the process of incomplete metamorphosis (hemimetabolism) in insects?",
    options: [
      "Larva transforms directly into an adult.",
      "Egg hatches into a nymph that gradually develops into an adult.",
      "Egg hatches into a larva, which then forms a pupa before becoming an adult.",
      "Asexual reproduction"
    ],
    correct: 1,
    explanation: "Incomplete metamorphosis (hemimetabolism) is a developmental process in insects where the egg hatches into a nymph, which gradually develops into an adult through a series of molts."
  },
  {
    text: "Which of the following structures are used for gas exchange in terrestrial insects?",
    options: ["Gills", "Book lungs", "Tracheae", "Cutaneous respiration"],
    correct: 2,
    explanation: "Terrestrial insects use a tracheal system, which consists of a network of tubes that carry oxygen directly to the tissues from openings called spiracles along the body."
  },
  {
    text: "What is the function of the tympanal organs in some insects?",
    options: ["Taste", "Smell", "Hearing", "Vision"],
    correct: 2,
    explanation: "Tympanal organs are sensory structures found in some insects that function to detect sound vibrations."
  },
  {
    text: "Which of the following features supports the evolutionary relationship between annelids and arthropods?",
    options: [
      "Presence of a rigid exoskeleton",
      "Jointed appendages",
      "Segmented body plan",
      "Compound eyes"
    ],
    correct: 2,  "ZOO101-E2": [
    
  {
    text: "How does hemolymph circulation in the arthropod hemocoel MOST accurately occur?",
    options: [
      "Through a network of branching vessels that directly deliver nutrients to tissues.",
      "Primarily driven by diffusion, with the heart playing a minor role in mixing.",
      "Circulation is driven by the heart and assisted by body movements, bathing organs directly.",
      "Via specialized cells within the hemolymph that actively transport nutrients."
    ],
    correct: 2,
    explanation:
      "Hemolymph circulation is driven by a heart that pumps hemolymph through vessels, but ultimately empties into the hemocoel, bathing the organs directly. Body movements assist in circulation."
  },
  {
    text: "What is the MOST distinctive anatomical feature that defines Chelicerata?",
    options: [
      "The presence of mandibles adapted for chewing plant matter.",
      "The presence of antennae used for sensing chemical cues in the environment.",
      "The presence of chelicerae, which are modified appendages near the mouth used for grasping or piercing.",
      "The presence of a cephalothorax and abdomen, connected by a narrow pedicel."
    ],
    correct: 2,
    explanation:
      "The presence of chelicerae, modified appendages near the mouth, is a defining feature of Chelicerata. These are used for grasping or piercing prey."
  },
  {
    text: "Which characteristic is ALWAYS present in Arachnids and serves to distinguish them from other Chelicerates?",
    options: [
      "Silk production for web building or egg protection.",
      "Four pairs of walking legs attached to the cephalothorax.",
      "The presence of book lungs for gas exchange in terrestrial environments.",
      "A segmented abdomen clearly demarcated from the cephalothorax."
    ],
    correct: 1,
    explanation:
      "Arachnids have four pairs of legs attached to the cephalothorax which distinguishes them. While silk, book lungs, and segmented abdomens are not always present."
  },
  {
    text: "Which sensory modality is MOST reliant on the pedipalps in arachnids?",
    options: [
      "Vision, by detecting light intensity and polarization.",
      "Chemoreception, detecting airborne pheromones for mate location.",
      "Mechanoreception, sensing vibrations and air currents for prey detection.",
      "Proprioception, providing information about body position and movement."
    ],
    correct: 2,
    explanation:
      "Arachnids rely mostly on mechanoreception through pedipalps, allowing them to sense vibrations and air currents for prey detection."
  },
  {
    text: "What is a defining characteristic of the Merostomata (horseshoe crabs) that reflects their ancient lineage?",
    options: [
      "The ability to regenerate lost limbs through epimorphic regeneration.",
      "The presence of both compound and simple eyes for vision.",
      "The use of book gills for gas exchange, located on the abdomen.",
      "Their complex social behavior characterized by cooperative breeding."
    ],
    correct: 2,
    explanation:
      "Merostomata have book gills located on the abdomen, used for gas exchange. This is a characteristic which displays their ancient lineage."
  }, 
  {
    text: "What role do arthropods play in the carbon cycle?",
    options: [
      "Photosynthesis",
      "Decomposition and respiration",
      "Nitrogen fixation",
      "Chemosynthesis"
    ],
    correct: 1,
    explanation: "Arthropods play a significant role in the carbon cycle through decomposition of organic matter and respiration, releasing carbon dioxide back into the atmosphere."  },
  {
    text: "What type of circulatory system is found in arthropods?",
    options: [
      "Closed circulatory system",
      "Open circulatory system",
      "Lymphatic system",
      "No circulatory system"
    ],
    correct: 1,
    explanation: "Arthropods have an open circulatory system, where hemolymph is not confined to vessels but circulates through a hemocoel, bathing the tissues and organs directly."
  },
  {
    text: "Which of the following best describes the structure of the arthropod brain?",
    options: [
      "A single, large ganglion",
      "A ventral nerve cord with segmental ganglia",
      "A cerebral ganglion with connectives to a ventral nerve cord",
      "A diffuse nerve net"
    ],
    correct: 2,
    explanation: "The arthropod brain consists of a cerebral ganglion (or ganglia) located in the head, connected to a ventral nerve cord with segmental ganglia running along the length of the body."
  },
  {
    text: "What are the primary excretory organs in insects?",
    options: ["Nephridia", "Green glands", "Malpighian tubules", "Kidneys"],
    correct: 2,
    explanation: "Insects primarily use Malpighian tubules for excretion. These tubules remove nitrogenous waste from the hemolymph and empty it into the hindgut."
  },
  {
    text: "Which of the following is NOT a type of sensory receptor found in arthropods?",
    options: [
      "Chemoreceptors",
      "Mechanoreceptors",
      "Photoreceptors",
      "Magnetoreceptors"
    ],
    correct: 3,
    explanation: "While arthropods possess chemoreceptors (for taste and smell), mechanoreceptors (for touch and pressure), and photoreceptors (for vision), they do not possess magnetoreceptors, for magnetic field detection, unlike some other animals."
  },
  {
    text: "How do arthropods detect gravity and orientation?",
    options: ["Ocelli", "Statocysts", "Ommatidia", "Setae"],
    correct: 1,
    explanation: "Arthropods use statocysts, which are sensory organs that contain statoliths (dense particles) to detect gravity and orientation."
  },
  {    text: "Which of the following groups is most closely related to the insects (Hexapoda)?",
    options: ["Crustacea", "Myriapoda", "Chelicerata", "All are equally related."],
    correct: 0,
    explanation: "While all are related, molecular data suggests Hexapoda is more closely related to Crustacea than the others."
  },
  {
    text: "Which of the following classes contains the largest number of described species?",
    options: ["Arachnida", "Crustacea", "Insecta", "Myriapoda"],
    correct: 2,
    explanation: "The class Insecta (insects) contains the largest number of described species, making up a significant portion of the Earth's biodiversity."
  },
  {
    text: "Which of the following subphyla includes organisms with biramous appendages?",
    options: ["Chelicerata", "Myriapoda", "Crustacea", "Hexapoda"],
    correct: 2,
    explanation: "Crustaceans are characterized by having biramous appendages, which are appendages that branch into two parts."
  },
  {
    text: "The extinct trilobites belong to which of the following groups?",
    options: [
      "A subphylum of Arthropoda",
      "A class of Annelida",
      "A phylum of Mollusca",
      "A class of Echinodermata"
    ],
    correct: 0,
    explanation: "Trilobites are an extinct group of marine arthropods that belong to a subphylum of Arthropoda."
  },
  {
    text: "Which subphylum is entirely terrestrial?",
    options: ["Crustacea", "Chelicerata", "Hexapoda", "Myriapoda"],
    correct: 1,
    explanation: "Chelicerata are entirely terrestrial, and insects are terrestrial. Note that some Chelicerata are also aquatic"
  }, 
  {
    text: "Which of the following is NOT a characteristic feature of insects?",
    options: ["Three body segments", "Six legs", "Eight legs", "Antennae"],
    correct: 2,
    explanation: "Insects are characterized by having three body segments (head, thorax, and abdomen), six legs, and antennae."
  },
  {
    text: "What is the function of the Malpighian tubules in insects?",
    options: ["Gas exchange", "Digestion", "Excretion", "Circulation"],
    correct: 2,
    explanation: "Malpighian tubules are excretory organs found in insects and other arthropods that function to remove nitrogenous waste from the hemolymph."
  },
  {
    text: "Which of the following best describes the process of incomplete metamorphosis (hemimetabolism) in insects?",
    options: [
      "Larva transforms directly into an adult.",
      "Egg hatches into a nymph that gradually develops into an adult.",
      "Egg hatches into a larva, which then forms a pupa before becoming an adult.",
      "Asexual reproduction"
    ],
    correct: 1,
    explanation: "  {
    text: "What is the significance of the Cambrian explosion in the context of arthropod evolution?",
    options: [
      "Marks the extinction of trilobites.",
      "Represents a period of rapid arthropod diversification",
      "Represents the first appearance of insects.",
      "Marks the evolution of the exoskeleton."
    ],
    correct: 1,
    explanation: "The Cambrian explosion was a period of rapid diversification of life forms, including arthropods, leading to the evolution of a wide range of body plans and adaptations."
  },
  {
    text: "Which of the following is NOT a significant ecological role played by arthropods?",
    options: [
      "Pollination",
      "Decomposition",
      "Primary production in aquatic ecosystems",
      "Pest control"
    ],
    correct: 2,
    explanation: "Arthropods are important pollinators, decomposers, and pest control agents. Primary production in aquatic ecosystems is generally the domain of algae and other photosynthetic organisms, not arthropods."
  },
  {
    text: "Which of the following best describes the role of arthropods in the transmission of human diseases?",
    options: [
      "All arthropods are beneficial to human health.",
      "Arthropods can act as vectors, transmitting pathogens from one host to another.",
      "Arthropods play no role in the transmission of human diseases.",
      "Arthropods only transmit diseases to animals, not humans."
    ],
    correct: 1,
    explanation: "Arthropods can act as vectors, transmitting pathogens from one host to another, resulting in many diseases."
  }, 
  {
    text: "Which of the following is NOT a primary function of the arthropod exoskeleton?",
    options: [
      "Protection against predators",
      "Prevention of water loss",
      "Support for internal organs",
      "Facilitating gas exchange"
    ],
    correct: 3,
    explanation: "Arthropod exoskeletons primarily provide protection, prevent water loss, and support internal organs, but they are not directly involved in facilitating gas exchange, which occurs through gills, book lungs, or tracheal systems."
  },
  {
    text: "Ecdysis in arthropods is directly regulated by which hormone?",
    options: ["Insulin", "Ecdysone", "Juvenile hormone", "Thyroxine"],
    correct: 1,
    explanation: "Ecdysone is the steroid hormone that triggers molting (ecdysis) in arthropods. Juvenile hormone determines the type of molt."
  },
  {
    text: "Which of the following best explains the evolutionary success of arthropods?",
    options: [
      "Simple body plan and limited specialization",
      "Rapid reproduction and high mutation rate",
      "Versatile appendages and a chitinous exoskeleton",
      "Dependence on a single, stable food source"
    ],
    correct: 2,
    explanation: "The evolutionary success of arthropods is largely attributed to their versatile, jointed appendages and their protective and adaptable chitinous exoskeleton."
  },
  {
    text: "What is the primary component of the arthropod exoskeleton that provides rigidity?",
    options: ["Cellulose", "Keratin", "Chitin", "Pectin"],
    correct: 2,
    explanation: "Chitin is a complex polysaccharide that forms the primary structural component of the arthropod exoskeleton, providing rigidity and protection."
  },
  {
    text: "The hemocoel in arthropods serves primarily as a:",
    options: [
      "Site for gas exchange",
      "Hydrostatic skeleton",
      "Space for blood circulation",
      "Storage for digestive enzymes"
    ],
    correct: 2,
    explanation: "The hemocoel is the primary body cavity in arthropods and serves as a space for hemolymph (blood) circulation, directly bathing the tissues and organs."
  },
  {
    text: "Which of the following structures is unique to chelicerates?",
    options: ["Mandibles", "Antennae", "Chelicerae", "Maxillae"],
    correct: 2,
    explanation: "Chelicerae are specialized appendages located near the mouth of chelicerates (spiders, scorpions, horseshoe crabs, etc.) and are used for feeding and defense."
  },
  {    text: "Which of the following characteristics is NOT typically found in arachnids?",
    options: [
      "Book lungs",
      "Silk production",
      "Three body segments",
      "Eight legs"
    ],
    correct: 2,
    explanation: "Arachnids typically have two body segments (cephalothorax and abdomen), eight legs, book lungs for respiration, and silk glands for producing silk."
  },
  {
    text: "What is the function of the pedipalps in arachnids?",
    options: [
      "Locomotion",
      "Prey capture and sensory perception",
      "Silk production",
      "Gas exchange"
    ],
    correct: 1,
    explanation: "Pedipalps are appendages located near the chelicerae in arachnids and are used for prey capture, sensory perception, and, in some species, reproduction."
  },
  {
    text: "Which of the following is a unique feature of horseshoe crabs (Merostomata)?",
    options: [
      "Possession of mandibles",
      "Green glands for excretion",
      "Book gills for respiration",
      "Silk production"
    ],
    correct: 2,
    explanation: "Horseshoe crabs (Merostomata) are characterized by having book gills, which are specialized respiratory structures located on the abdomen."
  },
  {
    text: "Which of the following best describes the feeding strategy of most spiders?",
    options: ["Filter feeding", "Herbivory", "Predatory", "Parasitism"],
    correct: 2,
    explanation: "Most spiders are predatory, using chelicerae to inject venom and immobilize their prey before consuming it."
  },
  {
    text: "What is the key difference between centipedes (Chilopoda) and millipedes (Diplopoda)?",
    options: [
      "Centipedes are herbivores, while millipedes are carnivores.",
      "Centipedes have one pair of legs per segment, while millipedes have two pairs.",
      "Centipedes possess antennae, while millipedes lack them.",
      "Centipedes are aquatic, while millipedes are terrestrial."
    ],
    correct: 1,
    explanation: "Centipedes (Chilopoda) have one pair of legs per segment and are primarily carnivorous, while millipedes (Diplopoda) have two pairs of legs per apparent segment and are typically detritivores or herbivores."
  },
  {
    text: "Forcipules, venomous claws, are found in which class?",
    options: ["Diplopoda", "Insecta", "Chilopoda", "Arachnida"],
    correct: 2,
    explanation: "Forcipules, which are modified legs that function as venomous claws, are a characteristic feature of centipedes (Chilopoda) and are used to capture prey."
  },
  {
    text: "Which of the following is the primary diet of most millipedes?",
    options: [
      "Living insects",
      "Decaying organic matter",
      "Plant nectar",
      "Blood"
    ],
    correct: 1,
    explanation: "Most millipedes are detritivores, feeding on decaying organic matter such as leaf litter and wood."
  },
  {
    text: "What type of respiratory system is typically found in myriapods?",
    options: [
      "Gills",
      "Book lungs",
      "Tracheal system",
      "Cutaneous respiration"
    ],
    correct: 2,
    explanation: "Myriapods typically have a tracheal system, which consists of a network of tubes that carry oxygen directly to the tissues from openings called spiracles along the body."
  },
  {
    text: "Which class of myriapods exhibits aposematism (warning coloration) as a defense mechanism?",
    options: ["Symphyla", "Diplopoda", "Chilopoda", "Pauropoda"],
    correct: 1,
    explanation: "Many millipedes (Diplopoda) exhibit aposematism, using bright colors to warn potential predators of their toxicity or unpleasant taste."
  },
  {
    text: "Biramous appendages are a characteristic feature of which arthropod group?",
    options: ["Insecta", "Myriapoda", "Crustacea", "Arachnida"],
    correct: 2,
    explanation: "Crustaceans are characterized by having biramous appendages, which are appendages that branch into two parts."
  },
  {
    text: "What is the function of the green glands in crustaceans?",
    options: ["Gas exchange",
      "Osmoregulation and excretion",
      "Digestion",
      "Reproduction"
    ],
    correct: 1,
    explanation: "Green glands are excretory organs found in crustaceans that function to maintain osmotic balance and eliminate waste products."
  },
  {
    text: "Which of the following structures is used for feeding in barnacles?",
    options: ["Chelicerae", "Mandibles", "Cirri", "Pedipalps"],
    correct: 2,
    explanation: "Barnacles use cirri, which are feathery appendages, to filter feed by sweeping through the water to capture plankton and other small organisms."
  },
  {
    text: "Which crustacean group is characterized by a carapace that covers most of the body?",
    options: ["Copepoda", "Branchiopoda", "Malacostraca", "Ostracoda"],
    correct: 2,
    explanation: "Malacostraca, which includes crabs, lobsters, shrimp, and isopods, is characterized by a carapace that covers most of the cephalothorax."
  },
  {
    text: "Nauplius is a distinctive larval stage found in many members of which group?",
    options: ["Insecta", "Myriapoda", "Crustacea", "Arachnida"],
    correct: 2,
    explanation: "The nauplius larva is a characteristic larval stage of many crustaceans and has three pairs of appendages and a single median eye."
  }, 
 
      ], 
  "ZOO101-1": [
    
 {
        text: "What is a major factor causing the large size of the ovum compared to spermatozoa?",
        options: ["The amount of DNA.", "The large amount of cytoplasm.", "The thickness of the cell membrane.", "The amount of RNA."],
        correct: 1,
        explanation: "The ovum is significantly larger than a spermatozoon primarily because it contains a large amount of cytoplasm. This cytoplasm is packed with nutrients (yolk), organelles, and other substances necessary to support the early development of the embryo following fertilization. Spermatozoa, on the other hand, focus on motility and delivery of DNA, hence their smaller size."
    }, 
    {
        text: "If an animal lacks both tissues and organs, what can we infer about its complexity?",
        options: ["It can be at the protoplasmic level of organization", "It has a very complex organization", "It has a well-developed organ system", "It can be a unicellular organism"],
        correct: 3,
        explanation: "If an animal lacks tissues and organs, it implies a very simple level of organization. This is most characteristic of unicellular organisms, which are at the protoplasmic or cellular level, where all functions occur within a single cell and/or aggregations."
    },
    {
        text: "What is the implication of the fact that the oocyte is arrested in prophase I before puberty?",
        options: ["The oocyte will not mature until it is stimulated by hormonal signals", "The oocyte will mature only during oogenesis", "The oocyte has to perform its first mitotic division before reaching the tertiary stage", "The oocyte will not be able to perform its first meiotic division"],
         correct: 0,
        explanation: "The arrest of the oocyte in prophase I before puberty is a mechanism to ensure that the oocyte will only mature when the appropriate hormonal signals are present, triggering the subsequent stages of oogenesis and preparing the oocyte for potential fertilization."
    },
    {
        text: "Why is a single, large ovum, as opposed to multiple similar-sized cells, produced during oogenesis?",
        options: ["It enables more rapid cell division", "It makes meiosis more efficient", "It provides a larger nutrient reserve for the developing embryo", "It facilitates fertilization"],
         correct: 2,
        explanation: "Producing a single, large ovum during oogenesis ensures that the ovum has a large nutrient reserve (yolk). This is vital for the early development of the embryo after fertilization, providing the necessary resources before the embryo can acquire its own nutrients."
    },
    {
        text: "In what level of organization would a jellyfish be placed?",
        options: ["Protoplasmic", "Cellular", "Tissue grade", "Organ system"],
        correct: 2,
        explanation: "Jellyfish, being cnidarians, are characterized by a tissue grade of organization. They possess tissues, such as a nerve net, but lack complex organ systems."
    },
    {
        text: "If a species evolves to have more complex organ systems, what is likely to happen to its levels of organization?",
        options: ["It will revert back to tissue-grade level.", "It will lose the levels of organization that it previously possessed.", "It will increase in complexity within the organ-system level", "It will stop developing new levels of organization."],
        correct: 2,
       explanation: "Evolution towards more complex organ systems typically leads to an increase in complexity *within* the organ-system level, with more specialized and integrated organ systems forming to support the organism's functions."
    },
     {
        text: "Animals face similar challenges related to life functions. Does this imply that all animals use the same strategies to overcome these challenges?",
        options: ["Yes, the challenges are universal, so the solutions are identical.", "No, similar challenges do not mean similar strategies.", "There is no information on the strategies that animals use to overcome challenges.", "Similar challenges can be met with different body plans."],
        correct: 1,
        explanation: "While all animals face fundamental challenges like obtaining food and water, removing waste, and reproducing, they have evolved diverse strategies and body plans to overcome them. Similar challenges do not necessitate identical solutions."
    },
    {
        text: "Given that sponges are at the cellular level of organization, what is implied about the level of specialization of their cells?",
        options: ["Their cells are more specialized than most other animals.", "Their cells have no specialization.", "Their cells have some specialization, but are not organized into tissues.", "Their cells have limited specialization, therefore there is a need for tissues."],
        correct: 2,
        explanation: "Sponges at the cellular level have cells that are specialized to some degree, meaning different cells perform different functions. However, they don’t form coordinated tissues in the same way that more complex organisms do. Rather, their cells work independently or in loose aggregations."
    },
    {
        text: "If a species' organs become specialized for multiple functions, what implication does this have for its level of organization?",
        options: ["The level of organization will decrease", "The level of organization remains the same", "The level of organization is likely to remain at tissue-organ", "The level of organization is likely to remain at the organ-system level"],
       correct: 3,
        explanation: "If a species' organs become specialized for multiple functions, it suggests a high level of integration between organ systems. This would place the organism at an advanced organ-system level of organization."
    },
    {
        text: "What can be inferred about the relationship between increased complexity and the number of cell types in animals?",
        options: ["There is no relationship between these concepts", "Increased complexity decreases the number of cell types", "Increased complexity is accompanied by an increase in cell types", "Simple animals have more cell types than complex ones"],
        correct: 2,
         explanation: "Increased complexity in animals is strongly associated with a higher number of different cell types (more differentiation), each specialized for specific roles in tissues and organ systems. More complex organisms tend to have a greater variety of cell types working together."
    },
    {
       text: "What conclusion can be drawn about the complexity of animal body plans relative to their functions?",
        options: ["Complex body plans do not allow for complex functions", "More complex body plans do not mean more complex functions.", "Complex body plans are required to perform complex functions", "Animals with simpler body plans have more complex functions"],
        correct: 2,
        explanation: "The complexity of an animal's body plan directly relates to the functions it can perform. More complex tasks require more complex structures, as seen in the evolution of animal systems, indicating a strong correlation between body plan and functional complexity."
    }, 
   {
        text: "What changes occur as the follicle develops into the tertiary stage?",
        options: ["Decrease in the number of cells", "Fluid starts to accumulate", "Cells begin to breakdown", "Fluid disappears gradually"],
        correct: 1,
        explanation: "As the follicle develops into the tertiary stage, one of the significant changes is the accumulation of fluid within the follicle. This fluid forms a cavity called the antrum, characteristic of the tertiary follicle."
    },
   {
        text: "Which stage of the follicle contains an antrum (fluid-filled cavity)?",
        options: ["Primordial follicle", "Secondary follicle", "Tertiary follicle", "Graafian follicle"],
        correct: 2,
        explanation: "The antrum, a fluid-filled cavity, is a defining feature of the tertiary follicle. This cavity develops from the fluid secreted by the follicular cells and plays a role in follicle maturation."
    },
    {
        text: "What happens to the oocyte during the tertiary stage?",
        options: ["It breaks down and dies", "It increases significantly in size", "It is pushed to the edge of the follicle", "It is surrounded by the corona radiata"],
        correct: 2,
        explanation: "During the tertiary stage, as the antrum fills with fluid, the oocyte is pushed to the periphery of the follicle. This is an important step in preparation for ovulation, the process by which the oocyte is released."
    },
     {
        text: "What is another name for the Graafian follicle?",
        options: ["Primary follicle", "Secondary follicle", "Tertiary follicle", "Quartenary follicle"],
        correct: 3,
        explanation: "The Graafian follicle is the mature, pre-ovulatory follicle. It's essentially the final stage of follicular development after the tertiary follicle. It contains a fully mature oocyte and is ready for ovulation."
    },
    {
        text: "What is the immediate fate of the oocyte after ovulation?",
        options: ["It begins its second division immediately.", "It becomes a primary follicle.", "It completes its first meiotic division and produces two unequal cells", "It develops into an embryo"],
        correct: 2,
        explanation: "After ovulation, the oocyte completes its first meiotic division, resulting in two unequal cells: a larger secondary oocyte and a smaller polar body. This division is crucial for preparing the egg for potential fertilization."
    },
     {         text: "What two cells result from the oocyte's first meiotic division?",
        options: ["Two small polar bodies", "One large oocyte and one small polar body", "Two large ova", "One large ovum and one small secondary oocyte"],
        correct: 1,
        explanation: "The first meiotic division of the oocyte results in one large secondary oocyte, which will eventually become the ovum, and one small polar body. The polar body is a non-functional cell that is eventually degraded."
    },
    {
         text: "Which level of organization is characterized by specialized sub-cellular structures (organelles)?",
        options: ["Tissue level", "Protoplasmic level", "Cellular level", "Organ-system level"],
        correct: 1,
        explanation: "The protoplasmic level of organization, typical of unicellular organisms, is defined by the presence of specialized organelles within a single cell. These organelles perform vital functions essential for cell survival and activities."
    },
    {
       text: "Which is an example of cellular organization?",
       options: ["The nerve net of Cnidarians", "The alimentary canal of Homo sapiens", "Sponges and Volvox", "Platyhelminthes"],
       correct: 2,
       explanation: "Sponges and Volvox are examples of cellular-level organization. Their cells are not grouped into true tissues and organs, meaning their cells function primarily independently, although they may form loose aggregations."
    },
    {
         text: "Which level of organization is characterized by aggregations of morphologically and physiologically related cells?",
         options: ["Cellular level", "Protoplasmic level", "Tissue level", "Organ level"],
         correct: 2,
         explanation: "The tissue level of organization is characterized by groups of cells that are morphologically and physiologically similar working together to perform a specific function. This level is more complex than the cellular level where cells act more independently."
    },
   {
        text: "What is the relationship between meiosis and oogenesis?",
        options: ["Meiosis is a stage within oogenesis.", "Oogenesis causes meiosis to occur.", "Meiosis and oogenesis are unrelated.", "Meiosis prevents oogenesis."],
        correct: 0,
        explanation: "Meiosis is a vital part of oogenesis. Oogenesis involves several stages of cell division and differentiation, and meiosis is specifically responsible for reducing the chromosome number in the oocyte to half of its original state so that fertilization results in a normal diploid cell."
    },
    {
        text: "What is the order of follicle development in the ovary?",
        options: ["Tertiary, primordial, secondary, Graafian", "Primordial, tertiary, secondary, Graafian", "Primordial, secondary, tertiary, Graafian", "Graafian, secondary, primordial, tertiary"],
        correct: 2,
        explanation: "The order of follicle development is primordial, secondary, tertiary, and finally Graafian. The primordial follicle is the earliest stage, and the Graafian follicle is the mature, pre-ovulatory stage, with the secondary and tertiary follicles falling in between."
    },
    {
         text: "What is the specific function of the zona pellucida in oogenesis?",
        options: ["To protect the oocyte from external damage", "To provide nourishment to the growing follicle cells", "To facilitate cytoplasmic transfer to the oocyte", "To provide a route for sperm to reach the oocyte"],
        correct: 2,
         explanation: "The zona pellucida, an extracellular matrix surrounding the oocyte, contains proteins that are involved in sperm recognition and binding, thereby playing a key role in the fertilization process. It’s not related to cytoplasmic transfer."
     },
    {
        text: "If an animal's cells are organized into tissues, but it lacks distinct organs, which level of organization is it at?",
        options: ["Protoplasmic", "Cellular", "Tissue grade", "Organ-system level"],
        correct: 2,
        explanation: "An animal that has cells organized into tissues but lacks distinct organs is at the tissue grade level of organization. This level is more complex than a cellular organization, but not as complex as an organ or organ system level."
    },
    {
        text: "What is the immediate outcome of meiosis I during oogenesis?",
       options: ["Two identical primary oocytes", "Two unequal cells, one large oocyte and one polar body", "Four spermatids", "A single mature ovum"],
        correct: 1,
        explanation: "Meiosis I in oogenesis results in two unequal cells: a large secondary oocyte (which is destined to become the ovum after meiosis II and fertilization) and a small polar body (which is generally non-functional). This unequal division ensures that the ovum retains most of the cytoplasm."
    },
    {
         text: "How is the fluid accumulation in the tertiary follicle related to the oocyte's position?",
        options: ["It makes the oocyte to burst out of the follicle", "It pushes the oocyte to the periphery of the follicle", "It has no effect on the oocyte's position", "It pushes the oocyte into the center of the follicle"],
       correct: 1,
        explanation: "The fluid accumulation in the antrum of the tertiary follicle causes the oocyte and the surrounding granulosa cells to be pushed to one side of the follicle, which is a necessary positioning for ovulation. The oocyte does not burst out of the follicle until ovulation."
    },
     {
         text: "What is the primary purpose of the levels of organization in animals?",
       options: ["To allow for more simple forms of organization", "To decrease the efficiency of bodily functions", "To allow for the performance of increasingly complex tasks", "To create variety in different animals"],
         correct: 2,
        explanation: "The primary purpose of increasing levels of organization in animals, from the protoplasmic to the organ-system level, is to enable the performance of more complex and efficient bodily functions, including movement, digestion, and reproduction. Complexity arises from increased specialization of tissues and organs."
    },
     {
        text: "An animal is composed of aggregations of cells. If this animal cannot produce specialized tissues, what level of organization does it represent?",
        options: ["Tissue grade", "Organ level", "Cellular level", "Protoplasmic level"],
       correct: 2,
        explanation: "If an animal is composed of aggregations of cells that are not specialized into tissues, it represents a cellular level of organization. Animals like sponges fit this category, their cells function mostly independently and do not form true tissues."
   }, 
    {
        text: "What is a fundamental challenge faced by all animals?",
        options: ["Developing complex skeletal structures", "Maintaining a constant body temperature", "Obtaining food, oxygen, water, and removing waste", "Developing camouflage mechanisms"],
        correct: 2,
        explanation: "All animals, regardless of their complexity, must acquire essential resources like food, oxygen, and water and effectively remove waste products to survive. These basic metabolic processes are crucial for life."
    },
    {
        text: "Which of the following is NOT a key aspect on which animal body plans differ?",
        options: ["Body symmetry", "Number of body cavities", "Level of consciousness", "Graded organization"],
        correct: 2,
        explanation: "While body symmetry, the presence of body cavities, and the graded organization of complexity are fundamental aspects used to classify and differentiate animal body plans, the 'level of consciousness' is a subjective and complex trait, not a primary structural feature of body plan classification."
    },
    {
        text: "How many major levels of body complexity are recognized in animals?",
        options: ["Three", "Four", "Five", "Six"],
         correct: 2,
        explanation: "There are five recognized levels of body complexity in animals: protoplasmic, cellular, tissue grade, tissue-organ grade, and organ system grade. These levels reflect an increasing degree of structural and functional organization."
     },
    {
        text: "What is the defining characteristic of the protoplasmic level of organization?",
        options: ["Cells are grouped into tissues.", "All life functions are performed within a single cell.", "Multiple cells work together.", "The organism has specialized organs."],
        correct: 1,
        explanation: "The protoplasmic level of organization, characteristic of single-celled organisms, features all life functions, such as nutrition, respiration, and waste removal, occurring within a single cell's cytoplasm and organelles."
    },
    {
        text: "Which of the following best describes 'organelles' in the context of the protoplasmic level?",
        options: ["Simple cell structures", "Specialized structures within a cell", "Structures that form tissues", "Organs of the organism"],
        correct: 1,
       explanation: "Organelles are specialized structures within a cell, such as mitochondria and ribosomes, that carry out specific functions necessary for the cell's survival, growth, and reproduction at the protoplasmic level."
    },
     {
        text: "Metazoans are synonymous with what type of animals?",
        options: ["Protoplasmic animals", "Unicellular animals", "Multicellular animals", "Organ-system level animals"],
        correct: 2,
        explanation: "The term 'metazoan' refers to all multicellular animals. This contrasts with unicellular organisms, like protozoans, that exhibit a protoplasmic level of organization."
    },
    {
        text: "What is characteristic of primitive metazoans like Volvox and Sponges?",
        options: ["They have specialized tissues and organs", "They are well organized to carry out complex collective functions", "Their cells function together to form specialized organs", "They exhibit aggregations of cells that are not closely associated for collective function."],
        correct: 3,
        explanation: "Primitive metazoans like Volvox and sponges demonstrate a cellular level of organization. Their cells are aggregated, but they are not as interdependent or organized into specialized tissues and organs as more complex animals."
    },
    {
        text: "Which level of organization do tissues represent?",
        options: ["Protoplasmic", "Cellular", "Tissue grade", "Organ system"],
        correct: 2,
         explanation: "Tissues represent the 'tissue grade' level of organization. In this level, cells with similar structures and functions are grouped together to perform a specific function, which is more complex than simply individual cells functioning separately."
    },
    {
        text: "What kind of animals have a 'nerve net' as an example of the tissue-grade level of organization?",
        options: ["Sponges", "Platyhelminthes", "Cnidarians", "Humans"],
       correct: 2,
       explanation: "Cnidarians, such as jellyfish and hydra, possess a 'nerve net,' a diffuse network of nerve cells that helps coordinate responses to stimuli but does not form a centralized nervous system, representing a tissue-grade level of organization."
    },
    {
        text: "Which animals are considered to be at the tissue-organ grade of organization?",
         options: ["Volvox", "Cnidarians", "Platyhelminthes", "Sponges"],
        correct: 2,
         explanation: "Platyhelminthes, such as flatworms, display the tissue-organ grade of organization. They have tissues organized into simple organs such as a digestive cavity, but not all organ systems are fully formed, distinguishing them from the more complex organ system grade."
    },
    {
        text: "What is the highest level of organization mentioned?",
        options: ["Tissue", "Organ", "Organ system", "Cellular"],
        correct: 2,
         explanation: "The organ system level represents the highest degree of organization, where multiple organs work together to carry out complex functions.  This is more complex than individual tissues or organs working in isolation."
    },
    {
       text: "Which example is used to exemplify the organ system?",
        options: ["The nerve net of Cnidarians", "The alimentary canal of Homo sapiens", "The aggregation of cells in Volvox", "The specialised cells of Platyhelminthes"],
        correct: 1,
        explanation: "The alimentary canal (digestive system) of *Homo sapiens* is a good example of an organ system because it consists of multiple organs (mouth, stomach, intestines, etc.) working together to perform the complex task of digesting food and absorbing nutrients."
   },
    {
        text: "What process is responsible for the production of eggs?",
         options: ["Spermatogenesis", "Oogenesis", "Fertilization", "Embryogenesis"],
         correct: 1,
         explanation: "Oogenesis is the specific process of female gamete (egg) production. Spermatogenesis is the equivalent process for sperm production in males. Fertilization is the union of gametes, and embryogenesis refers to the development of the embryo."
    },
    {
         text: "When does the development of ovaries begin in females?",
         options: ["At puberty", "At the time of birth", "Early in fetal life", "During the menstrual cycle"],
         correct: 2,
         explanation: "The development of ovaries and the process of oogenesis starts very early in fetal life. Primordial follicles begin to form, and primary oocytes are produced before birth, demonstrating how early the reproductive system begins developing."
    },
    {
        text: "What stage is the primary oocyte arrested in until puberty?",
        options: ["Mitosis", "Meiosis II", "Metaphase II", "Meiosis I"],
        correct: 3,
        explanation: "Primary oocytes are arrested in prophase I of meiosis I until puberty. This pause ensures that the oocytes remain in a stable state until hormonal cues trigger further development during the female's reproductive years."
    },
    {
         text: "What causes primordial follicles to resume their mitotic division at puberty?",
         options: ["Increased estrogen levels", "Decreased progesterone levels", "Hormonal influences", "Changes in body temperature"],
         correct: 2,
         explanation: "At puberty, hormonal changes, including increased levels of follicle-stimulating hormone (FSH) and luteinizing hormone (LH), trigger the resumption of oocyte development. These hormonal influences are crucial for the maturation of the female reproductive system."
    },
    {
        text: "What is the name of the structure formed as a result of the mitotic division of follicular cells?",
        options: ["Primary follicle", "Secondary follicle", "Tertiary follicle", "Graafian follicle"],
        correct: 1,
         explanation: "As follicular cells around the oocyte divide mitotically, they form a multi-layered structure called the secondary follicle. This follicle development occurs after the primordial follicle stage and is an important step in oocyte maturation."
    },
   {
        text: "What is the name of the amorphous substance between the follicular cells and the oocyte?",
        options: ["Corona Radiata", "Zona Pellucida", "Tertiary fluid", "Granulosa"],
        correct: 1,
        explanation: "The zona pellucida is a thick, translucent extracellular matrix that surrounds the oocyte. It plays a vital role in sperm binding during fertilization and is situated between the oocyte and surrounding follicular cells."
    },
    {
         text: "What is the layer of cells around the zona pellucida called?",
         options: ["Primordial follicle", "Corona radiata", "Secondary oocyte", "Tertiary follicle"],
        correct: 1,
        explanation: "The corona radiata is a layer of granulosa cells that surrounds the zona pellucida. These cells provide nourishment to the oocyte, and they are an important structure for the oocyte's journey through the oviduct."
    }, 
  {
        text: "What is the fate of the second cell resulting from the first meiotic division during oogenesis?",
        options: ["It becomes a secondary oocyte.", "It develops into a polar body.", "It is immediately fertilized.", "It forms a zygote."],
        correct: 1,
        explanation: "The first meiotic division during oogenesis results in two cells: a larger secondary oocyte and a smaller cell called the first polar body. The polar body is a non-functional cell that is eventually degraded."
    },
    {
        text: "What characterizes a polar body?",
        options: ["A large amount of cytoplasm.", "The ability to become a new egg cell.", "No cytoplasm.", "The ability to develop into a new embryo."],
        correct: 2,
        explanation: "A polar body is characterized by having very little cytoplasm compared to the oocyte. It essentially serves as a means to discard extra chromosomes, ensuring the oocyte has the correct number of chromosomes for fertilization."
    },
    {
        text: "Where is the polar body located in relation to the oocyte after the first meiotic division?",
        options: ["Inside the oocyte.", "Lying between the oocyte and zona pellucida", "Attached to the outside of the oocyte", "Embedded in the cumulus oophorus"],
        correct: 1,
        explanation: "After the first meiotic division, the polar body is found lying between the oocyte and the zona pellucida. It's a small, non-functional cell that does not participate directly in fertilization or development."
    },
   {
        text: "What structures are released during ovulation?",
        options: ["Only the oocyte.", "Only the oocyte and the polar body", "The oocyte, corona radiata, and cumulus oophorus.", "The oocyte, zona pellucida and the polar body."],
        correct: 2,
        explanation: "During ovulation, the oocyte is released from the ovary along with the surrounding corona radiata (layer of cells) and the cumulus oophorus (the cloud of follicular cells), forming a complex that will be captured by the fimbriae of the fallopian tube. The zona pellucida remains closely associated with the oocyte."
    },
   {
        text: "What is the name given to the cloud of follicular cells that surrounds the oocyte during ovulation?",
        options: ["Corona radiata", "Zona pellucida", "Polar body", "Cumulus oophorus"],
        correct: 3,
        explanation: "The cumulus oophorus is the mass of follicular cells that surrounds the oocyte and the corona radiata at the time of ovulation, playing a role in guiding the oocyte into the fallopian tube."
    },
   {
        text: "At which stage of meiosis is the oocyte arrested following ovulation?",
         options: ["Metaphase I", "Prophase II", "Metaphase II", "Anaphase II"],
        correct: 2,
        explanation: "Following ovulation, the oocyte is arrested at Metaphase II of meiosis. This means it is still undergoing division but is paused until fertilization, where the second meiotic division is completed."
    },
   {
        text: "What triggers the completion of the second meiotic division of the oocyte?",
        options: ["Ovulation", "Fertilization", "Entry into the uterus", "Contact with a polar body"],
        correct: 1,
        explanation: "The second meiotic division of the oocyte is completed *only* after fertilization occurs. This is when the sperm penetrates the oocyte, triggering the oocyte to finish meiosis II and become a mature ovum."
    },
    {
         text: "What type of cell division is characteristic of cleavage?",
         options: ["Meiosis", "Mitosis", "Amitosis", "Binary fission"],
        correct: 1,
        explanation: "Cleavage is characterized by a series of rapid mitotic divisions. Unlike meiosis, mitosis during cleavage produces identical copies of the zygote's cells, increasing the number of cells without increasing the overall size of the embryo."
    },
    {
        text: "What is the primary outcome of cleavage?",
        options: ["An increase in cell size.", "The formation of specialized cells.", "The rapid increase in cell number.", "The development of the zygote into an embryo."],
       correct: 2,
        explanation: "The primary outcome of cleavage is a rapid increase in cell number. These numerous smaller cells are called blastomeres and result from a series of quick mitotic divisions without significant cell growth."
    },
    {
        text: "What is holoblastic cleavage characterized by?",
        options: ["Incomplete cleavage furrows.", "Complete cell division in each cleavage.", "Cells with unequal size.", "Limited cytoplasmic division"],
        correct: 1,
        explanation: "Holoblastic cleavage is characterized by complete cell division at each cleavage. This occurs in eggs with relatively little yolk and results in each cleavage furrow passing entirely through the zygote."
    },
    {
        text: "What is meroblastic cleavage characterized by?",
        options: ["Complete cell division in each cleavage.", "Partial or incomplete cleavage furrows.", "Cells with equal size.", "Cytoplasmic division of the whole egg."],
        correct: 1,
       explanation: "Meroblastic cleavage is characterized by incomplete cleavage furrows. The large amount of yolk inhibits the complete division of the cell, so only parts of the cytoplasm are divided. This is typically seen in eggs with lots of yolk."
   },
    {
        text: "In the context of development, what is a blastula?",
        options: ["A single-celled zygote.", "A structure with a fluid-filled cavity (blastocoel) and surrounding cells", "The primary germ layer of the embryo.", "A mass of yolk cells."],
        correct: 1,
        explanation: "In early development, a blastula is a hollow sphere or ball of cells surrounding a fluid-filled cavity called the blastocoel. It develops after cleavage of the zygote, and forms the stage preceding gastrulation."
    },
    {
        text: "What structure is formed after the cleavage stage in early development?",
        options: ["Zygote", "Gastrula", "Blastula", "Morula"],
        correct: 2,
        explanation: "Following the cleavage stage, the structure formed is the blastula. Cleavage divides the zygote into many smaller cells, which then form the blastula stage."
    },
   {
        text: "What is the fluid-filled cavity within the blastula called?",
        options: ["Archenteron", "Blastopore", "Blastocoel", "Yolk sac"],
        correct: 2,
        explanation: "The blastocoel is the fluid-filled cavity inside the blastula. It plays an important role in the early stages of development before gastrulation."
    },
     {
        text: "What event occurs after the blastula stage?",
        options: ["Cleavage", "Gastrulation", "Fertilization", "Ovulation"],
        correct: 1,
        explanation: "After the blastula stage in early embryonic development, gastrulation occurs. During gastrulation, the three germ layers (ectoderm, mesoderm, and endoderm) are formed, setting the stage for organogenesis."
    },
    {
        text: "What is meant by radial cleavage?",
        options: ["Cleavage that occurs in a spiral pattern.", "Cleavage where divisions occur parallel and perpendicular to the original axis.", "Cleavage that results in unequal-sized cells.", "Cleavage only in deuterostomes."],
        correct: 1,
       explanation: "Radial cleavage is characterized by divisions that occur in parallel and perpendicular planes to the original axis of the egg, forming cells directly on top of each other. This differs from spiral cleavage in which cells are offset from one another."
    },
    {
        text: "What type of animal exhibits radial cleavage during development?",
       options: ["Protostomes", "Echinoderms", "Molluscs", "Annelids"],
        correct: 1,
       explanation: "Radial cleavage is commonly observed during the development of deuterostomes, such as echinoderms (starfish, sea urchins). It is a characteristic feature that distinguishes them from protostomes."
    },
    {
       text: "How does cell removal during early radial cleavage affect development?",
        options: ["It always prevents normal development.", "It prevents normal development in all organisms.", "It can prevent normal development in determinate species, but not in non-determinate species.", "It promotes normal development in determinate species."],
        correct: 2,
       explanation: "Cell removal in early development can have different effects depending on whether the organism's cells are determinate (fate is fixed) or indeterminate (fate is flexible). In determinate species, cell removal usually prevents normal development, whereas in indeterminate species, the remaining cells can compensate."
    },
    {
        text: "What is a characteristic of cell division during radial cleavage?",
        options: ["It always yields cells of unequal size.", "It always yields cells of the same size.", "It can yield cells of unequal or the same size.", "It only happens during gastrulation."],
        correct: 2,
        explanation: "Cell division during radial cleavage can result in cells of equal or unequal size, depending on the specific organism and its egg's yolk distribution. Cleavage in general occurs before gastrulation, so it does not happen only during gastrulation."
    }, 
    {
        text: "What is the role of the yolk within the ovum?",
        options: ["It protects the genetic material", "It serves as a source of nutrition for the developing embryo", "It facilitates fertilization", "It provides the oocyte with cell signaling molecules."],
         correct: 1,
        explanation: "The primary role of the yolk in the ovum is to provide nutrients for the developing embryo. These nutrients support the early growth and development of the embryo before it can obtain nourishment on its own."
    },
    {
        text: "What is meant by the term 'telolecithal' in relation to eggs?",
         options: ["Eggs with a small amount of yolk.", "Eggs with an evenly distributed yolk.", "Eggs with the yolk concentrated at one pole.", "Eggs lacking a yolk."],
        correct: 2,
         explanation: "Telolecithal eggs are characterized by a concentration of yolk at one pole, known as the vegetal pole. This distribution of yolk has a profound influence on cleavage patterns during early development."
    },
    {
        text: "Which part of a telolecithal egg is characterized by the nucleus and relatively less yolk?",
         options: ["Vegetal pole", "Animal pole", "Blastocoel", "Blastopore"],
         correct: 1,
        explanation: "The animal pole of a telolecithal egg contains the nucleus and has relatively less yolk compared to the vegetal pole. It’s the site where cell division typically begins during cleavage."
    },
    {
        text: "Which part of a telolecithal egg has a larger concentration of yolk?",
        options: ["Animal pole", "Vegetal pole", "Blastocoel", "Cumulus oophorus"],
        correct: 1,
        explanation: "The vegetal pole of a telolecithal egg has a larger concentration of yolk. The yolk serves as a nutrient source for the developing embryo, and its distribution affects cell size and cleavage."
    },
    {
        text: "What type of cleavage is characteristic of a moderately telolecithal egg like that of a frog?",
        options: ["Meroblastic", "Holoblastic", "Radial", "Spiral"],
        correct: 1,
         explanation: "Moderately telolecithal eggs, like those of frogs, undergo holoblastic cleavage. Though there’s yolk concentrated in the vegetal pole, cleavage is still complete in each cell division. However, these cells tend to be unequal in size as the vegetal cells divide slower due to the yolk."
    },
    {

         text: "What type of cleavage is associated with heavy telolecithal eggs of fish, reptiles, and birds?",
        options: ["Holoblastic", "Microlecithal", "Meroblastic", "Radial"],
        correct: 2,
        explanation: "Heavy telolecithal eggs, such as those of fish, reptiles, and birds, exhibit meroblastic cleavage. The large amount of yolk impedes cell division and only a partial division of the cytoplasm takes place."
    },
    {
        text: "What characterizes a microlecithal egg?",
        options: ["A large amount of yolk evenly distributed", "A very small amount of yolk.", "A very large amount of yolk confined to one pole.", "A moderate amount of yolk confined to one pole."],
        correct: 1,
        explanation: "A microlecithal egg is characterized by a very small amount of yolk. These eggs rely on placental nutrition for development, and their cells divide equally during cleavage."
    },
    {
        text: "Which is an example of an animal with microlecithal eggs?",
        options: ["A bird", "A fish", "A reptile", "A eutherian mammal"],
        correct: 3,
         explanation: "Eutherian mammals (placental mammals) are an example of animals that have microlecithal eggs. Their eggs have very little yolk and rely on the placenta for nutrient supply during development."
    },
    {
        text: "What is the impact of uneven yolk distribution on the cleavage pattern?",
        options: ["It makes cleavage faster", "It has no impact", "It causes cleavage to be uniform", "It causes cleavage to be unequal"],
         correct: 3,
        explanation: "Uneven yolk distribution, such as in telolecithal eggs, can lead to unequal cleavage. This means that the cells in different parts of the egg will divide at different rates and end up with different sizes."
    },
    {
       text: "What structure results from the repeated division of a fertilized egg in microlecithal eggs?",
       options: ["Morula", "Blastodisc", "Blastula", "Gastrula"],
       correct: 1,
        explanation: "In microlecithal eggs, the repeated divisions form a structure called the blastodisc (a flat disk of cells), rather than the blastula stage found in eggs with more yolk. The yolk has a minimal effect on cleavage, leading to a blastodisc."
    },
     {
        text: "In eggs with a large amount of yolk, where is the cytoplasmic blastodisc usually located?",
        options: ["In the center of the yolk.", "In the vegetal pole.", "In a small cap at the animal pole.", "In the blastocoel."],
        correct: 2,
        explanation: "In eggs with a large amount of yolk, such as in birds and reptiles, the blastodisc is typically located in a small cap at the animal pole. The large yolk mass limits the cytoplasm to this region where the blastodisc forms."
         },  
  ],

    "PHYS-1": [
{
  text: "An arrow is shot straight up in the air at an initial speed of 15.0 m/s. After how much time is the arrow heading downward at a speed of 8.00 m/s?",
  options: ["0.714 s", "1.24 s", "1.87 s", "2.35 s", "3.22 s"],
  correct: 3,
  explanation: "The arrow's velocity changes due to gravity. First, calculate the time to reach the peak (v=0) using v=vₒ+at, giving t=1.53s. Then time to reach 8.0m/s downwards by v=vₒ+at, resulting in t₂=0.816. Total time is t₁+t₂, where 1.53+0.816= 2.35s."
},
{
  text: "One drop of oil falls straight down onto the road from the engine of a moving car every 5 s. With maximum length of 600m. What is the average speed of the car over this section of its motion?",
  options: ["20 m/s", "24 m/s", "30 m/s", "100 m/s", "120 m/s"],
  correct: 1,
   explanation: "Average speed is calculated by dividing the total distance traveled by the total time taken. Given that the drops are 600m apart over 5 seconds each and there are 3 such gaps, therefore total distance is 600m. And the total time is 600 / 25 = 24 m/s."
},
{
  text: "When applying the equations of kinematics for an object moving in one dimension, which of the following statements must be true?",
  options: ["The velocity of the object must remain constant.", "The acceleration of the object must remain constant.", "The velocity of the object must increase with time.", "The position of the object must increase with time.", "The velocity of the object must always be in the same direction as its acceleration."],
  correct: 1,
  explanation: "Kinematic equations apply when acceleration is constant. Velocity and position can change, and velocity and acceleration are not always in the same direction. Therefore, the acceleration of the object must remain constant."
},
{
  text: "A juggler throws a bowling pin straight up in the air. After the pin leaves his hand and while it is in the air, which statement is true?",
  options: ["The velocity of the pin is always in the same direction as its acceleration.", "The velocity of the pin is never in the same direction as its acceleration.", "The acceleration of the pin is zero.", "The velocity of the pin is opposite its acceleration on the way up.", "The velocity of the pin is in the same direction as its acceleration on the way up."],
   correct: 3,
  explanation: "The acceleration of the pin is due to gravity, which always acts downward. While the pin is going up, its velocity is upward, hence velocity and acceleration are opposite. When going down the velocity is downwards therefore it is aligned with acceleration."
},
{
   text: "A racing car starts from rest and reaches a final speed v in a time t. If the acceleration of the car is constant during this time, which of the following statements must be true?",
   options: ["The car travels a distance vt.", "The average speed of the car is vt/2.", "The acceleration of the car is v/t.", "The velocity of the car remains constant.", "None of these."],
   correct: 2,
   explanation: "With constant acceleration, the acceleration is defined as the change in velocity over time. Since the car starts from rest (vi=0) to final speed v (vf=v) over time (t), then a= (vf - vi)/ t which gives v/t. Therefore, the correct option is that the acceleration of the car is v/t."
},
{
  text: "When the pilot reverses the propeller in a boat moving north, the boat moves with an acceleration directed south. Assume the acceleration of the boat remains constant in magnitude and direction. What happens to the boat?",
  options: ["It eventually stops and remains stopped.", "It eventually stops and then speeds up in the northward direction.", "It eventually stops and then speeds up in the southward direction.", "It never stops but loses speed more and more slowly forever.", "It never stops but continues to speed up in the northward direction."],
   correct: 2,
  explanation: "With acceleration in the opposite direction to velocity, the boat will initially slow down until it stops momentarily, the continue to accelerate back the other way until it moves in the south direction, which is the direction of acceleration."
},
{
  text: "An object moves along the x-axis, its position measured at each instant of time. The data are organized into an accurate graph of x vs. t. Which of the following quantities cannot be obtained from this graph?",
  options: ["the velocity at any instant", "the acceleration at any instant", "the displacement during some time interval", "the average velocity during some time interval", "the speed of the particle at any instant"],
  correct: 1,
  explanation: "A position-time graph shows the object's position at each instant. The slope of the graph at any point gives the velocity at that instant. However, the acceleration requires a change in velocity, meaning that you need a velocity time graph. Therefore, from the x-t graph, the acceleration at any instant cannot be directly obtained."
},
{
  text: "A skateboarder starts from rest and moves down a hill with constant acceleration in a straight line, traveling for 6 s. In a second trial, he starts from rest and moves along the same straight line with the same acceleration for only 2 s. How does his displacement from his starting point in this second trial compare with the first trial?",
  options: ["one-third as large", "three times larger", "one-ninth as large", "nine times larger", "1/√3 times as large"],
  correct: 2,
  explanation: "Displacement in constant acceleration is given by x = 1/2at². In the first trial, it's proportional to 6²=36. The second, it's proportional to 2²=4. The ratio of second trial to the first trial is 4/36 = 1/9, therefore second trial is 1/9 as large as the first trial."
},
{
  text: "Races are timed to an accuracy of 1/1,000 of a second. What distance could a person in-line skating at a speed of 8.5 m/s travel in that period of time?",
  options: ["85 m", "85 cm", "8.5 m", "8.5 mm", "8.5 km"],
  correct: 2,
  explanation: "The time of travel is 1/1000 of a second (0.001 s). Using the formula distance = speed x time. distance= 8.5m/s ×0.001s = 0.0085m which is 8.5mm. If you use 1/100 which is 0.01s then the distance would be 0.085m which is 8.5 cm. And if you use 1/10 of a second the time of travel would be 0.1s and the distance is 0.85m. If you use a whole second the distance would be 8.5m."
}, 
    {
        text: "A student at the top of a building throws a red ball upward with speed v₀ and then throws a blue ball downward with the same initial speed v₀. Immediately before the two balls reach the ground, which of the following statements are true? (Choose all correct statements; neglect air friction.)",
        options: [
            "The speed of the red ball is less than that of the blue ball.",
            "The speed of the red ball is greater than that of the blue ball.",
            "Their velocities are equal.",
            "The speed of each ball is lesser than v₀.",
            "The acceleration of the blue ball is greater than that of the red ball."
        ],
        correct: 2,
        explanation: "Both balls experience the same acceleration due to gravity. The red ball initially goes up, stops momentarily, and then accelerates downwards. Since they have the same initial speed, by the time they reach the ground, their speeds would be the same (ignoring air resistance). However, since one is coming down, the other up, their velocities (which is speed with direction) are opposite, therefore, they are not equal."
    },
    {
        text: "A ball is thrown downward from the top of a 40.0 m tower with an initial speed of 12 m/s. Assuming negligible air resistance, what is the speed of the ball just before hitting the ground?",
        options: [
            "28 m/s",
            "30 m/s",
            "56 m/s",
            "784 m/s",
            "More information is needed."
        ],
        correct: 1,
        explanation: "We use the equation vf² = vi² + 2ad, where vf is the final speed, vi is initial speed (12 m/s), a is acceleration due to gravity (9.8 m/s²), and d is the distance (40 m).  So, vf² = 12² + 2 * 9.8 * 40 = 144 + 784 = 928. Taking the square root, vf = √928 ≈ 30.46 m/s, which rounds to 30 m/s."
    },
    {
        text: "A ball is thrown straight up in the air. For which situation are both the instantaneous velocity and the acceleration zero?",
        options: [
            "on the way up",
            "at the top of the flight path",
            "on the way down",
            "halfway up and halfway down",
            "none of these"
        ],
        correct: 4,
        explanation: "When a ball is thrown upwards, gravity acts continuously, and so it is always -9.8m/s^2 downwards. Therefore, the acceleration of the ball is never 0. When the ball reaches the peak, the speed is 0, but the acceleration due to gravity is always -9.8m/s^2 downwards."
    }, 
    {
        text: "A horizontal force of 95.0 N is applied to a 60.0-kg crate on a rough, level surface. If the crate accelerates at 1.20 m/s², what is the magnitude of the force of kinetic friction acting on the crate?",
        options: [
            "23.0 N",
            "45.0 N",
            "16.0 N",
            "33.0 N",
            "8.80 N"
        ],
        correct: 0,
        explanation: "First, calculate the net force using Newton's second law F_net = ma = (60 kg)(1.20 m/s²) = 72 N. Since the applied force is 95N, the friction force = 95 - 72 = 23N."
    },
    {
        text: "As a block slides down a frictionless incline, which of the following statements is true?",
        options: [
            "Both its speed and acceleration increase.",
            "Its speed and acceleration remain constant.",
            "Its speed increases and its acceleration remains constant.",
            "Both its speed and acceleration decrease.",
             "Its speed increases and its acceleration decreases."
        ],
        correct: 2,
        explanation: "In a frictionless incline, the acceleration is constant. As the block slides down, its speed increases due to the component of gravity acting parallel to the incline."
    },
     {
        text: "If Earth's mass and radius both suddenly doubled, what would be the new value of the acceleration of gravity near Earth's surface?",
        options: [
            "9.80 m/s²",
            "4.90 m/s²",
            "2.45 m/s²",
            "19.6 m/s²",
            "12.6 m/s²"
        ],
        correct: 1,
        explanation: "The acceleration due to gravity is given by g = GM/r². If both mass (M) and radius (r) are doubled, then g_new = G(2M)/(2r)²=2GM/4r²=(1/2)(GM/r²). Therefore, the new gravity would be half of the original, 9.8 / 2 = 4.9 m/s²."
    },
 {
        text: "If a constant non-zero net external force acts on an object during a given period, which of the following statements must be true during that time?",
        options: [
            "The object moves.",
            "The magnitude of the object's velocity increases.",
            "The acceleration of the object is increasing.",
            "The object decelerates.",
             "The object's speed remains constant."
        ],
        correct: 0,
        explanation: "According to Newton's first law, an object at rest will remain at rest and an object in motion will remain in motion unless acted upon by a net external force, meaning a net force will cause a movement, so an object moves."
    },
    {
        text: "Two monkeys of equal mass are holding onto a single vine of negligible mass that hangs vertically from a tree, with one monkey a few meters higher than the other. What is the ratio of the tension in the vine between the two monkeys?",
        options: [
            "1",
            "1",
            "1/2",
            "2",
             "More information is required."
        ],
        correct: 3,
        explanation: "Let T1 be the tension above the higher monkey, and T2 the tension between the two. The lower monkey has mass m and weight mg and is supported by T2, thus T2 = mg. The upper monkey is supported by T1 along with lower monkey, thus T1 = 2mg. Therefore the ratio of T1/T2 = 2mg/mg= 2"
    },
   {
        text: "A crate remains stationary after it has been placed on a ramp inclined at an angle with the horizontal. Which of the following statements must be true about the magnitude of the frictional force that acts on the crate?",
        options: [
            "It is larger than the weight of the crate.",
            "It is at least equal to the weight of the crate.",
            "It is equal to μN.",
            "It is greater than the component of the gravitational force acting down the ramp.",
            "It is equal to the component of the gravitational force acting down the ramp."
        ],
        correct: 4,
        explanation: "Since the crate is stationary, the static friction is equal in magnitude and opposite in direction to the component of gravity that pulls it down the ramp. Hence, the frictional force is equal to the component of gravitational force acting down the ramp."
    },
    {
        text: "In the photo on page 89, a locomotive has broken through the wall of a train station. During the collision, what can be said about the force exerted by the locomotive on the wall?",
        options: [
           "The force exerted by the locomotive on the wall was larger than the force the wall could exert on the locomotive.",
            "The force exerted by the locomotive on the wall was the same in magnitude as the force exerted by the wall on the locomotive.",              "The force exerted by the locomotive on the wall was less than the force exerted by the wall on the locomotive.",
            "The wall cannot be said to “exert” a force; after all, it broke."
        ],
        correct: 1,
        explanation: "Newton's third law states that forces come in pairs. The force that the locomotive exerts on the wall is equal in magnitude and opposite in direction to the force that the wall exerts on the locomotive."
    },
    {
        text: "If an object of mass m moves with constant velocity v, the net force on the object is",
         options: [
           "mg",
            "mv",
            "mv/t",
            "0",
            "None of these answers is correct."
        ],
        correct: 3,
        explanation: "According to Newton's first law, an object in motion continues in that motion with the same velocity unless a net force acts on it. If the velocity is constant, the acceleration is zero, so the net force on the object is also zero."
    },
{
        text: "Four forces act on an object, given (⃗A⃗)⃗ = 40 N east, (⃗B⃗)⃗ = 50 N north, (⃗C⃗)⃗ = 70 N west, and (⃗D⃗)⃗ = 90 N south. What is the magnitude of the net force on the object?",
        options: [
            "50 N",
            "70 N",
            "131 N",
            "170 N",
            "250 N"
        ],
        correct: 0,
       explanation: "Resolve the forces into x and y components. x component is 40N (east) - 70 N(west) = -30N and y is 50N (north) -90N(south) = -40N. Now you have two perpendicular vectors with magnitude of 30N and 40N and so use Pythag theorem to find result vector, which is the magnitude of square root of (30² + 40²) = 50N."
    }, 
    {
        text: "If an object is in equilibrium, which of the following statements is *not* true?",
        options: [
            "The speed of the object remains constant.",
            "The acceleration of the object is zero.",
            "The net force acting on the object is zero.",
            "The object must be at rest.",
            "The velocity is constant."
        ],
        correct: 3,
        explanation: "An object in equilibrium has zero net force and therefore zero acceleration. However, zero acceleration implies that the velocity is constant, not necessarily zero. Hence the object could be moving at a constant velocity."
    },
    {
        text: "A manager of a restaurant pushes horizontally with a force of magnitude 150 N on a box of melons. The box moves across the floor with a constant acceleration in the same direction as the applied force. Which statement is most accurate concerning the magnitude of the force of kinetic friction acting on the box?",
       options: [
            "It is greater than 150 N.",
            "It is less than 150 N.",
            "It is equal to 150 N.",
             "The kinetic friction force is steadily decreasing.",
           "The kinetic friction force must be zero."
        ],
        correct: 1,
        explanation: "If the box has a constant acceleration in the same direction as the applied force, then the applied force must be greater than the opposing force of kinetic friction. Therefore the kinetic friction is less than 150 N."
    },    text: "Why might the terms 'anterior' and 'posterior' be less applicable to animals with radial symmetry?",
    options: ["They have a clear anterior and posterior end", "They lack a defined head and tail", "They are used for the oral and aboral ends.", "They are also biradially symmetrical."],
    correct: 1,
    explanation: "Animals with radial symmetry lack a distinct head and tail (anterior and posterior ends). Their body plan is organized around a central axis, making anterior/posterior designations less meaningful."
  },
  {
    text: "If a new animal group is found to have a coelom lined with both mesoderm and endoderm, what would it imply about the current classification of coeloms?",
    options: ["It will confirm the coelom classification", "It will require adjustments of the coelom classification", "It won't change anything", "It will imply that it is an acoelomate."],
    correct: 1,
    explanation: "The current understanding of coeloms is that they are lined primarily with mesoderm.  A coelom lined with both mesoderm and endoderm would challenge this understanding, necessitating revisions to the classification system."
  },
 tissue layer is absent in diploblastic organisms?",
        options: ["Ectoderm", "Mesoderm", "Endoderm", "Epidermis"],
        correct: 1,
       explanation: "Diploblastic organisms lack the mesoderm. They only have ectoderm and endoderm which are separated by a jelly-like substance called mesoglea."
    },
    {
        text: "The term 'mesoglea' refers to a key component found in which group?",
        options: ["All coelomate animals", "All triploblastic animals", "All diploblastic animals", "All acoelomate animals"],
        correct: 2,
         explanation: "Mesoglea is a gelatinous, non-cellular substance found in diploblastic animals. It is located between the ectoderm and endoderm layers. It acts as a support and helps maintain their shape."
    },
    {
        text: "What structural feature differentiates the phylum Cnidaria from other animal phyla?",
        options: ["The type of cells that they have", "The number of layers", "The symmetry of the body", "Their method of reproduction"],
        correct: 2,
       explanation: "Cnidarians are characterized by having radial symmetry in their body plans. This distinguishes them from most other animals, which are bilaterally symmetrical. In addition, they have specialized stinging cells called cnidocytes."
    },
  {
        text: "Triploblastic animals are characterized by possessing which tissue?",
        options: ["Ectoderm only", "Endoderm only", "Mesoderm only", "Ectoderm, mesoderm, and endoderm"],
        correct: 3,
       explanation: "Triploblastic animals possess all three primary tissue layers: the ectoderm (outer layer), mesoderm (middle layer), and endoderm (inner layer). These layers give rise to all of the tissues and organs of the animal."
    },
    {
        text: "A 'true coelom' is distinguished from other body cavities by being:",
        options: ["Partially lined with mesoderm", "Fully lined with endoderm", "Fully lined with mesoderm", "Containing a jelly-like substance"],
        correct: 2,
        explanation: "A true coelom is a body cavity that is fully lined with tissue derived from mesoderm. This lining creates a space within which organs can develop and be cushioned, allowing for more complex structures and movement. The fluid filled space is beneficial for several reasons."
    },
    {
        text: "What primary distinction defines a pseudocoelom?",
        options: ["The coelom lacks a lining", "The coelom is fully lined with endoderm", "The coelom is fully lined with mesoderm", "The coelom is only partially lined with mesoderm"],
        correct: 3,
        explanation: "A pseudocoelom is a body cavity that is only partially lined with mesoderm. Specifically, the mesoderm lines the outer edge of the cavity, but  not the inner edge. This difference in lining distinguishes it from a true coelom."
    },
   {
        text: "Which group is characterized by lacking a body cavity?",
        options: ["Coelomates", "Pseudocoelomates", "Acoelomates", "Radiates"],
        correct: 2,
         explanation: "Acoelomates are animals that lack a body cavity. This means there is no fluid-filled space between their digestive tract and their outer body wall. The space is instead filled with mesodermal tissue."
    },
   {
        text: "How would you describe the pattern in which the body parts are arranged around a central axis?",
        options: ["Bilaterally symmetrical", "Biradially symmetrical", "Radially symmetrical", "Asymmetrical"],
        correct: 2,
       explanation: "The arrangement of body parts around a central axis is a characteristic of radially symmetrical animals. They have top and bottom sides but no clear left and right sides, or front and back ends."
    },
    {
        text: "A specific type of symmetry that has some mirror image qualities would be called:",
        options: ["Biradial Symmetry", "Radial Symmetry", "Bilateral Symmetry", "Asymmetrical symmetry"],
        correct: 2,
        explanation: "Bilateral symmetry is characterized by a distinct left and right side, each being a near mirror image of the other. Organisms with bilateral symmetry typically have a head and a tail (anterior and posterior), a top and bottom (dorsal and ventral), and a left and right side."
    },
     {
        text: "What defines the orientation (front/back) for animals that have radial symmetry?",
        text: "An animal is discovered with a mesoderm, and a fluid filled cavity completely lined with mesoderm. What category would it belong to?",
        options: ["Diploblastic and acoelomate", "Triploblastic and pseudocoelomate", "Triploblastic and coelomate", "Triploblastic and acoelomate"],
         correct: 2,
         explanation: "An animal with a mesoderm is triploblastic. A fluid-filled cavity completely lined with mesoderm defines a true coelomate. So, the organism would be a triploblastic coelomate. A pseudocoelom is partially lined with mesoderm. Acoelomates do not have a body cavity."
    },
 {
        text: "An organism displays radial symmetry with distinct oral and aboral ends. Which phylum would it most likely belong to?",
        options: ["Platyhelminthes", "Annelida", "Cnidaria", "Arthropoda"],
        correct: 2,
        explanation: "Cnidaria, which includes jellyfish and sea anemones, is characterized by radial symmetry and have oral and aboral ends. Platyhelminthes, Annelida and Arthropoda display bilateral symmetry."
    }, 
  {
    text: "Imagine that scientists discover a new phylum with a unique coelomic structure. How might this impact current classifications of animals based on the coelom?",
    options: ["No impact since coelom structure is a minor detail", "The existing system may need to be revised and improved.", "Scientists will ignore the finding.", "Coelomic structure is irrelevant"],
    correct: 1,
    explanation: "The discovery of a new coelomic structure would necessitate a review and potential revision of the existing animal classification system based on coelom types. It may also lead to further discoveries and understanding of evolutionary history."
  },
  {
    text: "If scientists determined that a mesoglea was not unique to one group but found in many groups of diploblastic animals, how might this influence our understanding of evolution?",
    options: ["It would show that mesoglea is a common trait", "It would show that classification is incorrect", "It might show that this trait evolved independently in different groups.", "It would imply that all these groups are closely related."],
    correct: 2,
    explanation: "The presence of mesoglea in disparate groups of diploblastic animals could indicate convergent evolution—the independent evolution of similar traits in unrelated organisms. The same selective pressures resulted in similar features in separate lineages."
  }, 
  ],
};

let questions = []; // Placeholder for dynamically loaded questions

// DOM Elements
const authSection = document.getElementById("auth-section");
const courseCodeSection = document.getElementById("course-code-section");
const examSection = document.getElementById("exam-section");
const resultsSection = document.getElementById("results-section");
const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");
const selectCourseBtn = document.getElementById("selectCourseBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const submitBtn = document.getElementById("submitBtn");
const questionTitle = document.getElementById("question-title");
const answerOptions = document.getElementById("answer-options");
const progressBar = document.querySelector(".progress-bar");
const timerElement = document.getElementById("timer");
const userDetails = document.getElementById("user-details");
const resultsContent = document.getElementById("results-content");
const resultsSummary = document.getElementById("results-summary");
const downloadPDF = document.getElementById("downloadPDF");



// Call this function before initializing the exam
function initializeExam() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const currentExam = JSON.parse(localStorage.getItem('currentExam'));

    if (!currentUser || !currentUser.fullName) {
        alert("Session expired! Please log in again.");
        returnToLogin();
        return;
    }

    if (!currentExam) {
        alert("No exam found. Please select an exam.");
        return;
    }

    // Display user and exam details
    document.getElementById('user-details').textContent = 
        `Candidate: ${currentUser.fullName} | Exam: ${currentExam.title}`;

    startTime = Date.now();
    loadQuestion();
    startTimer();
    
    // Ensure the exam section is displayed
    document.getElementById('examSection').classList.remove("hidden");
}


// Helper function to handle logout and redirection
function returnToLogin() {
    localStorage.removeItem('currentUser'); // Clear session data
    window.location.href = "new-index.html"; // Redirect to login page
}


// ✅ Function to allocate exams based on User ID
function allocateUsersToExams(users, exams) {
    const examAllocations = {};

    users.forEach(user => {
        const allocatedExams = [];
        while (allocatedExams.length < 2) { // Each user gets 2 random exams
            const randomExam = exams[Math.floor(Math.random() * exams.length)];
            if (!allocatedExams.some(exam => exam.id === randomExam.id)) {
                allocatedExams.push(randomExam);
            }
        }
        examAllocations[user.userId] = allocatedExams; // Store exams per user ID
    });

    localStorage.setItem('examAllocations', JSON.stringify(examAllocations));
}

// ✅ Example Users and Exams
const users = [
    { userId: "NASS-0874", fullName: "Richard Ochuko" },
    { userId: "NASS-RIEM", fullName: "Richard Ochuko" },
    { userId: "TECH-M7XJ", fullName: "Charlie Brown" }
];

const exams = [
    { id: "exam1", title: "Mathematics 101" },
    { id: "exam2", title: "Physics 201" },
    { id: "exam3", title: "History 101" },
    { id: "exam4", title: "Biology 202" }
];

// ✅ Allocate exams on page load
allocateUsersToExams(users, exams);

// ✅ Faculty-based User ID Generation
function generateUserID(facultyCode) {
    const randomString = Math.random().toString(36).substr(2, 4).toUpperCase(); // Random 4-character mix of letters and numbers
    return `${facultyCode}-${randomString}`;
}

// ✅ Prevent users from registering more than 2 accounts
function hasReachedRegistrationLimit() {
    const registrations = JSON.parse(localStorage.getItem("userRegistrations")) || [];
    return registrations.length >= 2; // Limit to 2 accounts per user
}

// ✅ Register User
document.getElementById('registerAccountBtn').addEventListener('click', function () {
    const fullName = document.getElementById('registerFullName').value.trim();
    const facultySelect = document.getElementById('faculty');
    const facultyCode = facultySelect.value; // Selected faculty code
    const department = document.getElementById('department').value.trim();
    const level = document.getElementById('level').value.trim();

    if (!fullName || !facultyCode || !department || !level) {
        alert('Please fill in all fields to register.');
        return;
    }

    if (hasReachedRegistrationLimit()) {
        alert("You have reached the registration limit. You can't register more accounts.");
        return;
    }

    const userId = generateUserID(facultyCode);
    const userDetails = { 
        fullName, 
        facultyCode,
        faculty: facultySelect.options[facultySelect.selectedIndex].text, 
        department, 
        level, 
        userId 
    };

    // Send user details to the server
    fetch('/register-user', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(userDetails)
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert('Error: ' + data.error);
        } else {
            // Automatically assign exam ID "CHM101-F1" to the new user
            const examAllocations = JSON.parse(localStorage.getItem('examAllocations')) || {};
            examAllocations[userId] = [{ id: "CHM101-F1", title: "INTRODUCTORY CHEMISTRY ONE" }];
            localStorage.setItem('examAllocations', JSON.stringify(examAllocations));

            // Track number of registrations
            const registrations = JSON.parse(localStorage.getItem("userRegistrations")) || [];
            registrations.push(userId);
            localStorage.setItem("userRegistrations", JSON.stringify(registrations));

            document.getElementById('userIdDisplay').innerText = "Your User ID: " + userId;
            alert('Registration successful! Your User ID is: ' + userId);
            window.location.href = 'new-index.html';
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred during registration.');
    });
});

// ✅ Back to Login Button
document.getElementById("backToLoginBtn").addEventListener("click", () => {
    document.getElementById("registration-section").classList.add("hidden");
    document.getElementById("auth-section").classList.remove("hidden");
});


    

  // Define the list of predefined students
const students = [
  { fullName: "Richard Ochuko", department: "NASS", part: "1", matricNumber: "NASS-0874", faculty: "Science" },
  { fullName: "Charlie Brown", department: "TECH", part: "2", matricNumber: "TECH-M7XJ", faculty: "Engineering" },
  // Add more students as needed
];

// Helper function to get student's first and last name
function getStudentNames(fullName) {
  const names = fullName.toLowerCase().split(" ");
  return names.length > 1 ? [names[0], names[names.length - 1]] : [names[0]];
}

// Function to authenticate user
function authenticateUser(fullName, password) {
  const userNames = getStudentNames(fullName);

  const student = students.find(student => {
    const studentNames = getStudentNames(student.fullName);
    return studentNames.some(name => userNames.includes(name)) && student.matricNumber === password;
  });

  if (student) {
    return student;
  }
  return null;
}

// Update the login function
document.getElementById('loginBtn').addEventListener('click', function () {
  const fullName = document.getElementById('fullName').value.trim();
  const password = document.getElementById('userID').value.trim(); // Use matric number as password

  const authenticatedStudent = authenticateUser(fullName, password);

  if (authenticatedStudent) {
    localStorage.setItem("currentUser", JSON.stringify(authenticatedStudent));
    document.getElementById('userDetails').innerHTML = `
      <strong>Full Name:</strong> ${authenticatedStudent.fullName} <br>
      <strong>Faculty:</strong> ${authenticatedStudent.faculty} <br>
      <strong>Department:</strong> ${authenticatedStudent.department} <br>
      <strong>Level:</strong> ${authenticatedStudent.part}
    `;

    const examsList = document.getElementById('examsList');
    examsList.innerHTML = ''; // Clear previous exams

    // Ensure "CHM101-F1" is included in the user's exam allocations
    const examAllocations = JSON.parse(localStorage.getItem('examAllocations')) || {};
    if (!examAllocations[authenticatedStudent.matricNumber]) {
      examAllocations[authenticatedStudent.matricNumber] = [];
    }

    if (!examAllocations[authenticatedStudent.matricNumber].some(exam => exam.id.trim() === "CHM101-F1")) {
      examAllocations[authenticatedStudent.matricNumber].push({ id: "CHM101-F1", title: "INTRODUCTORY CHEMISTRY ONE" });
    }

    localStorage.setItem('examAllocations', JSON.stringify(examAllocations));

    // Display assigned exams
    examAllocations[authenticatedStudent.matricNumber].forEach(exam => {
      const examItem = document.createElement('button');
      examItem.innerText = exam.title;
      examItem.className = 'styled-btn';

      examItem.addEventListener('click', function () {
        document.getElementById("courseCode").value = exam.id;
        document.getElementById("selectCourseBtn").click();
      });

      examsList.appendChild(examItem);
    });

    document.getElementById('popup').classList.add('active');
    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('course-code-section').classList.remove('hidden');
    document.getElementById('toggle-calculator').classList.remove('hidden');
    document.getElementById('calculator-popup').classList.remove('hidden');
  } else {
    alert("Invalid Full Name or Matric Number. Please try again.");
  }
});

function displayExamSection(examId) {
    alert('Displaying exam section for exam ID: ' + examId);
}
  
document.getElementById('registerBtn').addEventListener('click', function() {
    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('registration-section').classList.remove('hidden');
});

const backToLoginBtn = document.getElementById("backToLoginBtn");

backToLoginBtn.addEventListener("click", () => {
  document.getElementById("registration-section").classList.add("hidden");
  document.getElementById("auth-section").classList.remove("hidden");
});

// Select Course Code
selectCourseBtn.addEventListener("click", () => {
  const courseCodeInput = document.getElementById("courseCode").value.trim().toUpperCase();

  if (!courseCodeInput || !questionBanks[courseCodeInput]) {
    alert("Invalid course code. Please try again.");
    return;
  }

  selectedCourseCode = courseCodeInput;
  questions = shuffleArray(questionBanks[selectedCourseCode]).slice(0, 50); // Randomize and limit to 50 questions

  if (questions.length === 0) {
    alert("No questions available for this course. Please try another course code.");
    return;
  }

  courseCodeSection.classList.add("hidden");
  initializeExam();
});


// Shuffle questions randomly
function shuffleArray(array) {
  return array.sort(() => Math.random() - 0.9);
}

// ✅ Initialize Exam Based on Selection or Manual Input
function initializeExam() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const currentExam = JSON.parse(localStorage.getItem('currentExam'));

    if (!currentUser || !currentUser.fullName) {
        alert("Session expired! Please log in again.");
        returnToLogin();
        return;
    }

    if (!currentExam) {
        alert("No exam found. Please select an exam.");
        return;
    }

    // Display user and exam details
    document.getElementById('user-details').textContent = 
        `Candidate: ${currentUser.fullName} | Exam: ${currentExam.title}`;

    startTime = Date.now();
    loadQuestion();
    startTimer();
    
    // Ensure the exam section is displayed
    document.getElementById('examSection').classList.remove("hidden");
}



// ✅ Start Exam Function
function startExam(examId, examTitle) {
    console.log(`Starting exam: ${examTitle}`); // Debugging log

    // Store the selected exam for later use
    localStorage.setItem("currentExam", JSON.stringify({ id: examId, title: examTitle }));

    // Hide the popup
    document.getElementById('popup').classList.remove('active');

    // Hide the course code selection if it's visible
    document.getElementById('course-code-section').classList.add('hidden');

    // Ensure the exam section is visible
    document.getElementById('examSection').classList.remove('hidden');

    // Fetch questions for this exam
    if (!questionBanks || !questionBanks[examId]) {
        alert("No questions available for this exam.");
        return;
    }

    // Randomize and select up to 50 questions
    questions = shuffleArray(questionBanks[examId]).slice(0, 50);

    if (questions.length === 0) {
        alert("No questions available for this exam. Please try another.");
        return;
    }

    // Initialize the exam with the selected exam details
    initializeExam();
                                                        }

// ✅ Close Pop-up Manually
document.getElementById('closePopup').addEventListener('click', function () {
    document.getElementById('popup').style.display = 'none';
});
                                   

// Load Current Question
function loadQuestion() {
  const question = questions[currentQuestionIndex];

  // Add question number dynamically
  questionTitle.textContent = `${currentQuestionIndex + 1}. ${question.text}`;

  // Populate Answer Options with correct numbering
  answerOptions.innerHTML = question.options
    .map((option, index) => `
      <button class="answer-btn" onclick="selectAnswer(${index}, this)">
        ${option}
      </button>
    `)
    .join("");

  highlightSelectedAnswer();
  updateButtons();
  updateProgressBar();
}

// Highlight Previously Selected Answer
function highlightSelectedAnswer() {
  const selectedAnswer = userAnswers[currentQuestionIndex];
  if (selectedAnswer !== undefined) {
    const buttons = document.querySelectorAll(".answer-btn");
    buttons.forEach((button, idx) => {
      if (idx === selectedAnswer) {
        button.classList.add("selected");
      }
    });
  }
}

// Select Answer
function selectAnswer(answerIdx, button) {
  userAnswers[currentQuestionIndex] = answerIdx;

  const buttons = document.querySelectorAll(".answer-btn");
  buttons.forEach(btn => btn.classList.remove("selected"));

  button.classList.add("selected");
}

// Update Navigation Buttons
function updateButtons() {
  prevBtn.classList.toggle("hidden", currentQuestionIndex === 0);
  nextBtn.classList.toggle("hidden", currentQuestionIndex === questions.length - 1);
  submitBtn.classList.toggle("hidden", currentQuestionIndex !== questions.length - 1);
}

// Update Progress Bar
function updateProgressBar() {
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  progressBar.style.width = `${progress}%`;
}
console.log("Questions array:", questions);
console.log("Current question index:", currentQuestionIndex);
console.log("Loaded question:", questions[currentQuestionIndex]);




// Timer
function startTimer() {
  timerInterval = setInterval(() => {
    const minutes = Math.floor(remainingTime / 60);
    const seconds = remainingTime % 60;
    timerElement.textContent = `Time Remaining: ${minutes}:${seconds.toString().padStart(2, "0")}`;
    if (remainingTime <= 0) {
      clearInterval(timerInterval);
      alert("Time's up! Your exam will now be submitted.");
      submitExam();
    }
    remainingTime--;
  }, 1000);
}

// Navigate to Previous Question
prevBtn.addEventListener("click", () => {
  currentQuestionIndex--;
  loadQuestion();
});

// Navigate to Next Question
nextBtn.addEventListener("click", () => {
  currentQuestionIndex++;
  loadQuestion();
});

// Submit Exam
submitBtn.addEventListener("click", submitExam);

function submitExam() {
  clearInterval(timerInterval); // Stop the timer
  const endTime = Date.now();
  const timeSpent = (endTime - startTime) / 1000; // Total time spent in seconds
  const avgTimePerQuestion = (timeSpent / questions.length).toFixed(2);

  // Performance Report
  const totalAnswered = userAnswers.filter(answer => answer !== undefined).length;
  const totalNotAnswered = questions.length - totalAnswered;
  const totalCorrect = questions.filter((q, i) => userAnswers[i] === q.correct).length;
  const scorePercent = ((totalCorrect / questions.length) * 100).toFixed(2);

  resultsSummary.innerHTML = `
    <p><strong>Performance Report:</strong></p>
    <p>Total Questions Answered: ${totalAnswered}</p>
    <p>Total Questions Not Answered: ${totalNotAnswered}</p>
    <p>Score: ${totalCorrect} / ${questions.length} (${scorePercent}%)</p>
    <p>Average Time Spent per Question: ${avgTimePerQuestion} seconds</p>
  `;

  // Results Content
resultsContent.innerHTML = questions.map((q, i) => {
  const userAnswerIdx = userAnswers[i];
  const userAnswer = userAnswerIdx !== undefined ? q.options[userAnswerIdx] : "Not Answered";
  const correctAnswer = q.options[q.correct];
  const isCorrect = userAnswerIdx === q.correct;
  const result = isCorrect ? "✅ Correct" : "❌ Wrong";

  return `
    <p>
      ${i + 1}. ${q.text}<br>
      Your Answer: <b>${userAnswer}</b> - ${result}<br>
      <b>Correct Answer:</b> ${correctAnswer}<br>
      <i>Explanation:</i> ${q.explanation}
    </p>
  `;
}).join("");


  examSection.classList.add("hidden");
  resultsSection.classList.remove("hidden");

  downloadPDF.addEventListener("click", generatePDF);
}

async function generatePDF() {
  const { jsPDF } = window.jspdf; // Import jsPDF
  const logo = 'logo.png'; // Base64 encoded logo image
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "px",
    format: "a4"
  });

  // Prompt the user to choose between Results and corrections or Plain questions
  const isAdmin = confirm("Is this PDF for Admins (Plain questions with answer keys)? Click 'OK' for Admins, 'Cancel' for Results and corrections.");

  if (isAdmin) {
    const adminCode = prompt("Please enter the admin code:");
    if (adminCode !== "OAU-ADMIN") { // Replace 'YOUR_ADMIN_CODE' with the actual admin code
      alert("Invalid admin code. PDF generation aborted.");
      return;
    }

    const courseTitle = prompt("Please enter the course title:");
    const duration = prompt("Please enter the exam duration:");

    // Generate PDF for Admins
    generateAdminPDF(doc, logo, courseTitle, duration);
  } else {
    // Generate PDF for Users
    generateUserPDF(doc, logo);
  }
}

function generateUserPDF(doc, logo) {
  // Constants
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2; // Width for text
  const lineHeight = 20;
  const sectionSpacing = 10;
  let yOffset = margin;

  // Colors
  const headerBackground = "#4A90E2";
  const sectionHeadingColor = "#333";
  const questionColor = "#000";
  const answerColor = "#28a745";
  const explanationColor = "#555";

  // Header Section
  doc.setFillColor(headerBackground);
  doc.rect(0, yOffset, pageWidth, 70, "F"); // Draw header background
  yOffset += 35; // Adjust for the height of the logo

  // Add Logo in the center of the header
  doc.addImage(logo, 'PNG', pageWidth / 2 - 25, yOffset - 25, 50, 50);
  yOffset += 35; // Adjust for the height of the header

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor("#FFFFFF");
  doc.text("STUDENTS SUPPORT SYSTEM", pageWidth / 2, yOffset - 40, { align: "center" });

  doc.setFontSize(15);
  doc.text(`OBAFEMI AWOLOWO UNIVERSITY`, pageWidth / 2, yOffset - 20, { align: "center" });
  yOffset += 30;

  // Performance Summary Section
  const totalAnswered = userAnswers.filter(answer => answer !== undefined).length;
  const totalNotAnswered = questions.length - totalAnswered;
  const totalCorrect = questions.filter((q, i) => userAnswers[i] === q.correct).length;
  const scorePercent = ((totalCorrect / questions.length) * 100).toFixed(2);

  doc.setFontSize(16);
  doc.setTextColor(sectionHeadingColor);
  doc.text("Performance Report", margin, yOffset);
  yOffset += lineHeight;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.text(`Candidate Name: ${fullName}`, margin, yOffset); // Candidate's full name
  yOffset += lineHeight;
  doc.text(`Course: INTRODUCTORY ZOOLOGY 1`, margin, yOffset);
  yOffset += lineHeight;
  doc.text(`Course Code: ${selectedCourseCode}`, margin, yOffset);
  yOffset += lineHeight;
  doc.text(`Total Questions Answered: ${totalAnswered}`, margin, yOffset);
  yOffset += lineHeight;
  doc.text(`Total Questions Not Answered: ${totalNotAnswered}`, margin, yOffset);
  yOffset += lineHeight;
  doc.text(`Score: ${totalCorrect} / ${questions.length} (${scorePercent}%)`, margin, yOffset);
  yOffset += lineHeight * 2;

  // Add Divider Line
  doc.setDrawColor("#000");
  doc.setLineWidth(0.5);
  doc.line(margin, yOffset, pageWidth - margin, yOffset);
  yOffset += sectionSpacing * 2;

  // Questions and Answers Section
  questions.forEach((q, i) => {
    if (yOffset > pageHeight - margin - lineHeight * 6) {
      doc.addPage(); // Add a new page if content exceeds the current page
      yOffset = margin;
    }

    // Question Number and Text
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(questionColor);
    const questionText = doc.splitTextToSize(`${i + 1}. ${q.text}`, contentWidth);
    doc.text(questionText, margin, yOffset);
    yOffset += questionText.length * lineHeight;

    // Correct Answer
    doc.setFont("helvetica", "normal");
    doc.setTextColor(answerColor);
    const correctAnswer = doc.splitTextToSize(`Correct Answer: ${q.options[q.correct]}`, contentWidth);
    doc.text(correctAnswer, margin, yOffset);
    yOffset += correctAnswer.length * lineHeight;

    // Explanation
    doc.setFont("helvetica", "italic");
    doc.setTextColor(explanationColor);
    const explanation = doc.splitTextToSize(`Explanation: ${q.explanation}`, contentWidth);
    doc.text(explanation, margin, yOffset);
    yOffset += explanation.length * lineHeight + sectionSpacing;

    // Add Divider Line
    doc.setDrawColor("#ddd");
    doc.setLineWidth(0.5);
    doc.line(margin, yOffset, pageWidth - margin, yOffset);
    yOffset += sectionSpacing * 2;
  });

  // Footer Section
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor("#666");
  const footerY = pageHeight - margin;
  doc.text("Compiled by Hon Richard D'Prof and Generated for Mock OAU Exam Platform", pageWidth / 2, footerY, { align: "center" });

  // Save the PDF
  doc.save(`${fullName}_Exam_Results.pdf`);
}

function generateAdminPDF(doc, logo, courseTitle, duration) {
  // Constants
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2; // Width for text
  const lineHeight = 20;
  const sectionSpacing = 10;
  let yOffset = margin;

  // Colors
  const headerBackground = "#4A90E2";
  const sectionHeadingColor = "#333";
  const questionColor = "#000";
  const answerColor = "#28a745";

  // Header Section
  doc.setFillColor(headerBackground);
  doc.rect(0, yOffset, pageWidth, 70, "F"); // Draw header background
  yOffset += 35; // Adjust for the height of the logo

  // Add Logo in the center of the header
  doc.addImage(logo, 'PNG', pageWidth / 2 - 25, yOffset - 25, 50, 50);
  yOffset += 35; // Adjust for the height of the header

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor("#FFFFFF");
  doc.text("Obafemi Awolowo University", pageWidth / 2, yOffset - 40, { align: "center" });

  doc.setFontSize(16);
  doc.text(`Mock Examination Questions`, pageWidth / 2, yOffset - 20, { align: "center" });
  yOffset += 30;

  // Add Course Title and Duration
  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.setTextColor(questionColor);
  doc.text(`Course Title: ${courseTitle}`, margin, yOffset);
  yOffset += lineHeight;
  doc.text(`Duration: ${duration}`, margin, yOffset);
  yOffset += lineHeight * 2;

  // Questions Section
  questions.forEach((q, i) => {
    if (yOffset > pageHeight - margin - lineHeight * 6) {
      doc.addPage(); // Add a new page if content exceeds the current page
      yOffset = margin;
    }

    // Question Number and Text
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(questionColor);
    const questionText = doc.splitTextToSize(`${i + 1}. ${q.text}`, contentWidth);
    doc.text(questionText, margin, yOffset);
    yOffset += questionText.length * lineHeight;

    // Answer Options
    doc.setFont("helvetica", "normal");
    doc.setTextColor(questionColor);
    q.options.forEach((option, idx) => {
      const optionText = doc.splitTextToSize(`${String.fromCharCode(65 + idx)}. ${option}`, contentWidth);
      doc.text(optionText, margin, yOffset);
      yOffset += optionText.length * lineHeight;
    });

    yOffset += sectionSpacing;
  });

  // Answer Sheet Page
  doc.addPage(); // Start a new page for the answer sheet
  yOffset = margin;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(sectionHeadingColor);
  doc.text("Answer Sheet", margin, yOffset);
  yOffset += lineHeight * 2;

  // Draw columns for A, B, C, D
  doc.setFontSize(12);
  doc.setTextColor(questionColor);
  const answerColumns = ["A", "B", "C", "D"];
  const boxWidth = (contentWidth - 50) / 4; // Four columns
  const boxHeight = lineHeight;

  answerColumns.forEach((col, idx) => {
    doc.text(col, margin + boxWidth * idx + 25, yOffset);
  });
  yOffset += lineHeight;

  // Draw the answer boxes for each question
  for (let i = 1; i <= 50; i++) {
    // Draw the question number
    doc.text(`${i}.`, margin, yOffset + boxHeight / 2);

    // Draw the answer boxes
    for (let j = 0; j < 4; j++) {
      doc.rect(margin + boxWidth * j + 20, yOffset, boxWidth, boxHeight);
    }

    yOffset += lineHeight;

    if (i % 25 === 0 && i !== 50) {
      doc.addPage(); // Add a new page if content exceeds the current page
      yOffset = margin + lineHeight * 2;
      answerColumns.forEach((col, idx) => {
        doc.text(col, margin + boxWidth * idx + 25, yOffset);
      });
      yOffset += lineHeight;
    }
  }

  // Answer Key Section
  doc.addPage(); // Start a new page for answer keys
  yOffset = margin;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(sectionHeadingColor);
  doc.text("Answer Key", margin, yOffset);
  yOffset += lineHeight * 2;

  questions.forEach((q, i) => {
    if (yOffset > pageHeight - margin - lineHeight * 6) {
      doc.addPage(); // Add a new page if content exceeds the current page
      yOffset = margin;
    }

    // Answer Key
    doc.setFont("helvetica", "normal");
    doc.setFontSize(14);
    doc.setTextColor(answerColor);
    const answerKey = doc.splitTextToSize(`${i + 1}. ${String.fromCharCode(65 + q.correct)}`, contentWidth);
    doc.text(answerKey, margin, yOffset);
    yOffset += answerKey.length * lineHeight;
  });

  // Footer Section
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor("#666");
  const footerY = pageHeight - margin;
  doc.text("Compiled by Hon Richard D'Prof and Generated for OAU Mock Exam Platform", pageWidth / 2, footerY, { align: "center" });

  // Save the PDF
  doc.save(`${selectedCourseCode}_Exam_Questions.pdf`);
    }
// Handle Retake Exam Button
document.getElementById("retakeExamBtn").addEventListener("click", () => {
  // Reset user answers and navigation
  currentQuestionIndex = 0;
  userAnswers = [];
  remainingTime = 30 * 60; // Reset timer
  questions = []; // Clear current questions

  // Hide results and show course code selection
  resultsSection.classList.add("hidden");
  courseCodeSection.classList.remove("hidden");
});
