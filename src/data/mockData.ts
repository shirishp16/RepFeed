import type { ExerciseType } from '@/lib/poseDetection';

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
  exerciseType?: ExerciseType;
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
    name: 'Standing Quad Sets',
    targetArea: 'Quadriceps',
    difficulty: 1,
    description: 'Stand with your back against a wall and tighten the muscle on top of your thigh as hard as you can, pushing the back of your knee toward the wall. Hold 5 seconds, then release completely.',
    whyItHelps: 'After ACL surgery, arthrogenic muscle inhibition causes your quad to shut off neurologically — not just weaken. Quad sets re-fire the motor pathway between your brain and quad without any knee bending, making it safe from day one of weight-bearing.',
    reps: 20,
    xpReward: 15,
    muscleGroups: ['Quadriceps'],
    canTryIt: false,
  },
  {
    id: 'ex-2',
    type: 'exercise',
    name: 'Standing Hamstring Curls',
    targetArea: 'Hamstrings',
    difficulty: 2,
    description: 'Stand on one leg (hold a chair or wall for balance). Bend your other knee and curl your heel toward your glute. Pause at the top, then lower with control over 3 seconds.',
    whyItHelps: 'Your hamstrings are your ACL\'s primary dynamic backup — they pull the tibia backward and reduce anterior shear stress on your graft. Early hamstring activation prevents the strength asymmetry that leaves re-injury risk elevated at return to sport.',
    reps: 12,
    xpReward: 20,
    muscleGroups: ['Hamstrings', 'Glutes'],
    canTryIt: true,
    exerciseType: 'hamstring_curl',
  },
  {
    id: 'ex-3',
    type: 'exercise',
    name: 'Standing Calf Raises',
    targetArea: 'Calves',
    difficulty: 3,
    description: 'Stand on both feet, slowly rise onto your toes, hold 2 seconds at the top, then lower with control. Use a wall for balance as needed.',
    whyItHelps: 'Strong calves stabilize your ankle and share load with your knee during every step. After ACL reconstruction, patients often develop compensatory gait patterns that overload the graft — calf strength helps restore normal mechanics early.',
    reps: 15,
    xpReward: 20,
    muscleGroups: ['Gastrocnemius', 'Soleus'],
    canTryIt: true,
    exerciseType: 'calf_raise',
  },
  {
    id: 'ex-4',
    type: 'exercise',
    name: 'Heel-to-Toe Raises',
    targetArea: 'Lower Leg',
    difficulty: 2,
    description: 'Stand with feet hip-width apart. Lift your heels (rise onto toes), lower, then rock back and lift your toes off the floor. Alternate rhythmically for full reps.',
    whyItHelps: 'This exercise works both sides of the lower leg in one movement. The calf-raise phase pumps swelling out of the foot and ankle, while the tibialis-raise phase retrains the dorsiflexion control that protects your knee during landing mechanics.',
    reps: 20,
    xpReward: 15,
    muscleGroups: ['Gastrocnemius', 'Soleus', 'Tibialis Anterior'],
    canTryIt: true,
    exerciseType: 'calf_raise',
  },
  {
    id: 'ex-5',
    type: 'exercise',
    name: 'Standing March in Place',
    targetArea: 'Hip Flexors & Balance',
    difficulty: 3,
    description: 'Stand tall and alternate lifting each knee to hip height at a slow, controlled pace. Keep your standing leg slightly bent and your core braced throughout.',
    whyItHelps: 'Marching rebuilds the hip flexor strength and single-leg weight-shifting pattern that gets disrupted after surgery. Each single-leg stance moment also challenges the proprioceptive system that your ACL graft is slowly re-establishing.',
    reps: 20,
    xpReward: 15,
    muscleGroups: ['Hip Flexors', 'Core', 'Stabilizers'],
    canTryIt: false,
  },

  // Medium (4-6)
  {
    id: 'ex-6',
    type: 'exercise',
    name: 'Mini Squats',
    targetArea: 'Full Lower Body',
    difficulty: 5,
    description: 'Stand feet shoulder-width apart. Bend knees to about 45 degrees — not past 90 — keeping weight through your heels. Rise with control.',
    whyItHelps: 'Mini squats introduce controlled knee flexion under load, a key progression in ACL rehab. The limited range keeps stress on the graft within safe limits while retraining the quad-hamstring co-contraction that stabilizes your knee.',
    reps: 12,
    xpReward: 30,
    muscleGroups: ['Quadriceps', 'Glutes', 'Hamstrings'],
    safetyNote: 'Do not bend past 90 degrees. Stop if you feel sharp pain.',
    canTryIt: true,
    exerciseType: 'squat',
  },
  {
    id: 'ex-7',
    type: 'exercise',
    name: 'Wall Sits',
    targetArea: 'Quadriceps & Glutes',
    difficulty: 4,
    description: 'Lean your back flat against a wall and slide down until your thighs are parallel to the floor. Hold as long as possible with even weight through both feet.',
    whyItHelps: 'Wall sits build isometric quad and glute endurance without dynamic knee movement. This closed-chain exercise loads the ACL graft safely while training the endurance needed for stairs and walking long distances during early recovery.',
    duration: '30s hold',
    xpReward: 30,
    muscleGroups: ['Quadriceps', 'Glutes', 'Core'],
    canTryIt: true,
    exerciseType: 'wall_sit',
  },
  {
    id: 'ex-8',
    type: 'exercise',
    name: 'Single Leg Balance',
    targetArea: 'Proprioception',
    difficulty: 6,
    description: 'Stand on your surgical leg with a slight knee bend. Hold for 30 seconds. Progress by closing your eyes or standing on a folded towel.',
    whyItHelps: 'ACL reconstruction eliminates the mechanoreceptors inside the ligament that tell your brain your knee\'s position in space. Balance training re-establishes proprioception through capsular and muscular receptors, cutting re-injury risk by up to 50%.',
    duration: '30s hold',
    xpReward: 30,
    muscleGroups: ['Stabilizers', 'Core', 'Ankle Complex'],
    canTryIt: true,
    exerciseType: 'wall_sit',
  },
  {
    id: 'ex-9',
    type: 'exercise',
    name: 'Standing Hip Abduction',
    targetArea: 'Hip Abductors',
    difficulty: 4,
    description: 'Stand on one leg with a slight knee bend. Slowly lift your other leg out to the side to about 30 degrees, hold 2 seconds, then lower with control.',
    whyItHelps: 'Weak hip abductors — specifically gluteus medius — cause the knee to collapse inward during movement, the exact mechanism behind most ACL tears. Early abductor work is a primary prevention strategy for re-injury.',
    reps: 12,
    xpReward: 25,
    muscleGroups: ['Gluteus Medius', 'Hip Abductors'],
    canTryIt: false,
  },
  {
    id: 'ex-10',
    type: 'exercise',
    name: 'Sumo Squats',
    targetArea: 'Inner Quad & Glutes',
    difficulty: 5,
    description: 'Stand with feet wide (outside shoulder-width) and toes turned out 45 degrees. Squat until thighs are parallel, keeping knees tracking over your toes. Drive up through your heels.',
    whyItHelps: 'The wide stance shifts load to the inner quad (VMO) and glutes — muscles that are disproportionately weakened after ACL surgery. VMO activation is critical because it\'s the primary quad muscle that pulls the kneecap into proper tracking, reducing anterior knee pain during rehab.',
    reps: 12,
    xpReward: 30,
    muscleGroups: ['Quadriceps (VMO)', 'Glutes', 'Inner Thigh'],
    canTryIt: true,
    exerciseType: 'squat',
  },

  // Hard (7-10)
  {
    id: 'ex-11',
    type: 'exercise',
    name: 'Deep Squats',
    targetArea: 'Full Lower Body',
    difficulty: 10,
    description: 'With feet shoulder-width apart, squat as deep as mobility allows while maintaining a neutral spine and heels flat on the floor. Drive up through your whole foot.',
    whyItHelps: 'Full-depth squats represent the final frontier of ACL rehab — they require full ROM, bilateral strength, and genuine confidence in your knee. Achieving a pain-free deep squat under load is one of the strongest functional indicators of complete recovery.',
    reps: 10,
    xpReward: 50,
    muscleGroups: ['Quadriceps', 'Glutes', 'Hamstrings', 'Core', 'Calves'],
    safetyNote: 'Only when full ROM is restored and your PT has cleared deep flexion under load.',
    canTryIt: true,
    exerciseType: 'squat',
  },
  {
    id: 'ex-12',
    type: 'exercise',
    name: 'Bulgarian Split Squats',
    targetArea: 'Quadriceps & Glutes',
    difficulty: 7,
    description: 'Place your rear foot on a chair or bench behind you. Lower your front knee to 90 degrees while keeping your torso upright. Drive up through your front heel.',
    whyItHelps: 'This advanced single-leg exercise directly attacks the strength asymmetry between legs that develops after ACL surgery. It loads the quad and glute through a full range while demanding the hip stability that\'s a key predictor of return-to-sport success.',
    reps: 8,
    xpReward: 45,
    muscleGroups: ['Quadriceps', 'Glutes', 'Hip Stabilizers'],
    safetyNote: 'Only when cleared for deep knee flexion. Start bodyweight only.',
    canTryIt: true,
    exerciseType: 'squat',
  },
  {
    id: 'ex-13',
    type: 'exercise',
    name: 'Single Leg Calf Raises',
    targetArea: 'Calves',
    difficulty: 7,
    description: 'Stand on one leg near a wall for balance. Rise onto your toes as high as possible, hold 2 seconds, then lower slowly over 3 seconds. Complete all reps on one side before switching.',
    whyItHelps: 'Single-leg calf raises expose the ankle and calf strength deficits that bilateral raises hide. They also train the single-leg balance and foot proprioception that your ACL-reconstructed knee depends on for dynamic stability during running and sport.',
    reps: 10,
    xpReward: 40,
    muscleGroups: ['Gastrocnemius', 'Soleus', 'Ankle Stabilizers'],
    canTryIt: true,
    exerciseType: 'calf_raise',
  },
  {
    id: 'ex-14',
    type: 'exercise',
    name: 'Pistol Squat Progression',
    targetArea: 'Single Leg Strength',
    difficulty: 9,
    description: 'Stand on one leg with your other leg extended forward. Lower into a partial single-leg squat, going as deep as control allows (even just 20-30 degrees is a win). Hold a surface for assistance as needed.',
    whyItHelps: 'The pistol squat progression is the ultimate functional test of ACL rehab — it demands quad strength, hamstring flexibility, balance, and neuromuscular control in a single movement. Limb symmetry on this test is one of the best predictors of safe return to cutting sports.',
    reps: 5,
    xpReward: 50,
    muscleGroups: ['Quadriceps', 'Glutes', 'Hamstrings', 'Core'],
    safetyNote: 'Late-stage only. Use a TRX or doorframe for assistance. Stop if you feel instability in the knee.',
    canTryIt: true,
    exerciseType: 'squat',
  },
  {
    id: 'ex-15',
    type: 'exercise',
    name: 'Jump Squats (Low Impact)',
    targetArea: 'Plyometric Power',
    difficulty: 8,
    description: 'From a squat position, explode upward with a small controlled jump (just a few inches off the ground). Land softly with bent knees, immediately absorbing into the next squat. Prioritize landing mechanics over height.',
    whyItHelps: 'Plyometric training bridges rehab and sport by teaching your neuromuscular system to absorb and produce force quickly — the same demand your ACL faces during cutting and landing. Low-impact jump squats introduce this stimulus safely before progressing to full plyometrics.',
    reps: 8,
    xpReward: 45,
    muscleGroups: ['Quadriceps', 'Glutes', 'Calves', 'Core'],
    safetyNote: 'Late-stage only. Must be cleared by your PT. Land with soft knees — never with locked legs.',
    canTryIt: true,
    exerciseType: 'squat',
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
