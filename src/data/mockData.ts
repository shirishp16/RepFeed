export interface ExerciseCard {
  id: string;
  type: 'exercise';
  name: string;
  targetArea: string;
  difficulty: number;
  description: string;
  whyItHelps: string;
  reps?: number;
  duration?: string;
  xpReward: number;
  muscleGroups: string[];
  safetyNote?: string;
  canTryIt: boolean;
}

export interface KnowledgeCard {
  id: string;
  type: 'knowledge';
  title: string;
  content: string;
  category: 'anatomy' | 'recovery' | 'nutrition' | 'mindset';
}

export interface ProgressCardData {
  id: string;
  type: 'progress';
}

export type FeedCard = ExerciseCard | KnowledgeCard | ProgressCardData;

export const exercises: ExerciseCard[] = [
  // Easy (1-3)
  {
    id: 'ex-1',
    type: 'exercise',
    name: 'Quad Sets',
    targetArea: 'Quadriceps',
    difficulty: 1,
    description: 'Tighten the muscle on the top of your thigh by pressing the back of your knee flat into the floor. Hold for 5 seconds, then release.',
    whyItHelps: 'After ACL surgery, your quad shuts down fast — a phenomenon called arthrogenic muscle inhibition. Quad sets re-establish the neural connection between your brain and your quadriceps, which is the single most important muscle for knee stability.',
    reps: 20,
    xpReward: 15,
    muscleGroups: ['Quadriceps'],
    canTryIt: true,
  },
  {
    id: 'ex-2',
    type: 'exercise',
    name: 'Straight Leg Raises',
    targetArea: 'Quadriceps & Hip Flexors',
    difficulty: 2,
    description: 'Lying on your back with one knee bent, tighten your quad on the straight leg and lift it to 45 degrees. Hold 3 seconds, lower slowly.',
    whyItHelps: 'Straight leg raises build quad strength without bending the knee, protecting your healing ACL graft while fighting the muscle atrophy that accelerates in the first 3 weeks post-op.',
    reps: 15,
    xpReward: 20,
    muscleGroups: ['Quadriceps', 'Hip Flexors'],
    canTryIt: true,
  },
  {
    id: 'ex-3',
    type: 'exercise',
    name: 'Ankle Pumps',
    targetArea: 'Lower Leg',
    difficulty: 1,
    description: 'Flex your foot up toward your shin, then point your toes away from you. Alternate steadily like pressing a gas pedal.',
    whyItHelps: 'Ankle pumps activate the calf muscle pump, pushing blood and fluid back up from your lower leg. This directly reduces post-surgical swelling that limits your range of motion and slows healing.',
    reps: 30,
    xpReward: 10,
    muscleGroups: ['Calves', 'Tibialis Anterior'],
    canTryIt: true,
  },
  {
    id: 'ex-4',
    type: 'exercise',
    name: 'Heel Slides',
    targetArea: 'Knee ROM',
    difficulty: 2,
    description: 'Lying on your back, slowly slide your heel toward your glutes, bending your knee as far as comfortable. Hold 5 seconds, slide back.',
    whyItHelps: 'Restoring knee flexion is a critical milestone in ACL rehab. Heel slides gently challenge your range of motion within a safe, gravity-eliminated position, preventing scar tissue from limiting your bend.',
    reps: 15,
    xpReward: 20,
    muscleGroups: ['Quadriceps', 'Hamstrings'],
    canTryIt: true,
  },
  {
    id: 'ex-5',
    type: 'exercise',
    name: 'Standing Calf Raises',
    targetArea: 'Calves',
    difficulty: 3,
    description: 'Stand on both feet, slowly rise up onto your toes, hold for 2 seconds at the top, then lower with control. Use a wall for balance.',
    whyItHelps: 'Strong calves stabilize your ankle and share load with your knee during walking. After ACL reconstruction, patients often develop compensatory gait patterns — calf strength helps restore normal walking mechanics.',
    reps: 15,
    xpReward: 20,
    muscleGroups: ['Gastrocnemius', 'Soleus'],
    canTryIt: true,
  },

  // Medium (4-6)
  {
    id: 'ex-6',
    type: 'exercise',
    name: 'Wall Sits',
    targetArea: 'Quadriceps & Glutes',
    difficulty: 4,
    description: 'Lean against a wall and slide down until your thighs are parallel to the floor. Hold as long as possible with even weight distribution.',
    whyItHelps: 'Wall sits build isometric quad and glute endurance without dynamic knee movement. This closed-chain exercise loads the ACL graft safely while training the muscle endurance needed for stairs and slopes.',
    duration: '30s hold',
    xpReward: 30,
    muscleGroups: ['Quadriceps', 'Glutes', 'Core'],
    canTryIt: true,
  },
  {
    id: 'ex-7',
    type: 'exercise',
    name: 'Mini Squats',
    targetArea: 'Full Lower Body',
    difficulty: 5,
    description: 'Stand with feet shoulder-width apart. Bend knees to 45 degrees (not past 90), keeping weight in your heels. Rise with control.',
    whyItHelps: 'Mini squats introduce controlled knee flexion under load, a key progression in ACL rehab. The limited range protects the graft while training the quad-hamstring co-contraction pattern that stabilizes your knee.',
    reps: 12,
    xpReward: 30,
    muscleGroups: ['Quadriceps', 'Glutes', 'Hamstrings'],
    safetyNote: 'Do not bend past 90 degrees. Stop if you feel a sharp pain.',
    canTryIt: true,
  },
  {
    id: 'ex-8',
    type: 'exercise',
    name: 'Step-Ups',
    targetArea: 'Quadriceps & Glutes',
    difficulty: 5,
    description: 'Step up onto a 6-8 inch platform leading with your surgical leg. Fully extend at the top, then step down slowly with the other leg.',
    whyItHelps: 'Step-ups train single-leg strength and proprioception — your knee needs to learn to control itself under your full body weight again. This exercise directly translates to stair climbing confidence.',
    reps: 10,
    xpReward: 35,
    muscleGroups: ['Quadriceps', 'Glutes', 'Calves'],
    safetyNote: 'Start with a low step. Ensure the platform is stable.',
    canTryIt: false,
  },
  {
    id: 'ex-9',
    type: 'exercise',
    name: 'Hamstring Curls',
    targetArea: 'Hamstrings',
    difficulty: 4,
    description: 'Standing on one leg (hold a chair for balance), bend your other knee bringing your heel toward your glutes. Lower slowly.',
    whyItHelps: 'Your hamstrings are the ACL\'s best friend — they pull the tibia backward, directly counteracting the anterior shear force that stresses the ACL. Strong hamstrings are your primary dynamic knee protector.',
    reps: 12,
    xpReward: 25,
    muscleGroups: ['Hamstrings', 'Glutes'],
    canTryIt: true,
  },
  {
    id: 'ex-10',
    type: 'exercise',
    name: 'Single Leg Balance',
    targetArea: 'Proprioception',
    difficulty: 6,
    description: 'Stand on your surgical leg with a slight knee bend. Hold for 30 seconds. Progress by closing your eyes or standing on a pillow.',
    whyItHelps: 'ACL reconstruction destroys the mechanoreceptors inside the ligament that tell your brain where your knee is in space. Balance training retrains proprioception through other receptors, reducing re-injury risk by up to 50%.',
    duration: '30s hold',
    xpReward: 30,
    muscleGroups: ['Stabilizers', 'Core', 'Ankle Complex'],
    canTryIt: true,
  },

  // Hard (7-10)
  {
    id: 'ex-11',
    type: 'exercise',
    name: 'Bulgarian Split Squats',
    targetArea: 'Quadriceps & Glutes',
    difficulty: 7,
    description: 'Place your rear foot on a bench behind you. Lower your front knee to 90 degrees while keeping your torso upright. Drive up through your front heel.',
    whyItHelps: 'This advanced single-leg exercise addresses the strength asymmetry that develops after ACL surgery. It loads the quad and glute in a deep range while training hip stability — a key predictor of return-to-sport readiness.',
    reps: 8,
    xpReward: 45,
    muscleGroups: ['Quadriceps', 'Glutes', 'Hip Stabilizers'],
    safetyNote: 'Only attempt when cleared for deep knee flexion. Use support if needed.',
    canTryIt: false,
  },
  {
    id: 'ex-12',
    type: 'exercise',
    name: 'Lateral Band Walks',
    targetArea: 'Hip Abductors',
    difficulty: 7,
    description: 'Place a resistance band around your ankles. In an athletic stance, take controlled steps sideways maintaining tension in the band throughout.',
    whyItHelps: 'Weak hip abductors cause the knee to collapse inward during movement — the exact mechanism that tears ACLs. Lateral band walks build the gluteus medius strength that keeps your knee tracking safely over your toes.',
    reps: 15,
    xpReward: 40,
    muscleGroups: ['Gluteus Medius', 'Hip Abductors', 'Core'],
    canTryIt: false,
  },
  {
    id: 'ex-13',
    type: 'exercise',
    name: 'Box Jumps',
    targetArea: 'Plyometric Power',
    difficulty: 9,
    description: 'Stand facing a sturdy box (start at 12 inches). Jump onto the box landing softly with both feet, knees tracking over toes. Step down carefully.',
    whyItHelps: 'Plyometric training is the bridge between rehab and sport. Box jumps teach your neuromuscular system to absorb and produce force rapidly — the same demands your ACL faces during cutting, pivoting, and landing in athletics.',
    reps: 8,
    xpReward: 50,
    muscleGroups: ['Quadriceps', 'Glutes', 'Calves', 'Core'],
    safetyNote: 'Late-stage exercise only. Must be cleared by your PT. Always step down, never jump down.',
    canTryIt: false,
  },
  {
    id: 'ex-14',
    type: 'exercise',
    name: 'Single Leg RDL',
    targetArea: 'Posterior Chain',
    difficulty: 8,
    description: 'Standing on your surgical leg, hinge at the hip and reach your opposite hand toward the floor while your free leg extends behind you. Return to standing.',
    whyItHelps: 'The single leg RDL is a gold-standard exercise for ACL rehab because it trains hamstring strength, hip stability, and proprioception simultaneously — the three pillars of dynamic knee protection during athletic movements.',
    reps: 8,
    xpReward: 45,
    muscleGroups: ['Hamstrings', 'Glutes', 'Core', 'Stabilizers'],
    canTryIt: true,
  },
  {
    id: 'ex-15',
    type: 'exercise',
    name: 'Deep Squats',
    targetArea: 'Full Lower Body',
    difficulty: 10,
    description: 'With feet shoulder-width apart, squat as deep as mobility allows while maintaining a neutral spine. Drive up through your whole foot.',
    whyItHelps: 'Full-depth squats represent the final frontier of ACL rehab — they require full range of motion, bilateral strength, and confidence in your knee. Achieving a pain-free deep squat is a strong indicator of functional recovery.',
    reps: 10,
    xpReward: 50,
    muscleGroups: ['Quadriceps', 'Glutes', 'Hamstrings', 'Core', 'Calves'],
    safetyNote: 'Only when full ROM is restored and PT has cleared deep flexion under load.',
    canTryIt: true,
  },
];

