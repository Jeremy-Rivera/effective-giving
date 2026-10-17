// The 12 hypothetical organizations for the giving exercise. Shared by the
// client (cards, draw) and the server (validation, derived columns), so keep
// this module free of browser-only code.
//
// Descriptions were written by AJ Chauradia and must stay verbatim. Odd
// numbers are effective-altruism (EA) style; even numbers are Jain-values,
// non-EA. Hindi and Gujarati text lives in lib/i18n/{hi,gu}.ts under `orgs`.
//
// Images: /public/orgs/<id>.jpg (see README). Until a file exists the card
// shows a neutral placeholder. Set `imageAlt` once the image is chosen;
// leave it empty while the image is decorative.

export type OrgId =
  | "org01" | "org02" | "org03" | "org04" | "org05" | "org06"
  | "org07" | "org08" | "org09" | "org10" | "org11" | "org12";

export type Org = {
  id: OrgId;
  name: string;
  ea: boolean;
  jainValues: boolean;
  description: string;
  imageAlt: string;
};

export const ORGS: Org[] = [
  {
    id: "org01",
    name: "Global Malaria Initiative",
    ea: true,
    jainValues: false,
    imageAlt: "",
    description: "Global Malaria Initiative is an international nonprofit dedicated to reducing preventable deaths from malaria in regions with the highest disease burden. The organization distributes insecticide-treated mosquito nets, supports malaria prevention campaigns, and continuously evaluates the effectiveness of its programs using independent research. Every $100 protects approximately 20 people from malaria, and researchers estimate that one child death is prevented for roughly every $4,500 donated. Although some interventions, including the manufacturing and global transportation of medical supplies, contribute to environmental impacts such as carbon emissions, the organization argues that preventing avoidable human deaths represents the greatest moral priority. It believes that charitable resources should always be directed toward interventions expected to generate the largest measurable improvement in human well-being.",
  },
  {
    id: "org02",
    name: "Ahimsa Education Trust",
    ea: false,
    jainValues: true,
    imageAlt: "",
    description: "Ahimsa Education Trust is a nonprofit inspired by the principles of nonviolence and compassion toward all living beings. The organization believes that lasting social change occurs by nurturing ethical individuals who value kindness, peaceful coexistence, and respect for both people and nature. It operates 18 Montessori-inspired schools that integrate academic instruction with lessons on vegetarianism, environmental stewardship, conflict resolution, and minimizing harm in everyday life. During the past year, the organization supported 1,250 students, awarded 420 scholarships, and engaged more than 1,800 volunteers in educational and community service programs. The organization focuses on cultivating character and encouraging compassionate decision-making within families and communities. It believes that living according to principles of nonviolence and respect for all forms of life creates meaningful and lasting benefits that cannot always be captured through quantitative measures alone.",
  },
  {
    id: "org03",
    name: "Pandemic Preparedness Network",
    ea: true,
    jainValues: false,
    imageAlt: "",
    description: "Pandemic Preparedness Network is an international nonprofit that focuses on preventing infectious disease outbreaks before they become global health emergencies. The organization invests in preventative measures that experts believe have the greatest potential to reduce future loss of life. It purchases vaccines, diagnostic equipment, and emergency medical supplies for clinics in regions most vulnerable to emerging diseases while supporting rapid-response surveillance systems. Every $250 equips one clinic with emergency vaccination supplies capable of protecting approximately 500 people during an outbreak. The organization believes that preventing future suffering is far more effective than responding after a crisis has already begun. It evaluates success by estimating the number of lives expected to be saved and continually reallocates funding toward the interventions projected to have the greatest overall impact.",
  },
  {
    id: "org04",
    name: "Jiva Daya Animal Trust",
    ea: false,
    jainValues: true,
    imageAlt: "",
    description: "Jiva Daya Animal Trust believes that every living being possesses inherent worth and deserves compassion. The organization rescues abandoned cows, birds, dogs, and injured wildlife, providing lifelong care whenever possible. The sanctuary currently provides permanent care for 940 rescued animals, delivered more than 2,700 veterinary treatments during the past year, and welcomed nearly 5,000 visitors who participated in educational programs promoting vegetarianism, nonviolence, and kindness toward animals. Staff members also work with local communities to encourage humane treatment of all creatures and discourage practices that unnecessarily cause suffering. The organization believes that reducing suffering for every individual living being is a moral responsibility in itself.",
  },
  {
    id: "org05",
    name: "AI Health Research Initiative",
    ea: true,
    jainValues: false,
    imageAlt: "",
    description: "AI Health Research Initiative is a nonprofit research organization that uses artificial intelligence to accelerate the discovery of treatments for cancer, Alzheimer's disease, and other life-threatening illnesses. The organization invests in technologies that could improve medical outcomes for millions of people over time. Last year, researchers analyzed more than 18 million patient records and identified 37 promising drug candidates for further clinical testing. Operating these advanced computing systems requires approximately 22 GWh of electricity annually, resulting in substantial environmental impacts associated with large-scale data centers. Despite these costs, the organization argues that accelerating life-saving medical discoveries has the potential to benefit millions of current and future patients. It believes charitable resources should be directed toward projects with the greatest expected long-term benefit, even when achieving those outcomes requires accepting unavoidable environmental trade-offs.",
  },
  {
    id: "org06",
    name: "Living Earth Foundation",
    ea: false,
    jainValues: true,
    imageAlt: "",
    description: "Living Earth Foundation is dedicated to protecting the natural world because humans have a moral obligation to minimize harm toward plants, animals, insects, and ecosystems while living in harmony with nature. During the past year, volunteers removed 540 tons of waste from rivers, planted more than 125,000 native trees, and restored 4,300 acres of natural habitat without disturbing existing wildlife whenever possible. Educational workshops encourage vegetarian lifestyles, sustainable consumption, and respect for all forms of life. The organization focuses on reducing the harm people inflict on the environment and other living beings. It believes that preserving ecological balance reflects a broader commitment to compassion and peaceful coexistence with all life.",
  },
  {
    id: "org07",
    name: "Global Outbreak Surveillance Alliance",
    ea: true,
    jainValues: false,
    imageAlt: "",
    description: "Global Outbreak Surveillance Alliance develops international systems for detecting dangerous infectious diseases before they spread widely. Its network currently operates across 61 countries and receives health data from more than 2,400 hospitals, allowing researchers to identify unusual disease patterns in real time. Public health experts estimate approximately a 0.5% annual probability that a highly contagious airborne disease could emerge with the potential to cause millions of deaths worldwide. Although such events are unlikely in any given year, the organization believes that reducing even a small probability of a catastrophic pandemic produces enormous expected benefits. Because successful prevention often goes unnoticed, many of the organization's greatest successes are events that never occur. It evaluates programs based on their expected ability to reduce catastrophic risk rather than their immediate visibility or public recognition.",
  },
  {
    id: "org08",
    name: "Jain Community Learning Centers",
    ea: false,
    jainValues: true,
    imageAlt: "",
    description: "Jain Community Learning Centers has established 38 community libraries serving approximately 27,000 children each year while coordinating more than 48,000 volunteer tutoring hours. In addition to literacy and academic support, students participate in programs emphasizing conflict resolution, vegetarianism, environmental stewardship, and ethical decision-making. The organization believes that education should shape both knowledge and character, encouraging individuals to reduce harm in their daily lives and contribute positively to their communities. It views the cultivation of compassionate values and peaceful relationships as meaningful outcomes that extend across generations.",
  },
  {
    id: "org09",
    name: "Global Nuclear Risk Institute",
    ea: true,
    jainValues: false,
    imageAlt: "",
    description: "Global Nuclear Risk Institute is an international nonprofit dedicated to reducing the possibility of catastrophic nuclear accidents and conflict. The organization develops secure underground storage facilities for hazardous nuclear materials, supports international monitoring systems, and funds scientific research designed to reduce existential risks facing humanity. Experts estimate these efforts reduce the probability of catastrophic nuclear conflict by approximately 2% over the coming decades. Constructing underground facilities requires extensive industrial development, significant energy consumption, and disruption to local environments. Nevertheless, the organization argues that even a small reduction in the probability of global catastrophe could protect billions of present and future lives. It therefore believes that accepting localized environmental costs is ethically justified when those actions substantially reduce the risk of irreversible human tragedy.",
  },
  {
    id: "org10",
    name: "Gau Seva Trust",
    ea: false,
    jainValues: true,
    imageAlt: "",
    description: "Gau Seva Trust currently provides permanent care for 3,600 rescued cows across 12 shelters staffed by 240 caregivers who ensure that animals receive food, medical treatment, and safe living conditions throughout their natural lives. Visitors participate in educational programs promoting kindness toward animals, and lifestyles that reduce unnecessary harm to living beings. More than 40,000 people attended these programs during the past year. The organization believes that every individual life possesses intrinsic value regardless of its economic or social contribution. Rather than comparing outcomes across different causes, it encourages people to practice compassion consistently toward the living beings they can directly protect.",
  },
  {
    id: "org11",
    name: "Future Humanity Foundation",
    ea: true,
    jainValues: false,
    imageAlt: "",
    description: "Future Humanity Foundation funds research addressing global catastrophic risks, including advanced artificial intelligence safety, biosecurity, and technologies capable of preventing events that could threaten humanity's long-term future. Each year the organization supports 84 international research projects involving scientists, engineers, and public policy experts. Although these initiatives require substantial financial resources and energy-intensive computing infrastructure, the foundation argues that reducing even a tiny probability of human extinction could protect billions of present and future lives. Because the consequences of existential risks are enormous, the organization believes charitable investments should prioritize expected long-term impact over immediate visibility or emotional appeal. It evaluates funding decisions by estimating which projects are most likely to produce the greatest overall benefit for humanity.",
  },
  {
    id: "org12",
    name: "Compassion in Action Foundation",
    ea: false,
    jainValues: true,
    imageAlt: "",
    description: "Compassion in Action Foundation provides direct assistance to individuals and families experiencing hardship. During the past year, volunteers served more than 310,000 vegetarian meals, treated 18,400 patients through free medical camps, and organized thousands of hours of elder care, food distribution, and community support. The organization encourages volunteers to live simply, consume responsibly, and approach every interaction with compassion toward people, animals, and the environment. It believes that every opportunity to reduce suffering through peaceful action has intrinsic moral value. Its mission is to embody compassion in everyday life by minimizing harm and caring for those immediately in need, regardless of whether those actions produce the greatest measurable impact.",
  },
];

