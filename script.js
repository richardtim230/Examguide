document.addEventListener("DOMContentLoaded", () => {
  // Notification Center Logic
  const notificationCenter = document.getElementById("notification-center");
  const closeNotification = document.getElementById("close-notification");

  if (notificationCenter && closeNotification) {
    let visitCount = parseInt(localStorage.getItem("visitCount") || "0", 10);
    if (visitCount === 0 || visitCount % 10 === 0) {
      notificationCenter.classList.remove("hidden");
    }
    localStorage.setItem("visitCount", visitCount + 1);

    closeNotification.addEventListener("click", () => {
      notificationCenter.classList.add("hidden");
    });
  }

  // Course Selection and Exam Logic
  const courseSelectionSection = document.getElementById("course-selection-section");
  const accessCodeSection = document.getElementById("access-code-section");
  const examSection = document.getElementById("exam-section");
  const summarySection = document.getElementById("summary-section");
  const questionText = document.getElementById("question-text");
  const optionsContainer = document.getElementById("options-container");
  const progressContainer = document.getElementById("progress-container");
  const summaryContent = document.getElementById("summary-content");
  const subjectTitle = document.getElementById("subject-title");
  const selectedCourseTitle = document.getElementById("selected-course-title");
  const cancelButton = document.getElementById("cancel-button");

  let questions = [];
  let currentQuestionIndex = 0;
  let answers = [];
  let timerInterval = null;
  let timeRemaining = 3600; // Timer in seconds
  let selectedCourse = "";
  let subCourseName = "";

  const questionBanks = {
    Mathematics: {
      "MATH101-SET1": {
        title: "Basic Arithmetic",
        questions: [
          { text: "What is 2 + 2?", options: ["2", "3", "4", "5"], correct: 2, explanation: "2 + 2 equals 4." },
          { text: "What is 3 x 3?", options: ["6", "9", "12", "15"], correct: 1, explanation: "3 x 3 equals 9." },
        ],
      },
    },
    Zoology: {
      "ZOO101-12": {
        title: "Animal Systematics Fundamentals",
        questions: [
          { text: "What is the primary basis for the classification of animals in taxonomy?", options: ["Reproductive methods", "Body structure", "Feeding habits", "Behavior"], correct: 1, explanation: "Body structure is a fundamental criterion used in taxonomy to classify animals." },
       
      {
        text: "Which specific cells in the neural crest of vertebrates give rise to peripheral nerves?",
        options: ["Ectodermal cells", "Schwann cells", "Neural crest cells", "Mesodermal cells"],
        correct: 2,
        explanation: "Neural crest cells migrate to form peripheral nerves, pigment cells, and other specialized tissues in vertebrates."
      },
      {
        text: "What type of jaw articulation is seen in cartilaginous fishes (Chondrichthyes)?",
        options: ["Amphistylic", "Autostylic", "Hyostylic", "Synapsid"],
        correct: 2,
        explanation: "Hyostylic jaw articulation allows greater mobility of the jaws in Chondrichthyes, enhancing feeding efficiency."
      },
      {
        text: "Which embryonic structure in chordates contributes to the development of the intervertebral discs in vertebrates?",
        options: ["Endostyle", "Notochord", "Dorsal hollow nerve cord", "Pharyngeal slits"],
        correct: 1,
        explanation: "The notochord becomes the nucleus pulposus of the intervertebral discs in vertebrates."
      },
      {
        text: "What distinguishes placoid scales found in Chondrichthyes from other scale types?",
        options: ["Keratin composition", "Bone-derived structure", "Tooth-like structure with dentin", "Overlapping arrangement"],
        correct: 2,
        explanation: "Placoid scales in Chondrichthyes have a tooth-like structure made of dentin and enamel."
      },
      {
        text: "Which vertebrate group first exhibited a double-loop circulatory system?",
        options: ["Fish", "Amphibians", "Reptiles", "Birds"],
        correct: 1,
        explanation: "Amphibians were the first to evolve a double-loop circulatory system to separate oxygenated and deoxygenated blood."
      },
      {
        text: "Which cranial nerve is associated with the lateral line system in fishes?",
        options: ["Facial nerve (VII)", "Olfactory nerve (I)", "Glossopharyngeal nerve (IX)", "Trigeminal nerve (V)"],
        correct: 0,
        explanation: "The facial nerve (VII) transmits sensory information from the lateral line system in fishes."
      },
      {
        text: "Which gene family regulates the patterning of the vertebrate body axis during development?",
        options: ["Hox genes", "Pax genes", "Wnt genes", "Bmp genes"],
        correct: 0,
        explanation: "Hox genes regulate the anterior-posterior axis formation in vertebrates, determining segment identity."
      },
      {
        text: "What is the role of somites in vertebrate embryogenesis?",
        options: ["Formation of the neural tube", "Segmentation of the body", "Development of the digestive tract", "Formation of gills"],
        correct: 1,
        explanation: "Somites are mesodermal structures that segment the body and give rise to vertebrae, muscles, and dermis."
      },
      {
        text: "Which of the following vertebrate classes is characterized by the absence of bone?",
        options: ["Chondrichthyes", "Osteichthyes", "Amphibia", "Aves"],
        correct: 0,
        explanation: "Chondrichthyes, such as sharks and rays, have skeletons made entirely of cartilage."
      },
      {
        text: "Which type of jaw suspension allows sharks to protrude their jaws for feeding?",
        options: ["Hyostylic", "Autostylic", "Amphistylic", "Anapsid"],
        correct: 0,
        explanation: "Hyostylic jaw suspension allows sharks to protrude their jaws for feeding and improved prey capture."
      },
      {
        text: "Which evolutionary adaptation in vertebrates improved predation efficiency?",
        options: ["Paired fins", "Development of jaws", "Bony skeleton", "Endothermy"],
        correct: 1,
        explanation: "The evolution of jaws in vertebrates improved feeding efficiency, enabling active predation."
      },
      {
        text: "What type of vertebrae is characteristic of the cervical region in birds?",
        options: ["Procoelous", "Heterocoelous", "Amphicoelous", "Opisthocoelous"],
        correct: 1,
        explanation: "Heterocoelous vertebrae in birds provide flexibility for neck movements, aiding in feeding and flight navigation."
      },
      {
        text: "Which part of the brain in vertebrates controls balance and coordination?",
        options: ["Cerebrum", "Cerebellum", "Medulla oblongata", "Thalamus"],
        correct: 1,
        explanation: "The cerebellum controls balance and motor coordination in vertebrates."
      },
      {
        text: "Which specialized cells produce the myelin sheath in the central nervous system of vertebrates?",
        options: ["Schwann cells", "Astrocytes", "Oligodendrocytes", "Microglia"],
        correct: 2,
        explanation: "Oligodendrocytes produce the myelin sheath in the central nervous system, improving nerve impulse conduction."
      },
      {
        text: "Which vertebrate class exhibits a four-chambered heart with complete separation of oxygenated and deoxygenated blood?",
        options: ["Amphibia", "Aves", "Reptilia", "Chondrichthyes"],
        correct: 1,
        explanation: "Birds have a four-chambered heart with complete separation of oxygenated and deoxygenated blood, supporting endothermy."
      },
      {
        text: "Which region of the vertebrate kidney is responsible for filtering blood?",
        options: ["Loop of Henle", "Glomerulus", "Renal pelvis", "Distal tubule"],
        correct: 1,
        explanation: "The glomerulus in the vertebrate kidney filters blood to form urine."
      },
      {
        text: "Which vertebrate group was the first to exhibit a diaphragm for respiration?",
        options: ["Amphibia", "Reptilia", "Mammalia", "Aves"],
        correct: 2,
        explanation: "Mammals were the first vertebrates to evolve a diaphragm, improving respiratory efficiency."
      },
      {
        text: "Which structure in early vertebrates evolved into the vertebral column?",
        options: ["Notochord", "Neural crest", "Gill arches", "Endostyle"],
        correct: 0,
        explanation: "The notochord in early vertebrates was replaced by the vertebral column during evolution."
      },
      {
        text: "What is the primary function of the Weberian apparatus in certain fishes?",
        options: ["Respiration", "Hearing enhancement", "Buoyancy control", "Osmoregulation"],
        correct: 1,
        explanation: "The Weberian apparatus in fishes like catfish enhances hearing by transmitting sound vibrations to the inner ear."
      },
      {
        text: "Which vertebrate group evolved the earliest amniotic egg?",
        options: ["Amphibia", "Reptilia", "Aves", "Mammalia"],
        correct: 1,
        explanation: "Reptiles were the first vertebrates to evolve the amniotic egg, facilitating reproduction on land."
      },
      {
        text: "Which specialized vertebrate structure ensures unidirectional airflow in bird lungs?",
        options: ["Trachea", "Air sacs", "Bronchioles", "Diaphragm"],
        correct: 1,
        explanation: "Air sacs in birds enable unidirectional airflow, ensuring efficient gas exchange during flight."
      },
      {
        text: "Which type of vertebrae is predominant in the tail region of most vertebrates?",
        options: ["Caudal vertebrae", "Thoracic vertebrae", "Cervical vertebrae", "Lumbar vertebrae"],
        correct: 0,
        explanation: "Caudal vertebrae form the tail region, aiding in locomotion and balance in many vertebrates."
      },
      {
        text: "Which region of the vertebrate brain regulates autonomic functions such as heart rate and respiration?",
        options: ["Cerebrum", "Cerebellum", "Medulla oblongata", "Thalamus"],
        correct: 2,
        explanation: "The medulla oblongata controls autonomic functions like heart rate and respiration in vertebrates."
      },
      {
        text: "What is the role of the pineal gland in vertebrates?",
        options: ["Regulating sleep-wake cycles", "Controlling metabolic rate", "Maintaining balance", "Aiding digestion"],
        correct: 0,
        explanation: "The pineal gland produces melatonin, which regulates sleep-wake cycles in vertebrates."
      },
      {
        text: "Which protein is primarily responsible for structural support in vertebrate connective tissues?",
        options: ["Actin", "Myosin", "Collagen", "Elastin"],
        correct: 2,
        explanation: "Collagen is a key protein that provides structural support in vertebrate connective tissues."
      },
      {
        text: "What evolutionary advancement is associated with the pharyngeal slits in vertebrates?",
        options: ["Formation of lungs", "Development of jaws", "Formation of gills", "Development of kidneys"],
        correct: 2,
        explanation: "Pharyngeal slits evolved into gills in aquatic vertebrates, aiding in respiration."
      },
      {
        text: "Which of the following is a defining characteristic of the class Amphibia?",
        options: ["Amniotic eggs", "Scales", "Moist skin", "Endothermy"],
        correct: 2,
        explanation: "Amphibians are characterized by their moist skin, which is essential for cutaneous respiration."
      },
      {
        text: "What is the function of the swim bladder in bony fishes?",
        options: ["Gas exchange", "Buoyancy control", "Reproduction", "Sensory detection"],
        correct: 1,
        explanation: "The swim bladder in bony fishes helps regulate buoyancy, allowing them to maintain depth without constant swimming."
      },
      {
        text: "Which chordate subphylum includes sessile adults?",
        options: ["Cephalochordata", "Urochordata", "Vertebrata", "Hemichordata"],
        correct: 1,
        explanation: "Urochordates, such as tunicates, are sessile as adults but exhibit chordate features like a notochord during their larval stage."
      },
      {
        text: "What type of circulatory system is found in fish?",
        options: ["Single-loop circulation", "Double-loop circulation", "Open circulation", "Lymphatic circulation"],
        correct: 0,
        explanation: "Fish possess a single-loop circulatory system where blood passes through the heart once per cycle."
      },
      {
        text: "Which vertebrate class is considered the evolutionary link between fish and tetrapods?",
        options: ["Amphibia", "Reptilia", "Mammalia", "Aves"],
        correct: 0,
        explanation: "Amphibians are considered an evolutionary link as they share characteristics with both aquatic and terrestrial animals."
      },
      {
        text: "What feature differentiates jawless fishes from jawed vertebrates?",
        options: ["Presence of gills", "Cartilaginous skeleton", "Absence of jaws", "Paired fins"],
        correct: 2,
        explanation: "Jawless fishes, such as lampreys and hagfish, lack jaws and paired fins."
      },
      {
        text: "Which structure in chordates provides axial support and flexibility?",
        options: ["Notochord", "Vertebral column", "Pharyngeal slits", "Cranium"],
        correct: 0,
        explanation: "The notochord provides axial support and flexibility, serving as the precursor to the vertebral column in vertebrates."
      },
      {
        text: "What is the function of the lateral line system in fishes?",
        options: ["Buoyancy control", "Sensory detection of water movements", "Reproduction", "Respiration"],
        correct: 1,
        explanation: "The lateral line system detects vibrations and water movements, helping fishes navigate and locate prey."
      },
      {
        text: "What structure protects the gills in bony fishes?",
        options: ["Operculum", "Swim bladder", "Gill slits", "Pharyngeal arches"],
        correct: 0,
        explanation: "The operculum is a bony plate that covers and protects the gills in bony fishes."
      },
      {
        text: "Which vertebrate class is characterized by keratinized scales?",
        options: ["Amphibia", "Aves", "Reptilia", "Mammalia"],
        correct: 2,
        explanation: "Reptiles have keratinized scales, which help reduce water loss and protect against desiccation."
      },
      {
        text: "Which adaptation in birds allows for efficient oxygen supply during flight?",
        options: ["Single-loop circulation", "Air sacs", "Lungs with alveoli", "Moist skin"],
        correct: 1,
        explanation: "Birds have air sacs that provide a continuous flow of oxygen through their lungs, ensuring efficient respiration during flight."
      },
      {
        text: "What is a unique feature of monotreme reproduction?",
        options: ["Live birth", "External fertilization", "Egg-laying", "Parthenogenesis"],
        correct: 2,
        explanation: "Monotremes, such as the platypus, are egg-laying mammals."
      },
      {
        text: "Which vertebrates exhibit a three-chambered heart?",
        options: ["Fish", "Amphibians", "Birds", "Mammals"],
        correct: 1,
        explanation: "Amphibians have a three-chambered heart, with two atria and one ventricle."
      },
      {
        text: "Which of the following groups are considered craniates?",
        options: ["Cephalochordates", "Urochordates", "Vertebrates", "Hemichordates"],
        correct: 2,
        explanation: "Vertebrates are craniates, as they possess a skull that encases the brain."
      },
      {
        text: "Which group of vertebrates was the first to evolve jaws?",
        options: ["Chondrichthyes", "Osteichthyes", "Agnatha", "Amphibia"],
        correct: 0,
        explanation: "Chondrichthyes, such as sharks, were the first vertebrates to evolve jaws."
      },
      {
        text: "Which chordate structure evolved into the thyroid gland in vertebrates?",
        options: ["Notochord", "Endostyle", "Dorsal nerve cord", "Pharyngeal slits"],
        correct: 1,
        explanation: "The endostyle, a feeding structure in primitive chordates, evolved into the thyroid gland in vertebrates."
      },
      {
        text: "Which vertebrate group includes ray-finned fishes?",
        options: ["Chondrichthyes", "Osteichthyes", "Amphibia", "Mammalia"],
        correct: 1,
        explanation: "Ray-finned fishes belong to the class Osteichthyes, the bony fishes."
      },
      {
        text: "Which organ is responsible for excretion and osmoregulation in vertebrates?",
        options: ["Liver", "Kidney", "Heart", "Stomach"],
        correct: 1,
        explanation: "The kidney is responsible for excretion and maintaining water and electrolyte balance in vertebrates."
      },
      {
        text: "Which vertebrate class is known for external fertilization?",
        options: ["Reptilia", "Amphibia", "Mammalia", "Aves"],
        correct: 1,
        explanation: "Most amphibians exhibit external fertilization, where eggs and sperm are released into water."
      },
      {
        text: "Which vertebrate group first exhibited an amniotic egg?",
        options: ["Fish", "Amphibians", "Reptiles", "Birds"],
        correct: 2,
        explanation: "Reptiles were the first vertebrates to lay amniotic eggs, enabling reproduction on land."
      },
      {
        text: "What is the function of the cloaca in amphibians and reptiles?",
        options: ["Respiration", "Excretion and reproduction", "Locomotion", "Protection"],
        correct: 1,
        explanation: "The cloaca is a common opening for excretion, reproduction, and digestion in amphibians and reptiles."
      },
      {
        text: "What feature is shared by all vertebrate embryos during development?",
        options: ["Scales", "Pharyngeal slits", "Paired appendages", "Exoskeleton"],
        correct: 1,
        explanation: "All vertebrate embryos possess pharyngeal slits at some stage of development."
      },
      {
        text: "What is the primary function of the vertebral column?",
        options: ["Locomotion", "Respiration", "Protection of the spinal cord", "Nutrient storage"],
        correct: 2,
        explanation: "The vertebral column protects the spinal cord and provides structural support."
      },
      {
        text: "Which of the following vertebrates is ectothermic?",
        options: ["Birds", "Mammals", "Reptiles", "None of the above"],
        correct: 2,
        explanation: "Reptiles are ectothermic, meaning their body temperature is regulated by external conditions."
      },
      {
        text: "Which vertebrate group includes lungfish?",
        options: ["Chondrichthyes", "Amphibia", "Sarcopterygii", "Aves"],
        correct: 2,
        explanation: "Lungfish belong to the class Sarcopterygii, the lobe-finned fishes."
      },
      {
        text: "Which vertebrates exhibit placental development?",
        options: ["Monotremes", "Reptiles", "Marsupials", "Eutherians"],
        correct: 3,
        explanation: "Eutherians, or placental mammals, exhibit placental development where the embryo is nourished in the uterus."
      },
      {
        text: "Which vertebrate class lacks a true stomach?",
        options: ["Osteichthyes", "Chondrichthyes", "Amphibia", "Agnatha"],
        correct: 3,
        explanation: "Agnatha, or jawless fishes, lack a true stomach and rely on direct absorption of nutrients."
      },
      {
        text: "What structure facilitates oxygen uptake in amphibian larvae?",
        options: ["Lungs", "Gills", "Skin", "Pharyngeal arches"],
        correct: 1,
        explanation: "Amphibian larvae, such as tadpoles, rely on gills for oxygen uptake in aquatic environments."
      }, 
{   text: "Which of the following is a defining feature of Phylum Chordata?",
        options: ["Notochord", "Open circulatory system", "Segmented body", "Exoskeleton"],
        correct: 0,
        explanation: "Chordates are characterized by the presence of a notochord, a flexible rod-like structure found during some stage of their life."
      },
      {
        text: "What structure in chordates develops into the spinal cord in vertebrates?",
        options: ["Notochord", "Pharyngeal slits", "Dorsal hollow nerve cord", "Gill arches"],
        correct: 2,
        explanation: "The dorsal hollow nerve cord in chordates develops into the spinal cord and brain in vertebrates."
      },
      {
        text: "Which of the following is a subphylum of Chordata?",
        options: ["Arthropoda", "Urochordata", "Echinodermata", "Cnidaria"],
        correct: 1,
        explanation: "The subphylum Urochordata includes tunicates, which are marine chordates."
      },
      {
        text: "Which subphylum of Chordata includes vertebrates?",
        options: ["Urochordata", "Cephalochordata", "Vertebrata", "Hemichordata"],
        correct: 2,
        explanation: "The subphylum Vertebrata includes chordates with a backbone or vertebral column."
      },
      {
        text: "Which feature is common to all chordates during their life cycle?",
        options: ["Scales", "Notochord", "Paired appendages", "Exoskeleton"],
        correct: 1,
        explanation: "All chordates possess a notochord at some stage in their life cycle."
      },
      {
        text: "Which chordate group retains the notochord throughout life?",
        options: ["Urochordata", "Cephalochordata", "Vertebrata", "Amphibia"],
        correct: 1,
        explanation: "In cephalochordates, such as lancelets, the notochord is retained throughout life."
      },
      {
        text: "What is the function of pharyngeal slits in primitive chordates?",
        options: ["Gas exchange", "Reproduction", "Support", "Locomotion"],
        correct: 0,
        explanation: "In primitive chordates, pharyngeal slits are used for gas exchange and sometimes feeding."
      },
      {
        text: "Which of the following animals belongs to the subphylum Cephalochordata?",
        options: ["Lancelet", "Frog", "Shark", "Tunicate"],
        correct: 0,
        explanation: "Lancelets, or amphioxus, belong to the subphylum Cephalochordata."
      },
      {
        text: "What structure protects the brain in vertebrates?",
        options: ["Notochord", "Cranium", "Dorsal nerve cord", "Pharyngeal slits"],
        correct: 1,
        explanation: "The cranium, or skull, protects the brain in vertebrates."
      },
      {
        text: "Which vertebrate class is characterized by the presence of feathers?",
        options: ["Mammalia", "Reptilia", "Aves", "Amphibia"],
        correct: 2,
        explanation: "Birds, classified under Aves, are characterized by the presence of feathers."
      },
      {
        text: "Which vertebrate group is known for laying amniotic eggs?",
        options: ["Fish", "Amphibians", "Reptiles", "Lancelets"],
        correct: 2,
        explanation: "Reptiles lay amniotic eggs, which have protective membranes allowing development on land."
      },
      {
        text: "What distinguishes vertebrates from invertebrate chordates?",
        options: ["Presence of a dorsal nerve cord", "Presence of a notochord", "Presence of a vertebral column", "Presence of gills"],
        correct: 2,
        explanation: "Vertebrates have a vertebral column that replaces the notochord in adults."
      },
      {
        text: "What is a unique feature of the class Mammalia?",
        options: ["Scales", "Ectothermy", "Hair or fur", "Amniotic eggs"],
        correct: 2,
        explanation: "Mammals are characterized by the presence of hair or fur and mammary glands for milk production."
      },
      {
        text: "Which vertebrate class has a cartilaginous skeleton?",
        options: ["Osteichthyes", "Chondrichthyes", "Aves", "Amphibia"],
        correct: 1,
        explanation: "Chondrichthyes, such as sharks and rays, have a skeleton made of cartilage instead of bone."
      },
      {
        text: "Which vertebrates are known for their ability to live both on land and in water?",
        options: ["Reptiles", "Amphibians", "Birds", "Mammals"],
        correct: 1,
        explanation: "Amphibians, such as frogs and salamanders, can live both on land and in water."
      },
      {
        text: "Which subphylum of chordates is entirely marine?",
        options: ["Urochordata", "Cephalochordata", "Vertebrata", "Mammalia"],
        correct: 0,
        explanation: "Urochordata, or tunicates, are exclusively marine animals."
      },
      {
        text: "Which vertebrate class is characterized by endothermy and the presence of a diaphragm?",
        options: ["Amphibia", "Reptilia", "Mammalia", "Aves"],
        correct: 2,
        explanation: "Mammals are endothermic and possess a diaphragm for efficient respiration."
      },
      {
        text: "Which chordate structure evolves into the jaw in vertebrates?",
        options: ["Pharyngeal arches", "Notochord", "Dorsal nerve cord", "Cranium"],
        correct: 0,
        explanation: "The pharyngeal arches in primitive chordates evolve into jaws and other facial structures in vertebrates."
      },
      {
        text: "What is the primary function of the notochord in early chordates?",
        options: ["Protection", "Support", "Respiration", "Reproduction"],
        correct: 1,
        explanation: "The notochord provides structural support and serves as an attachment point for muscles."
      },
      {
        text: "Which vertebrate class includes the largest number of species?",
        options: ["Mammalia", "Aves", "Osteichthyes", "Amphibia"],
        correct: 2,
        explanation: "Osteichthyes, or bony fishes, represent the largest vertebrate class in terms of species diversity."
      },
      {
        text: "What feature distinguishes cartilaginous fishes from bony fishes?",
        options: ["Endoskeleton", "Gills", "Cartilage skeleton", "Fins"],
        correct: 2,
        explanation: "Cartilaginous fishes, such as sharks, have skeletons made of cartilage, unlike bony fishes."
      },
      {
        text: "Which vertebrate group exhibits the highest degree of parental care?",
        options: ["Reptiles", "Amphibians", "Birds", "Fish"],
        correct: 2,
        explanation: "Birds exhibit advanced parental care, including incubation and feeding their young."
      },
      {
        text: "Which class of vertebrates includes monotremes, marsupials, and placental mammals?",
        options: ["Reptilia", "Aves", "Mammalia", "Amphibia"],
        correct: 2,
        explanation: "The class Mammalia includes monotremes (egg-laying), marsupials, and placental mammals."
      },
      {
        text: "What is a distinguishing feature of amphibians compared to reptiles?",
        options: ["Amniotic eggs", "Metamorphosis", "Dry skin", "Internal fertilization"],
        correct: 1,
        explanation: "Amphibians undergo metamorphosis, transitioning from an aquatic larval stage to a terrestrial adult."
      },
      {
        text: "Which structure allows tunicates to filter feed?",
        options: ["Pharyngeal basket", "Cranium", "Notochord", "Fins"],
        correct: 0,
        explanation: "Tunicates use their pharyngeal basket to filter food particles from water."
      },
      {
        text: "Which vertebrate group is characterized by hollow bones and adaptations for flight?",
        options: ["Mammals", "Reptiles", "Aves", "Amphibians"],
        correct: 2,
        explanation: "Birds (Aves) have hollow bones and other adaptations for flight."
      },
      {
        text: "Which feature distinguishes reptiles from amphibians?",
        options: ["Dry, scaly skin", "Lack of jaws", "Aquatic reproduction", "Gills in adults"],
        correct: 0,
        explanation: "Reptiles have dry, scaly skin, which prevents water loss and allows them to live in arid environments."
      },
      {
        text: "Which chordate subphylum is considered the closest relative to vertebrates?",
        options: ["Cephalochordata", "Urochordata", "Hemichordata", "Arthropoda"],
        correct: 1,
        explanation: "Urochordates are considered the closest relatives of vertebrates based on molecular and developmental evidence."
      },
      {
        text: "What is a distinguishing feature of the vertebrate circulatory system?",
        options: ["Open system", "Multiple hearts", "Closed system with a heart", "Blood sinuses"],
        correct: 2,
        explanation: "Vertebrates have a closed circulatory system with a heart that pumps blood through vessels."
      },
      {
        text: "Which vertebrates are ectothermic and rely on environmental heat for body temperature regulation?",
        options: ["Mammals", "Birds", "Reptiles", "Amphibians"],
        correct: 2,
        explanation: "Reptiles are ectothermic, relying on external heat sources to regulate body temperature."
      }, 
      {
        text: "What is the role of the gray crescent in amphibian development?",
        options: ["Defines the dorsal side", "Provides nutrients", "Prevents polyspermy", "Forms the blastocoel"],
        correct: 0,
        explanation: "The gray crescent in amphibians marks the future dorsal side and plays a critical role in axis formation."
      },
      {
        text: "Which process is responsible for the formation of the germ layers in the embryo?",
        options: ["Cleavage", "Gastrulation", "Oogenesis", "Fertilization"],
        correct: 1,
        explanation: "Gastrulation reorganizes the blastula to form three germ layers: ectoderm, mesoderm, and endoderm."
      },
      {
        text: "What is the significance of maternal mRNA during early cleavage?",
        options: ["Drives early development", "Synthesizes yolk", "Prevents polyspermy", "Promotes gastrulation"],
        correct: 0,
        explanation: "Maternal mRNA stored in the egg directs protein synthesis necessary for early embryonic development."
      },
      {
        text: "Which germ layer forms the nervous system?",
        options: ["Ectoderm", "Mesoderm", "Endoderm", "Blastoderm"],
        correct: 0,
        explanation: "The ectoderm gives rise to the nervous system, including the brain and spinal cord."
      },
      {
        text: "What is the blastopore's fate in deuterostomes?",
        options: ["Becomes the mouth", "Becomes the anus", "Forms the notochord", "Disappears during development"],
        correct: 1,
        explanation: "In deuterostomes, the blastopore develops into the anus, while the mouth forms later."
      },
      {
        text: "Which structure regulates sperm entry into the oocyte?",
        options: ["Zona pellucida", "Corona radiata", "Cortical granules", "Blastodisc"],
        correct: 0,
        explanation: "The zona pellucida facilitates sperm binding and regulates entry, preventing polyspermy."
      },
      {
        text: "What is a morula in embryonic development?",
        options: ["A hollow ball of cells", "A solid ball of cells", "A fertilized zygote", "A germ layer"],
        correct: 1,
        explanation: "The morula is a solid ball of cells formed after several cleavage divisions of the zygote."
      },
      {
        text: "What happens to the polar bodies produced during oogenesis?",
        options: ["They develop into blastomeres", "They degenerate", "They fuse with sperm", "They become yolk sacs"],
        correct: 1,
        explanation: "Polar bodies are non-functional byproducts of meiosis and eventually degenerate."
      },
      {
        text: "Which cleavage pattern is characterized by cells dividing at an angle?",
        options: ["Spiral cleavage", "Radial cleavage", "Holoblastic cleavage", "Superficial cleavage"],
        correct: 0,
        explanation: "Spiral cleavage involves oblique divisions, common in protostomes like mollusks."
      },
      {
        text: "What determines the polarity of an egg?",
        options: ["Yolk distribution", "Maternal mRNA", "Zona pellucida", "Blastomere position"],
        correct: 0,
        explanation: "The distribution of yolk within the egg establishes polarity, defining animal and vegetal poles."
      },
      {
        text: "What is the function of the fertilization membrane?",
        options: ["Prevents polyspermy", "Initiates cleavage", "Stores yolk", "Stimulates gastrulation"],
        correct: 0,
        explanation: "The fertilization membrane forms after sperm entry to block additional sperm, ensuring monospermy."
      },
      {
        text: "Which embryonic structure becomes the placenta in mammals?",
        options: ["Trophoblast", "Blastocoel", "Inner cell mass", "Morula"],
        correct: 0,
        explanation: "The trophoblast contributes to the formation of the placenta, supporting embryo development."
      },
      {
        text: "What type of cleavage occurs in fish embryos?",
        options: ["Discoidal cleavage", "Radial cleavage", "Holoblastic cleavage", "Superficial cleavage"],
        correct: 0,
        explanation: "Fish embryos exhibit discoidal cleavage due to the high yolk content restricting division to the animal pole."
      },
      {
        text: "Which stage of cleavage results in a hollow ball of cells?",
        options: ["Blastula", "Morula", "Gastrula", "Zygote"],
        correct: 0,
        explanation: "The blastula stage forms a hollow ball of cells with a fluid-filled cavity called the blastocoel."
      },
      {
        text: "Which germ layer forms the skeletal system?",
        options: ["Ectoderm", "Mesoderm", "Endoderm", "Trophoblast"],
        correct: 1,
        explanation: "The mesoderm develops into the skeletal system, muscles, and other connective tissues."
      },
      {
        text: "What triggers the cortical reaction during fertilization?",
        options: ["Sperm entry", "Zygote formation", "Cleavage initiation", "Blastula formation"],
        correct: 0,
        explanation: "Sperm entry triggers the cortical reaction, releasing enzymes that prevent polyspermy."
      },
      {
        text: "Which type of eggs exhibit superficial cleavage?",
        options: ["Isolecithal eggs", "Telolecithal eggs", "Centrolecithal eggs", "Mesolecithal eggs"],
        correct: 2,
        explanation: "Superficial cleavage occurs in centrolecithal eggs, typical of insects, with cleavage restricted to the periphery."
      },
      {
        text: "What is the primary function of the zona pellucida?",
        options: ["Promotes cleavage", "Protects the oocyte", "Guides gastrulation", "Stores nutrients"],
        correct: 1,
        explanation: "The zona pellucida protects the oocyte and mediates sperm binding during fertilization."
      },
      {
        text: "Which type of symmetry is established during the early cleavage stages?",
        options: ["Radial symmetry", "Bilateral symmetry", "Asymmetry", "Triradial symmetry"],
        correct: 1,
        explanation: "Bilateral symmetry is often established during early cleavage, as seen in many vertebrates."
      },
      {
        text: "Which term describes a large yolked egg with restricted cleavage?",
        options: ["Isolecithal", "Mesolecithal", "Telolecithal", "Centrolecithal"],
        correct: 2,
        explanation: "Telolecithal eggs contain large yolk reserves that limit cleavage to specific regions, such as the animal pole."
      },
      {
        text: "What is the significance of the animal pole in embryogenesis?",
        options: ["Contains the yolk", "Facilitates fertilization", "Leads cell divisions", "Guides gastrulation"],
        correct: 2,
        explanation: "The animal pole is the site of active cell division, contrasting with the yolk-rich vegetal pole."
      },
      {
        text: "Which layer of the blastocyst develops into the embryo in mammals?",
        options: ["Trophoblast", "Inner cell mass", "Blastocoel", "Zona pellucida"],
        correct: 1,
        explanation: "The inner cell mass of the blastocyst differentiates into the embryo, while the trophoblast forms supporting structures."
      },
      {
        text: "Which cleavage pattern is characteristic of sea urchins?",
        options: ["Radial cleavage", "Spiral cleavage", "Discoidal cleavage", "Superficial cleavage"],
        correct: 0,
        explanation: "Sea urchins exhibit radial cleavage, a feature of deuterostomes like echinoderms."
      },
      {
        text: "What is the primary outcome of meiosis during oogenesis?",
        options: ["Four haploid ova", "One haploid ovum and polar bodies", "Two diploid ova", "One diploid ovum"],
        correct: 1,
        explanation: "Meiosis during oogenesis produces one functional haploid ovum and three polar bodies."
      },
      {
        text: "Which process establishes the body axes during embryonic development?",
        options: ["Fertilization", "Cleavage", "Gastrulation", "Neurulation"],
        correct: 2,
        explanation: "Gastrulation establishes the primary body axes, laying the groundwork for subsequent organogenesis."
      },
      {
        text: "Which embryonic structure contains the first cavity formed during development?",
        options: ["Blastocoel", "Archenteron", "Morula", "Blastoderm"],
        correct: 0,
        explanation: "The blastocoel is the first cavity to form, appearing during the blastula stage of embryonic development."
      },
      {
        text: "What role does yolk play in cleavage patterns?",
        options: ["Defines cell size", "Inhibits cleavage", "Determines cleavage speed", "All of the above"],
        correct: 3,
        explanation: "Yolk affects cleavage by influencing cell size, division speed, and cleavage patterns."
      },
      {
        text: "Which process follows cleavage during embryonic development?",
        options: ["Fertilization", "Gastrulation", "Oogenesis", "Neurulation"],
        correct: 1,
        explanation: "Gastrulation follows cleavage, transforming the blastula into a multilayered embryo."
      },
      {
        text: "What is the primary function of oocytes arresting in metaphase II?",
        options: ["Preventing polyspermy", "Synchronizing fertilization", "Awaiting fertilization", "Guiding cleavage"],
        correct: 2,
        explanation: "Oocytes arrest in metaphase II to await fertilization, ensuring meiosis resumes only when sperm binds."
      }, 
  
      {
        text: "What is the term for the hierarchical organization of animal structures from simple to complex?",
        options: ["Cellular level", "Tissue level", "Organ system level", "All of the above"],
        correct: 3,
        explanation: "Animal complexity progresses from the cellular level to tissues, organs, and organ systems, representing increasing specialization."
      },
      {
        text: "Which type of cleavage results in cells that can individually develop into a complete organism?",
        options: ["Radial cleavage", "Spiral cleavage", "Holoblastic cleavage", "Indeterminate cleavage"],
        correct: 3,
        explanation: "Indeterminate cleavage produces cells capable of forming a complete organism due to their totipotency."
      },
      {
        text: "What is the primary function of oogenesis?",
        options: ["Production of somatic cells", "Production of gametes", "Formation of the blastula", "Cleavage regulation"],
        correct: 1,
        explanation: "Oogenesis is the process by which gametes (ova or eggs) are produced in females."
      },
      {
        text: "In which animal group does spiral cleavage commonly occur?",
        options: ["Echinoderms", "Mollusks", "Chordates", "Cnidarians"],
        correct: 1,
        explanation: "Spiral cleavage is characteristic of mollusks and some other protostomes, distinguishing them from deuterostomes like echinoderms."
      },
      {
        text: "Which of the following terms describes the unequal distribution of yolk in an egg?",
        options: ["Isolecithal", "Mesolecithal", "Telolecithal", "Centrolecithal"],
        correct: 2,
        explanation: "Telolecithal eggs have a large amount of yolk concentrated at one pole, creating an unequal distribution."
      },
      {
        text: "What type of cleavage occurs in eggs with moderate yolk content?",
        options: ["Holoblastic cleavage", "Meroblastic cleavage", "Spiral cleavage", "Radial cleavage"],
        correct: 0,
        explanation: "Holoblastic cleavage occurs in eggs with moderate yolk, such as amphibian eggs, allowing complete division of the zygote."
      },
      {
        text: "What is the primary outcome of the cleavage process during early embryonic development?",
        options: ["Formation of gametes", "Increase in cell size", "Formation of a multicellular blastula", "Growth of the embryo"],
        correct: 2,
        explanation: "Cleavage transforms the single-celled zygote into a multicellular blastula without increasing overall size."
      },
      {
        text: "Which type of cleavage is associated with echinoderms and chordates?",
        options: ["Radial cleavage", "Spiral cleavage", "Holoblastic cleavage", "Meroblastic cleavage"],
        correct: 0,
        explanation: "Radial cleavage, common in echinoderms and chordates, is characterized by cells dividing parallel or perpendicular to the embryo's axis."
      },
      {
        text: "Which of the following is NOT a stage of oogenesis?",
        options: ["Multiplication phase", "Growth phase", "Maturation phase", "Cleavage phase"],
        correct: 3,
        explanation: "Oogenesis consists of multiplication, growth, and maturation phases; cleavage occurs post-fertilization."
      },
      {
        text: "Which cleavage type is typical of bird and reptile embryos?",
        options: ["Radial cleavage", "Discoidal cleavage", "Spiral cleavage", "Superficial cleavage"],
        correct: 1,
        explanation: "Bird and reptile embryos exhibit discoidal cleavage due to the large yolk, restricting division to a small disc at the animal pole."
      },
      {
        text: "What role does yolk play in embryonic development?",
        options: ["Provides nutrients", "Triggers cleavage", "Defines symmetry", "Regulates mitosis"],
        correct: 0,
        explanation: "Yolk serves as the primary source of nutrients for the developing embryo until external feeding is established."
      },
      {
        text: "What type of cleavage is observed in centrolecithal eggs of insects?",
        options: ["Discoidal cleavage", "Superficial cleavage", "Radial cleavage", "Spiral cleavage"],
        correct: 1,
        explanation: "Superficial cleavage occurs in centrolecithal eggs where division happens around the periphery of the yolk."
      },
      {
        text: "Which phase of oogenesis involves the accumulation of ribosomes and mitochondria in the oocyte?",
        options: ["Multiplication phase", "Growth phase", "Maturation phase", "Cleavage phase"],
        correct: 1,
        explanation: "The growth phase prepares the oocyte for fertilization by accumulating organelles and resources like ribosomes and mitochondria."
      },
      {
        text: "What is the function of polar bodies in oogenesis?",
        options: ["Supply nutrients", "Eliminate excess chromosomes", "Form blastomeres", "Aid in cleavage"],
        correct: 1,
        explanation: "Polar bodies form during meiosis in oogenesis to discard extra chromosomes, ensuring a haploid ovum."
      },
      {
        text: "Which group of animals typically exhibits mesolecithal eggs?",
        options: ["Amphibians", "Mammals", "Birds", "Insects"],
        correct: 0,
        explanation: "Amphibians produce mesolecithal eggs with moderate yolk, leading to uneven cleavage patterns."
      },
      {
        text: "What is the primary factor determining cleavage patterns in animals?",
        options: ["Egg size", "Yolk amount and distribution", "Cell shape", "Embryonic genome activation"],
        correct: 1,
        explanation: "Cleavage patterns are influenced by the amount and distribution of yolk within the egg."
      },
      {
        text: "Which of the following describes a holoblastic cleavage pattern?",
        options: ["Partial cleavage", "Complete cleavage", "Yolk-free cleavage", "Peripheral cleavage"],
        correct: 1,
        explanation: "Holoblastic cleavage involves complete division of the egg, typical of isolecithal or moderately yolked eggs."
      },
      {
        text: "What structure forms at the end of cleavage during embryonic development?",
        options: ["Morula", "Blastula", "Gastrula", "Zygote"],
        correct: 1,
        explanation: "Cleavage results in a blastula, a hollow sphere of cells ready for gastrulation."
      },
      {
        text: "Which of the following is a characteristic feature of discoidal cleavage?",
        options: ["Cleavage confined to one region", "Complete division of the egg", "Cleavage around yolk", "Asynchronous cleavage"],
        correct: 0,
        explanation: "Discoidal cleavage occurs in large yolked eggs, where cell division is limited to a small disc at the animal pole."
      },
      {
        text: "What is the significance of the zona pellucida in fertilization?",
        options: ["Prevents multiple sperm entry", "Provides nutrients", "Supports mitosis", "Initiates cleavage"],
        correct: 0,
        explanation: "The zona pellucida prevents polyspermy by blocking additional sperm after the first fertilization event."
      },
      {
        text: "Which layer of the blastula is involved in forming the digestive tract during gastrulation?",
        options: ["Ectoderm", "Mesoderm", "Endoderm", "Trophoblast"],
        correct: 2,
        explanation: "The endoderm develops into the digestive and respiratory systems during gastrulation."
      },
      {
        text: "What is the importance of vegetal pole yolk in embryogenesis?",
        options: ["Prevents cleavage", "Provides nutrients", "Triggers gastrulation", "Forms neural tissues"],
        correct: 1,
        explanation: "The yolk concentrated at the vegetal pole provides essential nutrients for embryonic development."
      },
      {
        text: "Which phase of oogenesis includes arrest in metaphase II until fertilization?",
        options: ["Multiplication phase", "Growth phase", "Maturation phase", "Cleavage phase"],
        correct: 2,
        explanation: "The oocyte arrests in metaphase II of meiosis during maturation, resuming only upon fertilization."
      },
      {
        text: "What type of symmetry is commonly observed in zygotes with radial cleavage?",
        options: ["Radial symmetry", "Bilateral symmetry", "Asymmetry", "Spiral symmetry"],
        correct: 0,
        explanation: "Radial cleavage in zygotes typically leads to radial symmetry, as seen in echinoderms."
      },
      {
        text: "Which cells form the blastocoel in the blastula?",
        options: ["Outer cells", "Inner cells", "Polar bodies", "Yolk cells"],
        correct: 1,
        explanation: "Inner cells of the blastula form the blastocoel, a fluid-filled cavity essential for gastrulation."
      }, 
    {
        text: "What is the term for the hierarchical organization of animal structures from simple to complex?",
        options: ["Cellular level", "Tissue level", "Organ system level", "All of the above"],
        correct: 3,
        explanation: "Animal complexity progresses from the cellular level to tissues, organs, and organ systems, representing increasing specialization."
      },
      {
        text: "Which type of cleavage results in cells that can individually develop into a complete organism?",
        options: ["Radial cleavage", "Spiral cleavage", "Holoblastic cleavage", "Indeterminate cleavage"],
        correct: 3,
        explanation: "Indeterminate cleavage produces cells capable of forming a complete organism due to their totipotency."
      },
      {
        text: "What is the primary function of oogenesis?",
        options: ["Production of somatic cells", "Production of gametes", "Formation of the blastula", "Cleavage regulation"],
        correct: 1,
        explanation: "Oogenesis is the process by which gametes (ova or eggs) are produced in females."
      },
      {
        text: "In which animal group does spiral cleavage commonly occur?",
        options: ["Echinoderms", "Mollusks", "Chordates", "Cnidarians"],
        correct: 1,
        explanation: "Spiral cleavage is characteristic of mollusks and some other protostomes, distinguishing them from deuterostomes like echinoderms."
      },
      {
        text: "Which of the following terms describes the unequal distribution of yolk in an egg?",
        options: ["Isolecithal", "Mesolecithal", "Telolecithal", "Centrolecithal"],
        correct: 2,
        explanation: "Telolecithal eggs have a large amount of yolk concentrated at one pole, creating an unequal distribution."
      },
      {
        text: "What type of cleavage occurs in eggs with moderate yolk content?",
        options: ["Holoblastic cleavage", "Meroblastic cleavage", "Spiral cleavage", "Radial cleavage"],
        correct: 0,
        explanation: "Holoblastic cleavage occurs in eggs with moderate yolk, such as amphibian eggs, allowing complete division of the zygote."
      },
      {
        text: "What is the primary outcome of the cleavage process during early embryonic development?",
        options: ["Formation of gametes", "Increase in cell size", "Formation of a multicellular blastula", "Growth of the embryo"],
        correct: 2,
        explanation: "Cleavage transforms the single-celled zygote into a multicellular blastula without increasing overall size."
      },
      {
        text: "Which type of cleavage is associated with echinoderms and chordates?",
        options: ["Radial cleavage", "Spiral cleavage", "Holoblastic cleavage", "Meroblastic cleavage"],
        correct: 0,
        explanation: "Radial cleavage, common in echinoderms and chordates, is characterized by cells dividing parallel or perpendicular to the embryo's axis."
      },
      {
        text: "Which of the following is NOT a stage of oogenesis?",
        options: ["Multiplication phase", "Growth phase", "Maturation phase", "Cleavage phase"],
        correct: 3,
        explanation: "Oogenesis consists of multiplication, growth, and maturation phases; cleavage occurs post-fertilization."
      },
      {
        text: "Which cleavage type is typical of bird and reptile embryos?",
        options: ["Radial cleavage", "Discoidal cleavage", "Spiral cleavage", "Superficial cleavage"],
        correct: 1,
        explanation: "Bird and reptile embryos exhibit discoidal cleavage due to the large yolk, restricting division to a small disc at the animal pole."
      },
      {
        text: "What role does yolk play in embryonic development?",
        options: ["Provides nutrients", "Triggers cleavage", "Defines symmetry", "Regulates mitosis"],
        correct: 0,
        explanation: "Yolk serves as the primary source of nutrients for the developing embryo until external feeding is established."
      },
      {
        text: "What type of cleavage is observed in centrolecithal eggs of insects?",
        options: ["Discoidal cleavage", "Superficial cleavage", "Radial cleavage", "Spiral cleavage"],
        correct: 1,
        explanation: "Superficial cleavage occurs in centrolecithal eggs where division happens around the periphery of the yolk."
      },
      {
        text: "Which phase of oogenesis involves the accumulation of ribosomes and mitochondria in the oocyte?",
        options: ["Multiplication phase", "Growth phase", "Maturation phase", "Cleavage phase"],
        correct: 1,
        explanation: "The growth phase prepares the oocyte for fertilization by accumulating organelles and resources like ribosomes and mitochondria."
      },
      {
        text: "What is the function of polar bodies in oogenesis?",
        options: ["Supply nutrients", "Eliminate excess chromosomes", "Form blastomeres", "Aid in cleavage"],
        correct: 1,
        explanation: "Polar bodies form during meiosis in oogenesis to discard extra chromosomes, ensuring a haploid ovum."
      },
      {
        text: "Which group of animals typically exhibits mesolecithal eggs?",
        options: ["Amphibians", "Mammals", "Birds", "Insects"],
        correct: 0,
        explanation: "Amphibians produce mesolecithal eggs with moderate yolk, leading to uneven cleavage patterns."
      },
      {
        text: "What is the primary factor determining cleavage patterns in animals?",
        options: ["Egg size", "Yolk amount and distribution", "Cell shape", "Embryonic genome activation"],
        correct: 1,
        explanation: "Cleavage patterns are influenced by the amount and distribution of yolk within the egg."
      },
      {
        text: "Which of the following describes a holoblastic cleavage pattern?",
        options: ["Partial cleavage", "Complete cleavage", "Yolk-free cleavage", "Peripheral cleavage"],
        correct: 1,
        explanation: "Holoblastic cleavage involves complete division of the egg, typical of isolecithal or moderately yolked eggs."
      },
      {
        text: "What structure forms at the end of cleavage during embryonic development?",
        options: ["Morula", "Blastula", "Gastrula", "Zygote"],
        correct: 1,
        explanation: "Cleavage results in a blastula, a hollow sphere of cells ready for gastrulation."
      },
      {
        text: "Which of the following is a characteristic feature of discoidal cleavage?",
        options: ["Cleavage confined to one region", "Complete division of the egg", "Cleavage around yolk", "Asynchronous cleavage"],
        correct: 0,
        explanation: "Discoidal cleavage occurs in large yolked eggs, where cell division is limited to a small disc at the animal pole."
      },
      {
        text: "What is the significance of the zona pellucida in fertilization?",
        options: ["Prevents multiple sperm entry", "Provides nutrients", "Supports mitosis", "Initiates cleavage"],
        correct: 0,
        explanation: "The zona pellucida prevents polyspermy by blocking additional sperm after the first fertilization event."
      }, 
        ],
      },

    "BIO301-SET1": {
      title: "Advanced Concepts in Genetics",
      questions: [
        {
          text: "What is the role of the promoter region in gene expression?",
          options: [
            "It codes for the protein structure",
            "It serves as a binding site for RNA polymerase",
            "It terminates transcription",
            "It splices introns"
          ],
          correct: 1,
          explanation: "The promoter region is a DNA sequence that serves as the binding site for RNA polymerase and transcription factors, initiating transcription."
        },
        {
          text: "Which of the following is a characteristic of autosomal recessive inheritance?",
          options: [
            "Affected individuals always have affected parents",
            "Males are more commonly affected",
            "The trait skips generations and is expressed only in homozygotes",
            "The trait is transmitted exclusively through maternal lines"
          ],
          correct: 2,
          explanation: "Autosomal recessive inheritance requires an individual to inherit two copies of the mutant allele (one from each parent) for the trait to be expressed."
        },
        {
          text: "What is the difference between exons and introns in a eukaryotic gene?",
          options: [
            "Exons are transcribed but not translated, while introns are translated into protein",
            "Exons code for proteins, while introns are non-coding sequences spliced out during mRNA processing",
            "Introns code for functional RNA, while exons are non-functional",
            "Exons are part of prokaryotic genes, while introns are unique to eukaryotic genes"
          ],
          correct: 1,
          explanation: "Exons are coding regions that are translated into protein, while introns are non-coding regions removed during RNA splicing."
        },
        {
          text: "What is the main difference between transcription in prokaryotes and eukaryotes?",
          options: [
            "Prokaryotes do not require RNA polymerase for transcription",
            "Transcription in prokaryotes occurs in the cytoplasm, while in eukaryotes it occurs in the nucleus",
            "Prokaryotes do not have introns, while eukaryotic genes often contain introns",
            "Both B and C"
          ],
          correct: 3,
          explanation: "In prokaryotes, transcription occurs in the cytoplasm as they lack a nucleus, and their genes typically lack introns. In contrast, eukaryotes perform transcription in the nucleus and have introns in their genes."
        },
        {
          text: "What is the purpose of a test cross in genetics?",
          options: [
            "To determine the mutation rate in a population",
            "To assess the genotype of an individual with a dominant phenotype",
            "To increase genetic variation",
            "To identify linkage between two genes"
          ],
          correct: 1,
          explanation: "A test cross is performed to determine the genotype of an individual with a dominant phenotype by crossing it with a homozygous recessive individual."
        }, 
        // Add more Genetics questions here...
      ]
    }
  },
  Animal_Systematics: {
    "BIO201-SET1": {
      title: "Fundamentals of Animal Systematics",
      questions: [
        {
          text: "What is the primary goal of animal systematics?",
          options: [
            "To study animal habitats",
            "To classify and organize animals based on evolutionary relationships",
            "To monitor animal populations",
            "To conserve endangered species"
          ],
          correct: 1,
          explanation: "The primary goal of animal systematics is to classify and organize animals based on their evolutionary relationships, helping to understand biodiversity and the tree of life."
        },
        {
          text: "Which of the following is not a hierarchical taxonomic rank?",
          options: ["Phylum", "Order", "Family", "Ecosystem"],
          correct: 3,
          explanation: "Ecosystem is not a taxonomic rank; it refers to a community of interacting organisms and their physical environment."
        },
        {
          text: "Who is known as the 'Father of Taxonomy'?",
          options: ["Charles Darwin", "Carolus Linnaeus", "Aristotle", "Gregor Mendel"],
          correct: 1,
          explanation: "Carolus Linnaeus is known as the 'Father of Taxonomy' for developing the binomial nomenclature system."
        },
        {
          text: "What does the binomial nomenclature consist of?",
          options: ["Family and Order", "Genus and Species", "Class and Phylum", "Kingdom and Domain"],
          correct: 1,
          explanation: "Binomial nomenclature assigns a species a two-part name consisting of its genus and species."
        },
        {
          text: "Which term refers to the evolutionary history of a species?",
          options: ["Taxonomy", "Phylogeny", "Ecology", "Morphology"],
          correct: 1,
          explanation: "Phylogeny refers to the evolutionary history and relationships of a species or group of species."
        }, 
        // Add more Animal Systematics questions here...
      ]
    }
  }, 

    Chemistry: {
    "Chm101-pap": {
      title: "Introductory Chemistry 1",
      questions: [
        {
          text: "What is the primary goal of animal systematics?",
          options: [
            "To study animal habitats",
            "To classify and organize animals based on evolutionary relationships",
            "To monitor animal populations",
            "To conserve endangered species"
          ],
          correct: 1,
          explanation: "The primary goal of animal systematics is to classify and organize animals based on their evolutionary relationships, helping to understand biodiversity and the tree of life."
        },
        {
          text: "Which of the following is not a hierarchical taxonomic rank?",
          options: ["Phylum", "Order", "Family", "Ecosystem"],
          correct: 3,
          explanation: "Ecosystem is not a taxonomic rank; it refers to a community of interacting organisms and their physical environment."
        },
        {
          text: "Who is known as the 'Father of Taxonomy'?",
          options: ["Charles Darwin", "Carolus Linnaeus", "Aristotle", "Gregor Mendel"],
          correct: 1,
          explanation: "Carolus Linnaeus is known as the 'Father of Taxonomy' for developing the binomial nomenclature system."
        },
        {
          text: "What does the binomial nomenclature consist of?",
          options: ["Family and Order", "Genus and Species", "Class and Phylum", "Kingdom and Domain"],
          correct: 1,
          explanation: "Binomial nomenclature assigns a species a two-part name consisting of its genus and species."
        },
        {
          text: "Which term refers to the evolutionary history of a species?",
          options: ["Taxonomy", "Phylogeny", "Ecology", "Morphology"],
          correct: 1,
          explanation: "Phylogeny refers to the evolutionary history and relationships of a species or group of species."
        }, 
        ] 
    },     

    "Chm102": {
      title: "Fundamentals of Animal Systematics",
      questions: [
        {
          text: "What is the primary goal of animal systematics?",
          options: [
            "To study animal habitats",
            "To classify and organize animals based on evolutionary relationships",
            "To monitor animal populations",
            "To conserve endangered species"
          ],
          correct: 1,
          explanation: "The primary goal of animal systematics is to classify and organize animals based on their evolutionary relationships, helping to understand biodiversity and the tree of life."
        },
        {
          text: "Which of the following is not a hierarchical taxonomic rank?",
          options: ["Phylum", "Order", "Family", "Ecosystem"],
          correct: 3,
          explanation: "Ecosystem is not a taxonomic rank; it refers to a community of interacting organisms and their physical environment."
        },
        {
          text: "Who is known as the 'Father of Taxonomy'?",
          options: ["Charles Darwin", "Carolus Linnaeus", "Aristotle", "Gregor Mendel"],
          correct: 1,
          explanation: "Carolus Linnaeus is known as the 'Father of Taxonomy' for developing the binomial nomenclature system."
        },
        {
          text: "What does the binomial nomenclature consist of?",
          options: ["Family and Order", "Genus and Species", "Class and Phylum", "Kingdom and Domain"],
          correct: 1,
          explanation: "Binomial nomenclature assigns a species a two-part name consisting of its genus and species."
        },
        {
          text: "Which term refers to the evolutionary history of a species?",
          options: ["Taxonomy", "Phylogeny", "Ecology", "Morphology"],
          correct: 1,
          explanation: "Phylogeny refers to the evolutionary history and relationships of a species or group of species."
        }, 
        // Add more Animal Systematics questions here...
      ]
    }
  }, 
    
Botany: {
  "BOT202": {
        title: "Biometry/Biostatistics",
        questions: [
          { text: "What is 2 + 2?", options: ["2", "3", "4", "5"], correct: 2, explanation: "2 + 2 equals 4." },
          { text: "What is 3 x 3?", options: ["6", "9", "12", "15"], correct: 1, explanation: "3 x 3 equals 9." },
        ]
      },

    "BOT203": {
        title: "Welcome to the World of Genetics",
        questions: [
          { text: "What is 2 + 2?", options: ["2", "3", "4", "5"], correct: 2, explanation: "2 + 2 equals 4." },
          { text: "What is 3 x 3?", options: ["6", "9", "12", "15"], correct: 1, explanation: "3 x 3 equals 9." },
        ]
      },
    
  "BOT101": {
    title: "Cell Division Basics",
    questions: [
      {
        text: "A rough idea of cell division was given by:",
        options: ["Hofmeister", "Von Mohl", "Flemmings", "Weismann"],
        correct: 1,
        explanation: "Hugo von Mohl was one of the early scientists to provide insights into cell division processes."
      },
      {
        text: "Who described the cell division first?",
        options: ["Hofmeister", "Hugo Von Mohl", "Weismann", "W. Flemmings"],
        correct: 1,
        explanation: "Hugo von Mohl first described the process of cell division in plant cells."
      },
      {
        text: "Who used the word 'karyokinesis' for cell division?",
        options: ["Hugo Von Mohl", "Weismann", "W. Flemmings", "None of these"],
        correct: 2,
        explanation: "W. Flemming introduced the term 'karyokinesis' to describe nuclear division."
      },
      {
        text: "Word 'mitosis' was coined by:",
        options: ["Hofmeister", "Weismann", "W. Flemmings", "Strasburger"],
        correct: 3,
        explanation: "Eduard Strasburger coined the term 'mitosis' to describe the process of cell division."
      },
      {
        text: "Cell division in plants was described first by:",
        options: ["Strasburger", "Hofmeister", "Weismann", "None of these"],
        correct: 0,
        explanation: "Strasburger detailed cell division in plant cells."
      },
      {
        text: "Who observed first that the reproductive cells have different division than somatic cells?",
        options: ["Weismann", "Hofmeister", "Flemmings", "Sutton"],
        correct: 0,
        explanation: "August Weismann observed the distinct process of division in reproductive cells (meiosis)."
      },
      {
        text: "Sutton emphasized:",
        options: [
          "Importance of cell division in heredity",
          "That reproductive cells divide differently than somatic cells",
          "Cells come from pre-existing cells",
          "None of these"
        ],
        correct: 0,
        explanation: "Sutton correlated the behavior of chromosomes during meiosis with inheritance patterns."
      },
      {
        text: "Importance of cell division in heredity was emphasized by:",
        options: ["Sutton", "Weismann", "Flemmings", "None of these"],
        correct: 1,
        explanation: "Weismann linked cell division to the transmission of hereditary information."
      },
      {
        text: "Strasburger observed:",
        options: ["Mitosis", "Meiosis", "Cell division in plants", "None of these"],
        correct: 2,
        explanation: "Strasburger's work focused on mitosis and cell division in plants."
      },
      {
        text: "Meiosis was termed by:",
        options: [
          "J.B. Farmer and Moore",
          "Hofmeister and Flemmings",
          "Hugo Von Mohl and Strasburger",
          "None of these"
        ],
        correct: 0,
        explanation: "J.B. Farmer and Moore coined the term 'meiosis.'"
      },
      {
        text: "Cell division in eukaryotic cells involves:",
        options: ["Karyokinesis only", "Cytokinesis only", "Both (a) & (b)", "None of these"],
        correct: 2,
        explanation: "Eukaryotic cell division includes both karyokinesis (nuclear division) and cytokinesis (cytoplasmic division)."
      },
      {
        text: "Cell division in animal cells occur by:",
        options: ["Amitosis", "Mitosis", "Meiosis", "All these methods"],
        correct: 3,
        explanation: "Animal cells can divide by amitosis, mitosis, or meiosis depending on the context."
      },
      {
        text: "During amitotic cell division in animals, there is:",
        options: [
          "Only elongation of nucleus and subsequent division into two daughter cells",
          "Reduction in the number of chromosomes in the daughter cells",
          "Breaking into two nuclei",
          "None of these"
        ],
        correct: 0,
        explanation: "Amitosis is a simpler division process without chromosomal segregation."
      },
      {
        text: "Mitosis occurs only in:",
        options: ["Somatic cells", "Reproductive cells", "Both (a) & (b)", "None of these"],
        correct: 0,
        explanation: "Mitosis typically occurs in somatic cells for growth and repair."
      },
      {
        text: "Prophase in mitosis is characterized by which of these events:",
        options: [
          "Nucleus starts disappearing",
          "Chromatin material changes into chromosomes",
          "Nucleolus starts disintegrating",
          "All of these"
        ],
        correct: 3,
        explanation: "Prophase involves chromatin condensation, nuclear membrane disappearance, and nucleolus disintegration."
      },
      {
        text: "Spindle is formed during cell division by:",
        options: ["Centrioles and astral rays", "Nucleus", "Both (a) & (b)", "None of these"],
        correct: 0,
        explanation: "Spindle formation is facilitated by centrioles and astral microtubules."
      },
      {
        text: "Mitosis is a process of cell division during which there is:",
        options: [
          "Distribution of same number at the end of the process",
          "Reduction in the number of chromosomes at the end",
          "Change in chromosomal number",
          "None of these"
        ],
        correct: 0,
        explanation: "Mitosis ensures the equal distribution of chromosomes to daughter cells."
      },
      {
        text: "Mitotic cell division results in the:",
        options: [
          "Reduction in chromosomal number",
          "Increase in chromosomal number",
          "No change in chromosomal number",
          "Doubling of cell columns"
        ],
        correct: 2,
        explanation: "Mitosis maintains the chromosome number in daughter cells."
      }, 
      {
        text: "Meiosis differs from mitosis because in it:",
        options: [
          "Homologous chromosomes pair and exchange segments",
          "Chromosomal number is halved",
          "The four daughter nuclei formed are haploid",
          "All of these"
        ],
        correct: 3,
        explanation: "Meiosis is characterized by pairing of homologous chromosomes, halving of the chromosome number, and the formation of haploid daughter cells."
      },
      {
        text: "Separation of chromatids and their movement to opposite poles of the spindle occurs in which of these phases:",
        options: ["Prophase", "Metaphase", "Anaphase", "Telophase"],
        correct: 2,
        explanation: "Anaphase is marked by the separation of sister chromatids towards opposite poles."
      },
      {
        text: "How many mitotic divisions are required to make 256 daughter nuclei:",
        options: ["8", "64", "32", "16"],
        correct: 0,
        explanation: "Each mitotic division doubles the number of cells. To produce 256 nuclei, 2^8 = 256, so 8 divisions are required."
      },
      {
        text: "Which of these plays important role in cell division in animal cells:",
        options: ["Centriole", "Mitochondria", "Golgi complex", "None of these"],
        correct: 0,
        explanation: "Centrioles play a critical role in forming the spindle apparatus during mitosis."
      },
      {
        text: "Chromosomes during metaphase:",
        options: [
          "Occupy equatorial position",
          "Are not yet ready to divide",
          "Assemble at one end of spindle",
          "Occupy any place in spindle"
        ],
        correct: 0,
        explanation: "In metaphase, chromosomes align at the equatorial plate of the spindle."
      },
      {
        text: "Movement of chromosomes during anaphase is:",
        options: [
          "Dependent on association of spindle fibres with kinetochore",
          "Independent of spindle fibres",
          "Due to streaming of cytoplasm",
          "Due to excess of ATP formed in microtubules"
        ],
        correct: 0,
        explanation: "Chromosomal movement during anaphase is facilitated by the interaction of spindle fibers with the kinetochores."
      },
      {
        text: "Chromosomes are composed of:",
        options: ["DNA only", "Proteins only", "DNA + Proteins", "RNA only"],
        correct: 2,
        explanation: "Chromosomes consist of DNA molecules wrapped around proteins (mainly histones)."
      },
      {
        text: "For mitotic division the DNA is:",
        options: [
          "Left unaffected",
          "Reduced to half",
          "Replicated",
          "Reduced in chromosomal number"
        ],
        correct: 2,
        explanation: "During the S phase of interphase, DNA is replicated to ensure each daughter cell receives an identical copy."
      },
      {
        text: "Some of microtubules of spindle attaching to centromeres of chromosomes are called:",
        options: ["Chromosomal fibres", "Continuous fibres", "Interchromosomal fibres", "None of these"],
        correct: 0,
        explanation: "Chromosomal fibers connect the spindle apparatus to the centromeres of chromosomes."
      },
      {
        text: "Continuous fibres in spindle are those which connect:",
        options: [
          "One centriole with other and attached pole",
          "Centromeres of chromosomes with spindle",
          "Centrioles with spindle and also the poles",
          "None of these"
        ],
        correct: 0,
        explanation: "Continuous fibers span between the poles of the spindle and help maintain its structure."
      },
      {
        text: "Some microtubules in spindle which remain attached to spindle and also to the poles are called:",
        options: [
          "Continuous fibres",
          "Chromosomal fibres",
          "Interchromosomal fibres",
          "None of these"
        ],
        correct: 0,
        explanation: "Continuous fibers are the spindle microtubules that connect the spindle poles."
      },
      {
        text: "Which of these changes mark the telophase in mitosis:",
        options: [
          "Chromosomes start reaching poles and become thread like",
          "Nucleolus start reappearing and nuclear membrane reappears",
          "Both of these",
          "None of these"
        ],
        correct: 2,
        explanation: "Telophase is marked by chromosomes decondensing, the nuclear envelope reassembling, and the nucleolus reappearing."
      }, 

       { 
         text: "Cytokinesis in animal cells occurs through:",
        options: [
          "Formation of cell plate",
          "Cleavage furrow formation",
          "Both (a) and (b)",
          "None of these"
        ],
        correct: 1,
        explanation: "In animal cells, cytokinesis involves the formation of a cleavage furrow, which divides the cytoplasm."
      },
      {
        text: "The centromere is important during mitosis because:",
        options: [
          "It serves as the point of attachment for spindle fibers",
          "It stores genetic material",
          "It synthesizes ATP",
          "It forms the cell membrane"
        ],
        correct: 0,
        explanation: "The centromere is the attachment site for spindle fibers, ensuring proper chromosome segregation."
      },
      {
        text: "The primary function of mitosis is:",
        options: [
          "To produce genetically identical cells",
          "To reduce chromosome number",
          "To increase genetic variation",
          "To eliminate mutations"
        ],
        correct: 0,
        explanation: "Mitosis produces two genetically identical daughter cells, maintaining chromosome number."
      },
      {
        text: "Which organelle is crucial for spindle formation in animal cells?",
        options: ["Nucleus", "Golgi apparatus", "Centriole", "Mitochondria"],
        correct: 2,
        explanation: "Centriole is essential for organizing the spindle apparatus in animal cells."
      },
      {
        text: "Meiosis is important because it:",
        options: [
          "Produces haploid gametes",
          "Introduces genetic variation",
          "Reduces chromosome number",
          "All of these"
        ],
        correct: 3,
        explanation: "Meiosis ensures haploid gamete formation, reduces chromosome number, and introduces genetic variation."
      },
      {
        text: "Which phase of meiosis involves crossing over?",
        options: ["Prophase I", "Metaphase I", "Anaphase I", "Telophase I"],
        correct: 0,
        explanation: "Crossing over occurs during Prophase I when homologous chromosomes exchange genetic material."
      },
      {
        text: "During metaphase of mitosis:",
        options: [
          "Chromosomes align along the equatorial plate",
          "Nuclear membrane reforms",
          "Chromosomes condense",
          "Cytoplasm divides"
        ],
        correct: 0,
        explanation: "In metaphase, chromosomes align at the cell's equatorial plate for proper segregation."
      },
      {
        text: "Spindle fibers are primarily composed of:",
        options: ["Actin filaments", "Microtubules", "Intermediate filaments", "Collagen"],
        correct: 1,
        explanation: "Spindle fibers are made of microtubules, which play a role in chromosome movement."
      },
      {
        text: "How many daughter cells are produced at the end of meiosis?",
        options: ["2", "4", "8", "16"],
        correct: 1,
        explanation: "Meiosis produces four haploid daughter cells from a single diploid parent cell."
      },
      {
        text: "Which stage of mitosis is characterized by the complete separation of chromatids?",
        options: ["Prophase", "Metaphase", "Anaphase", "Telophase"],
        correct: 2,
        explanation: "Anaphase involves the separation of chromatids as they move to opposite poles."
      },
      {
        text: "In plant cells, cytokinesis occurs through:",
        options: [
          "Cleavage furrow formation",
          "Cell plate formation",
          "Both (a) and (b)",
          "None of these"
        ],
        correct: 1,
        explanation: "Plant cells divide by forming a cell plate, which becomes the new cell wall."
      },
      {
        text: "Chromosome number is halved during:",
        options: ["Mitosis", "Meiosis I", "Meiosis II", "None of these"],
        correct: 1,
        explanation: "Chromosome number is halved during Meiosis I as homologous chromosomes are separated."
      },
      {
        text: "Genetic recombination during meiosis occurs because of:",
        options: [
          "Crossing over",
          "Independent assortment",
          "Both (a) and (b)",
          "None of these"
        ],
        correct: 2,
        explanation: "Crossing over and independent assortment contribute to genetic diversity during meiosis."
      },
      {
        text: "Which phase of the cell cycle involves DNA replication?",
        options: ["G1 phase", "S phase", "G2 phase", "M phase"],
        correct: 1,
        explanation: "DNA replication occurs during the S phase of the cell cycle."
      },
      {
        text: "The term 'synapsis' refers to:",
        options: [
          "The separation of sister chromatids",
          "The pairing of homologous chromosomes",
          "The formation of spindle fibers",
          "The division of cytoplasm"
        ],
        correct: 1,
        explanation: "Synapsis is the pairing of homologous chromosomes during Prophase I of meiosis."
      },
      {
        text: "Which phase of mitosis involves the reformation of the nuclear envelope?",
        options: ["Prophase", "Metaphase", "Anaphase", "Telophase"],
        correct: 3,
        explanation: "In Telophase, the nuclear envelope reforms around the separated chromatids."
      },
      {
        text: "Chromosomes first become visible during which phase of mitosis?",
        options: ["Prophase", "Metaphase", "Anaphase", "Telophase"],
        correct: 0,
        explanation: "Chromosomes condense and become visible during Prophase."
      },
      {
        text: "The structure that holds sister chromatids together is called:",
        options: ["Centromere", "Spindle", "Telomere", "Chromatin"],
        correct: 0,
        explanation: "The centromere connects sister chromatids until they are separated during mitosis."
      },
      {
        text: "In which type of cell division does independent assortment occur?",
        options: ["Mitosis", "Meiosis", "Both (a) and (b)", "None of these"],
        correct: 1,
        explanation: "Independent assortment occurs during meiosis, contributing to genetic variation."
      },
      {
        text: "The spindle apparatus attaches to chromosomes at the:",
        options: ["Centromere", "Telomere", "Kinetochore", "Chromatin"],
        correct: 2,
        explanation: "Spindle fibers attach to chromosomes at the kinetochore, a protein structure on the centromere."
      },
      {
        text: "Which of these processes does not occur during interphase?",
        options: [
          "DNA replication",
          "Organelle duplication",
          "Chromosome condensation",
          "Protein synthesis"
        ],
        correct: 2,
        explanation: "Chromosome condensation occurs during Prophase, not interphase."
      },
      {
        text: "Which event is unique to meiosis but not mitosis?",
        options: [
          "Chromosome alignment at the equatorial plate",
          "Separation of chromatids",
          "Formation of a synaptonemal complex",
          "Cytokinesis"
        ],
        correct: 2,
        explanation: "The synaptonemal complex forms during meiosis to facilitate homologous recombination."
      },
      {
        text: "What is the ploidy level of cells at the end of meiosis I?",
        options: ["Diploid", "Haploid", "Tetraploid", "None of these"],
        correct: 1,
        explanation: "Cells are haploid at the end of meiosis I because homologous chromosomes are separated."
      },
      {
        text: "During which stage of meiosis do homologous chromosomes separate?",
        options: ["Prophase I", "Metaphase I", "Anaphase I", "Telophase I"],
        correct: 2,
        explanation: "Homologous chromosomes separate during Anaphase I of meiosis."
      },
      {
        text: "Which cell cycle checkpoint ensures proper DNA replication?",
        options: ["G1 checkpoint", "S checkpoint", "G2 checkpoint", "M checkpoint"],
        correct: 2,
        explanation: "The G2 checkpoint ensures that DNA has been accurately replicated before mitosis begins."
      },
      {
        text: "The longest phase of the cell cycle is:",
        options: ["G1 phase", "S phase", "G2 phase", "M phase"],
        correct: 0,
        explanation: "G1 is typically the longest phase, as cells grow and prepare for DNA replication."
      },
      {
        text: "A tetrad is formed during which stage of meiosis?",
        options: ["Prophase I", "Metaphase I", "Anaphase I", "Telophase I"],
        correct: 0,
        explanation: "A tetrad, consisting of four chromatids, forms during Prophase I when homologous chromosomes pair."
      },
      {
        text: "During which phase of mitosis do chromosomes decondense?",
        options: ["Prophase", "Metaphase", "Anaphase", "Telophase"],
        correct: 3,
        explanation: "Chromosomes decondense and return to a less compact state during Telophase."
      },
      {
        text: "Which protein is involved in the regulation of the cell cycle?",
        options: ["Actin", "Tubulin", "Cyclin", "Keratin"],
        correct: 2,
        explanation: "Cyclins regulate the progression of the cell cycle by activating cyclin-dependent kinases."
      }, 
      
     ]
   }
 }
};


  function showSection(section) {
    [courseSelectionSection, accessCodeSection, examSection, summarySection].forEach((el) => {
      if (el) el.classList.add("hidden");
    });
    section.classList.remove("hidden");
  }

  document.querySelectorAll(".course").forEach((button) => {
    button.addEventListener("click", () => {
      selectedCourse = button.dataset.course;
      selectedCourseTitle.textContent = `Enter Access Code for ${selectedCourse}`;
      showSection(accessCodeSection);
    });
  });

  document.getElementById("submit-code").addEventListener("click", () => {
    const code = document.getElementById("access-code").value.trim();
    const courseData = questionBanks[selectedCourse]?.[code];

    if (!courseData) {
      alert("Invalid access code. Please try again.");
      return;
    }

    const storedProgress = JSON.parse(localStorage.getItem(`${selectedCourse}-${code}`)) || [];
    const remainingQuestions = courseData.questions.filter((_, i) => !storedProgress.includes(i));

    if (remainingQuestions.length === 0) {
      alert("You have already completed all questions in this question bank.");
      return;
    }

    questions = shuffleArray(remainingQuestions);
    subCourseName = courseData.title;
    startExam();
  });

  cancelButton.addEventListener("click", () => {
    showSection(courseSelectionSection);
  });

  document.getElementById("next-question").addEventListener("click", () => {
    saveAnswer();
    currentQuestionIndex++;
    updateQuestion();
  });

  document.getElementById("prev-question").addEventListener("click", () => {
    saveAnswer();
    currentQuestionIndex--;
    updateQuestion();
  });

  document.getElementById("end-exam").addEventListener("click", () => {
    clearInterval(timerInterval);
    endExam();
  });

  document.getElementById("restart-exam").addEventListener("click", () => {
    questions = [];
    answers = [];
    currentQuestionIndex = 0;
    subCourseName = "";
    timeRemaining = 60;
    clearInterval(timerInterval);
    showSection(courseSelectionSection);
  });

  function startExam() {
    subjectTitle.textContent = subCourseName;
    showSection(examSection);
    createProgress();
    updateQuestion();
    startTimer();
  }

  function updateQuestion() {
    const question = questions[currentQuestionIndex];
    questionText.textContent = question.text;
    optionsContainer.innerHTML = "";

    question.options.forEach((option, index) => {
      const button = document.createElement("button");
      button.textContent = option;
      button.addEventListener("click", () => selectAnswer(index));
      button.className = "option-button";
      optionsContainer.appendChild(button);
    });

    document.getElementById("prev-question").disabled = currentQuestionIndex === 0;
    document.getElementById("next-question").disabled = currentQuestionIndex === questions.length - 1;
    updateProgress();
  }

  function createProgress() {
    progressContainer.innerHTML = "";
    questions.forEach((_, index) => {
      const progressItem = document.createElement("div");
      progressItem.classList.add("progress-item");
      progressItem.dataset.index = index;
      progressContainer.appendChild(progressItem);
    });
  }

  function updateProgress() {
    const items = progressContainer.querySelectorAll(".progress-item");
    items.forEach((item, index) => {
      item.classList.toggle("answered", answers[index] !== undefined);
      if (index === currentQuestionIndex) {
        item.classList.add("current");
      } else {
        item.classList.remove("current");
      }
    });
  }

  function selectAnswer(index) {
    answers[currentQuestionIndex] = index;
    updateProgress();
  }

  function saveAnswer() {
    if (answers[currentQuestionIndex] === undefined) {
      answers[currentQuestionIndex] = null; // Mark unanswered
    }
  }

  function startTimer() {
    const timerDisplay = document.createElement("div");
    timerDisplay.id = "timer-display";
    timerDisplay.style.margin = "1rem 0";
    timerDisplay.style.fontSize = "1.2rem";
    examSection.insertBefore(timerDisplay, progressContainer);

    updateTimerDisplay();
    timerInterval = setInterval(() => {
      timeRemaining--;
      updateTimerDisplay();
      if (timeRemaining <= 0) {
        clearInterval(timerInterval);
        alert("Time's up! The exam will be submitted automatically.");
        endExam();
      }
    }, 1000);
  }

  function updateTimerDisplay() {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    document.getElementById("timer-display").textContent = `Time Remaining: ${minutes}:${seconds.toString().padStart(2, "0")}`;
  }

  function endExam() {
    const score = answers.filter((ans, i) => ans === questions[i].correct).length;
    const totalQuestions = questions.length;
    const percentage = Math.round((score / totalQuestions) * 100);

    const storedProgress = JSON.parse(localStorage.getItem(`${selectedCourse}-${subCourseName}`)) || [];
    const updatedProgress = [...storedProgress, ...questions.map((_, i) => i)];
    localStorage.setItem(`${selectedCourse}-${subCourseName}`, JSON.stringify(updatedProgress));

    showSection(summarySection);
    summaryContent.innerHTML = `
      <h3>Score: ${score}/${totalQuestions} (${percentage}%)</h3>
      <p>${getRemark(percentage)}</p>
      ${questions
        .map(
          (q, i) => `
        <p>
          ${i + 1}. ${q.text} <br>
          Your Answer: ${q.options[answers[i]] || "Unanswered"} <br>
          Correct Answer: ${q.options[q.correct]} <br>
          Explanation: ${q.explanation} <br>
        </p>`
        )
        .join("")}
    `;
  }

  function shuffleArray(array) {
    return array.sort(() => 0.5 - Math.random()).slice(0.5, 50);
  }

  function getRemark(percentage) {
    if (percentage === 100) return "Excellent! You aced the test!";
    if (percentage >= 75) return "Great job! You did very well.";
    if (percentage >= 50) return "Good effort, but there's room for improvement.";
    return "Keep practicing! You can do better.";
  }
});