export const knowledgeCards: KnowledgeCard[] = [
  {
    id: 'kb-1',
    type: 'knowledge',
    title: 'Why Your Knee Swells After Exercise',
    content: 'Post-exercise swelling is your body\'s inflammatory response to the micro-stress placed on healing tissues. Some swelling is expected and even beneficial — it delivers growth factors and nutrients to the repair site. However, if swelling persists beyond 24 hours or your knee feels hot and tight, you may be pushing too hard. Ice for 15 minutes after exercise and elevate your leg above your heart to help manage the inflammatory response.',
    category: 'recovery',
  },
  {
    id: 'kb-2',
    type: 'knowledge',
    title: 'ACL Graft Healing Timeline',
    content: 'Your new ACL goes through distinct healing phases. Weeks 0-6: the graft is at its weakest as it undergoes avascular necrosis — the old cells die before new ones grow in. Weeks 6-12: revascularization begins as new blood vessels penetrate the graft. Months 3-6: the graft remodels and slowly gains strength. Full biological maturation takes 9-12 months, which is why return-to-sport timelines exist regardless of how strong you feel.',
    category: 'anatomy',
  },
  {
    id: 'kb-3',
    type: 'knowledge',
    title: 'Protein and Tissue Repair',
    content: 'Healing tissue demands significantly more protein than maintenance. Aim for 1.6-2.2 grams of protein per kilogram of body weight daily during active recovery. Collagen synthesis peaks during sleep, so a casein-rich snack before bed gives your body amino acids through the night. Vitamin C is essential for collagen cross-linking — pair your protein with citrus or bell peppers. Creatine at 5g daily has also shown benefits for maintaining muscle mass during periods of immobilization.',
    category: 'nutrition',
  },
  {
    id: 'kb-4',
    type: 'knowledge',
    title: 'What Happens Inside Your Knee at Week 4-8',
    content: 'Between weeks 4 and 8, your ACL graft enters its most vulnerable phase. The original donor tissue cells are dying off while your body works to repopulate the graft with new cells and blood vessels. The graft\'s mechanical strength actually decreases during this period before it starts getting stronger. This is why your PT is cautious even when you feel great — the biology is lagging behind your symptoms.',
    category: 'anatomy',
  },
  {
    id: 'kb-5',
    type: 'knowledge',
    title: 'Cold Therapy: Science vs. Habit',
    content: 'Ice reduces pain and swelling through vasoconstriction, but the evidence on optimal timing has evolved. Apply ice for 15-20 minutes after exercise to manage acute inflammation, but avoid icing 24/7 — some inflammation is necessary for healing. Cryotherapy is most beneficial in the first 72 hours post-surgery and immediately after challenging PT sessions. Compression combined with cold (like a Game Ready machine) is more effective than ice alone.',
    category: 'recovery',
  },
  {
    id: 'kb-6',
    type: 'knowledge',
    title: 'Breaking Through Mental Barriers',
    content: 'Fear of re-injury is the most common reason athletes don\'t return to sport after ACL reconstruction — not physical limitations. This fear is neurological: your brain has learned that this movement pattern equals danger. Graded exposure therapy, where you systematically face feared movements in controlled environments, rewires this threat response. Visualization of successful movements has been shown to activate the same neural pathways as physical practice.',
    category: 'mindset',
  },
  {
    id: 'kb-7',
    type: 'knowledge',
    title: 'Sleep Is Your Recovery Superpower',
    content: 'Growth hormone, essential for tissue repair, is released primarily during deep sleep stages 3 and 4. Just one night of poor sleep can reduce growth hormone secretion by up to 70%. Aim for 8-9 hours during active rehab. Keep your room cool (65-68°F), avoid screens 30 minutes before bed, and maintain a consistent sleep schedule. Elevating your surgical leg with a pillow can reduce overnight swelling and improve sleep quality.',
    category: 'recovery',
  },
  {
    id: 'kb-8',
    type: 'knowledge',
    title: 'The Evidence on Return-to-Run',
    content: 'Current research supports beginning a return-to-run program no earlier than 12 weeks post-ACL reconstruction, provided you meet specific criteria: less than minimal effusion, full range of motion, quad strength at least 70% of your non-surgical leg, and ability to hop on one leg without pain. A structured walk-jog program over 4-6 weeks is safer than jumping straight into continuous running. Running on a treadmill initially offers a more controlled surface than outdoor terrain.',
    category: 'mindset',
  },
];

export const mockUserStats = {
  xp: 340,
  level: 4,
  streak: 3,
  exercisesCompleted: 23,
  totalReps: 187,
  avgFormScore: 84,
  rangeOfMotion: { week1: 45, week2: 67, week3: 82, current: 89 },
  condition: 'ACL Reconstruction',
  phase: 'Building Strength',
  daysInRecovery: 21,
};

export const motivationalQuotes = [
  "Every rep is a vote for the athlete you're becoming.",
  "Your graft is getting stronger while you sleep. Show up tomorrow.",
  "Consistency beats intensity. Always.",
  "The body heals. The mind needs convincing.",
  "3 weeks in. This is where it counts.",
  "Trust the process — your biology is working overtime.",
];