export const ORG_IDS = ORGS.map((o) => o.id);
export const orgById = (id: string) => ORGS.find((o) => o.id === id);

// How many organizations each participant sees, and how they are drawn.
// "stratified": exactly 3 EA + 3 Jain-values, then shuffled (decision 8.3).
// "random6of12": any 6 of the 12, shuffled.
export const SHOWN_COUNT = 6;
export const SELECTION_MODE: "stratified" | "random6of12" = "stratified";

// Uniform integer in [0, n) from the platform CSPRNG, without modulo bias.
function randomInt(n: number): number {
  const limit = Math.floor(0x100000000 / n) * n;
  const buf = new Uint32Array(1);
  do crypto.getRandomValues(buf); while (buf[0] >= limit);
  return buf[0] % n;
}

export function shuffle<T>(items: readonly T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function drawShownOrgIds(): OrgId[] {
  if (SELECTION_MODE === "random6of12") return shuffle(ORG_IDS).slice(0, SHOWN_COUNT);
  const half = SHOWN_COUNT / 2;
  const ea = shuffle(ORGS.filter((o) => o.ea).map((o) => o.id)).slice(0, half);
  const jain = shuffle(ORGS.filter((o) => !o.ea).map((o) => o.id)).slice(0, half);
  return shuffle([...ea, ...jain]);
}

// Coin flip for the experimental condition, from the same CSPRNG.
export const randomBit = () => randomInt(2) === 1;
