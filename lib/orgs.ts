// The 14 hypothetical organizations for the giving exercise: 7 scenarios, each
// with two organizations (variant A and variant B). Shared by the client
// (cards, draw) and the server (validation, derived columns), so keep this
// module free of browser-only code.
//
// Names and descriptions are verbatim from AJ Chauradia's "Seven Scenarios -
// Revised" document (Oct 17), in its order: org01/org02 are scenario 1 A/B,
// and so on. Key from the document: "A has more EA than B". EA flags follow
// the scenario headings: every A is EA-style, and B is also EA in scenarios 2,
// 5, 6 and 7 ("Potential EA" / "General EA"); in scenarios 1, 3 and 4 B is the
// non-EA option. jainValues marks the organizations framed around Jain ethics
// (Ahimsa Education Trust, Jiva Daya Water Stewardship, Gau Seva Trust,
// Compassion in Action). Hindi and Gujarati text lives in lib/i18n/{hi,gu}.ts.
//
// Images: /public/orgs/<id>.jpg; sources and licenses in public/orgs/CREDITS.md.
// The photos are real scenes from unrelated sources, used only to illustrate
// these fictional organizations.

export type OrgId =
  | "org01" | "org02" | "org03" | "org04" | "org05" | "org06" | "org07"
  | "org08" | "org09" | "org10" | "org11" | "org12" | "org13" | "org14";

export type Org = {
  id: OrgId;
  // 1 to 7. Never shown to participants.
  scenario: number;
  // Never shown to participants. A is typically the more EA-style option.
  variant: "A" | "B";
  name: string;
  ea: boolean;
  jainValues: boolean;
  description: string;
  imageAlt: string;
  // Photographer and license, shown under the expanded card's text. Full
  // sources and license links: public/orgs/CREDITS.md.
  credit: string;
};

export const ORGS: Org[] = [
  {
    id: "org01",
    scenario: 1,
    variant: "A",
    name: "Somalia Education Initiative",
    ea: true,
    jainValues: false,
    imageAlt: "A girl writes on the chalkboard in a primary school classroom in Mogadishu",
    credit: "AMISOM Public Information, CC0",
    description: "Somalia Education Initiative provides basic primary education to children living in some of the poorest communities in Somalia. The organization estimates that every $50 donated provides one year of basic education for approximately 10 children, covering teacher salaries, school supplies, and classroom materials. The curriculum focuses primarily on literacy, mathematics, science, and practical life skills. The organization believes that expanding access to education is one of the most effective ways to reduce poverty and improve future opportunities for disadvantaged children. It measures success through school enrollment, attendance, and educational access, viewing education as a practical pathway toward long-term social and economic development.",
  },
  {
    id: "org02",
    scenario: 1,
    variant: "B",
    name: "Ahimsa Education Trust",
    ea: false,
    jainValues: true,
    imageAlt: "Schoolchildren in an Indian classroom raise their hands as their teacher speaks",
    credit: "Ambuj Saxena, public domain",
    description: "Ahimsa Education Trust is a nonprofit inspired by the principles of nonviolence and compassion toward all living beings. The organization believes that lasting social change occurs by nurturing ethical individuals who value kindness, peaceful coexistence, and respect for both people and nature. It operates 18 Montessori-inspired schools that integrate academic instruction with lessons on vegetarianism, environmental stewardship, conflict resolution, and minimizing harm in everyday life. During the past year, the organization supported 1,250 students, awarded 420 scholarships, and engaged more than 1,800 volunteers in educational and community service programs. The organization focuses on cultivating character and encouraging compassionate decision-making within families and communities.",
  },
  {
    id: "org03",
    scenario: 2,
    variant: "A",
    name: "Pandemic Preparedness Network",
    ea: true,
    jainValues: false,
    imageAlt: "A health worker gives a vaccination to a boy held by his mother",
    credit: "Andrew W. McGalliard, U.S. Army, public domain",
    description: "Pandemic Preparedness Network is an international nonprofit that focuses on preventing infectious disease outbreaks before they become global health emergencies. The organization invests in preventative measures that experts believe have the greatest potential to reduce future loss of life. It purchases vaccines, diagnostic equipment, and emergency medical supplies for clinics in regions most vulnerable to emerging diseases while supporting rapid-response surveillance systems. Every $250 equips one clinic with emergency vaccination supplies capable of protecting approximately 500 people during an outbreak. The organization believes that preventing future suffering is far more effective than responding after a crisis has already begun. It evaluates success by estimating the number of lives expected to be saved and continually reallocates funding toward the interventions projected to have the greatest overall impact.",
  },
  {
    id: "org04",
    scenario: 2,
    variant: "B",
    name: "Global Malaria Initiative",
    ea: true,
    jainValues: false,
    imageAlt: "A smiling boy hangs a blue mosquito net on a wall",
    credit: "U.S. President's Malaria Initiative, public domain",
    description: "Global Malaria Initiative is an international nonprofit dedicated to reducing preventable deaths from malaria in regions with the highest disease burden. The organization distributes insecticide-treated mosquito nets, supports malaria prevention campaigns, and continuously evaluates the effectiveness of its programs using independent research. Every $100 protects approximately 20 people from malaria, and researchers estimate that one child death is prevented for roughly every $4,500 donated. Although some interventions, including the manufacturing and global transportation of medical supplies, contribute to environmental impacts such as carbon emissions, the organization argues that preventing avoidable human deaths represents the greatest moral priority. It believes that charitable resources should always be directed toward interventions expected to generate the largest measurable improvement in human well-being.",
  },
  {
    id: "org05",
    scenario: 3,
    variant: "A",
    name: "Jiva Daya Water Stewardship Initiative",
    ea: true,
    jainValues: true,
    imageAlt: "Goats drink side by side at a water point",
    credit: "Oxfam East Africa, CC BY 2.0",
    description: "Jiva Daya Water Stewardship Initiative is guided by the belief that every living being possesses inherent worth and that reducing suffering is a moral responsibility. To achieve this mission, the organization uses evidence-based research to identify the most effective ways to improve animal welfare in drought-prone regions of Africa. After evaluating multiple interventions, it concluded that installing solar-powered, water-efficient irrigation systems and shared watering stations provides one of the greatest reductions in animal suffering while also conserving scarce natural resources. During the past year, the organization installed 185 irrigation systems, providing reliable water access for an estimated 48,000 animals and reducing water consumption by approximately 35% compared with conventional irrigation methods. It continuously measures animal survival, water efficiency, and cost per animal benefited, using these data to improve future projects and allocate resources where they are expected to have the greatest impact.",
  },
  {
    id: "org06",
    scenario: 3,
    variant: "B",
    name: "Gau Seva Trust",
    ea: false,
    jainValues: true,
    imageAlt: "Cows resting and standing in a covered shelter",
    credit: "Irshad M Venur, CC BY-SA 3.0",
    description: "Gau Seva Trust currently provides permanent care for 3,600 rescued cows across 12 shelters staffed by 240 caregivers who ensure that animals receive food, medical treatment, and safe living conditions throughout their natural lives. Located in the Ahmedabad, India, visitors participate in educational programs promoting kindness toward animals, and lifestyles that reduce unnecessary harm to living beings. More than 40,000 people attended these programs during the past year. The organization believes that every individual life possesses intrinsic value regardless of its economic or social contribution. Rather than comparing outcomes across different causes, it encourages people to practice compassion consistently toward the living beings they can directly protect.",
  },
  {
    id: "org07",
    scenario: 4,
    variant: "A",
    name: "Global Nuclear Risk Institute",
    ea: true,
    jainValues: false,
    imageAlt: "A long, lit underground tunnel carved through rock",
    credit: "kallerna, CC BY-SA 3.0",
    description: "Global Nuclear Risk Institute is an international nonprofit dedicated to reducing the possibility of catastrophic nuclear accidents and conflict. The organization develops secure underground storage facilities for hazardous nuclear materials, supports international monitoring systems, and funds scientific research designed to reduce existential risks facing humanity. Experts estimate these efforts reduce the probability of catastrophic nuclear conflict by approximately 2% over the coming decades. Constructing underground facilities requires extensive industrial development, significant energy consumption, and disruption to local environments. Nevertheless, the organization argues that even a small reduction in the probability of global catastrophe could protect billions of present and future lives. It therefore believes that accepting localized environmental costs is ethically justified when those actions substantially reduce the risk of irreversible human tragedy.",
  },
  {
    id: "org08",
    scenario: 4,
    variant: "B",
    name: "Compassion in Action Foundation",
    ea: false,
    jainValues: true,
    imageAlt: "People wait in line at an outdoor medical camp",
    credit: "Sarvodaya Shramadana, CC BY 2.0",
    description: "Compassion in Action Foundation provides direct assistance to individuals and families experiencing hardship. During the past year, volunteers served more than 310,000 vegetarian meals, treated 18,400 patients through free medical camps, and organized thousands of hours of elder care, food distribution, and community support. The organization encourages volunteers to live simply, consume responsibly, and approach every interaction with compassion toward people, animals, and the environment. It believes that every opportunity to reduce suffering through peaceful action has intrinsic moral value. Its mission is to embody compassion in everyday life by minimizing harm and caring for those immediately in need, regardless of whether those actions produce the greatest measurable impact.",
  },
  {
    id: "org09",
    scenario: 5,
    variant: "A",
    name: "Future Humanity Foundation",
    ea: true,
    jainValues: false,
    imageAlt: "Two researchers in protective suits work at a laboratory safety cabinet",
    credit: "National Institute of Allergy and Infectious Diseases, public domain",
    description: "Future Humanity Foundation funds research addressing global catastrophic risks, including advanced artificial intelligence safety, biosecurity, and technologies capable of preventing events that could threaten humanity's long-term future. Each year the organization supports 84 international research projects involving scientists, engineers, and public policy experts. Although these initiatives require substantial financial resources and energy-intensive computing infrastructure, the foundation argues that reducing even a tiny probability of human extinction could protect billions of present and future lives. Because the consequences of existential risks are enormous, especially with the rise of agentic AI, the organization believes charitable investments should prioritize expected long-term impact.",
  },
  {
    id: "org10",
    scenario: 5,
    variant: "B",
    name: "Global Outbreak Surveillance Alliance",
    ea: true,
    jainValues: false,
    imageAlt: "Two analysts review a disease map and charts on a large screen",
    credit: "CDC Global, CC BY 2.0",
    description: "Global Outbreak Surveillance Alliance develops international systems for detecting dangerous infectious diseases before they spread widely. Its network currently operates across 61 countries and receives health data from more than 2,400 hospitals, allowing researchers to identify unusual disease patterns in real time. Public health experts estimate approximately a 0.5% annual probability that a highly contagious airborne disease could emerge with the potential to cause millions of deaths worldwide. Although such events are unlikely in any given year, the organization believes that reducing even a small probability of a catastrophic pandemic produces enormous expected benefits. Because successful prevention often goes unnoticed, many of the organization's greatest successes are events that never occur. It evaluates programs based on their expected ability to reduce catastrophic risk rather than their immediate visibility or public recognition.",
  },
  {
    id: "org11",
    scenario: 6,
    variant: "A",
    name: "Health Research Initiative",
    ea: true,
    jainValues: false,
    imageAlt: "A researcher studies medical scan images on several computer screens",
    credit: "Julianne Showalter, U.S. Air Force, public domain",
    description: "Health Research Initiative is an international nonprofit research organization dedicated to accelerating the discovery of treatments and preventive therapies for cancer, Alzheimer's disease, and other life-threatening illnesses. The organization invests in biomedical research and technologies with the potential to improve health outcomes for millions of people over time. During the past year, it funded 37 promising research projects and supported clinical studies involving more than 18,000 participants across multiple countries. Although many of these projects may never produce successful treatments, the organization believes that investing in high-potential research offers the greatest opportunity to reduce future disease burden and save lives on a large scale. Program outcomes are continuously evaluated using scientific evidence, projected health impact, and cost-effectiveness, allowing resources to be directed toward the research expected to generate the greatest long-term benefit for society.",
  },
  {
    id: "org12",
    scenario: 6,
    variant: "B",
    name: "Living Earth Foundation",
    ea: true,
    jainValues: false,
    imageAlt: "A young volunteer kneels beside a tree seedling she has planted",
    credit: "Steve Hillebrand, U.S. Fish and Wildlife Service, public domain",
    description: "Living Earth Foundation is dedicated to protecting the natural world by supporting practical efforts to reduce the environmental damage caused by climate change and energy-intensive technologies. The organization focuses on expanding renewable energy, restoring natural ecosystems, improving energy efficiency, and promoting sustainable land management to reduce greenhouse gas emissions and protect biodiversity. During the past year, it funded 46 community-based climate projects across 15 countries, resulting in the restoration of 7,800 acres of habitat, the installation of 12,500 solar panels, and the prevention of an estimated 185,000 metric tons of carbon dioxide emissions. The organization has also advocated for reducing the environmental impacts associated with rapidly expanding energy-intensive computing infrastructure, including large-scale data centers. Program success is evaluated through measurable reductions in emissions, improvements in ecosystem health, and long-term environmental sustainability. The organization believes that protecting the planet requires reducing humanity's environmental footprint while promoting solutions that benefit both nature and future generations.",
  },
  {
    id: "org13",
    scenario: 7,
    variant: "A",
    name: "AI Data Center Initiative",
    ea: true,
    jainValues: false,
    imageAlt: "Rows of server racks with blinking lights in a data center",
    credit: "Victor Grigas, CC BY-SA 3.0",
    description: "AI Data Center Initiative is a nonprofit research organization that uses artificial intelligence and large-scale data centers to develop solutions for complex global environmental challenges. The organization invests in advanced computing systems that analyze massive datasets to identify the most effective strategies for reducing emissions, improving energy efficiency, and protecting ecosystems. Last year, its AI systems processed more than 21 million environmental datasets and generated 34 high-priority recommendations for governments, researchers, and environmental organizations. Operating these advanced computing systems requires approximately 22 GWh of electricity annually, resulting in substantial environmental impacts associated with large-scale data centers. Despite these costs, the organization argues that AI-driven discoveries have the potential to produce environmental benefits that far exceed the emissions generated by its computing infrastructure. It believes charitable resources should be directed toward projects with the greatest expected long-term benefit, even when achieving those outcomes requires accepting unavoidable environmental trade-offs.",
  },
  {
    id: "org14",
    scenario: 7,
    variant: "B",
    name: "Climate Solutions Initiative",
    ea: true,
    jainValues: false,
    imageAlt: "Researchers in hard hats look over a carbon capture pilot plant",
    credit: "Mm907, CC BY-SA 4.0",
    description: "Climate Solutions Initiative is a nonprofit organization dedicated to reducing the long-term impacts of climate change by investing in interventions expected to produce the greatest global environmental benefit. It supports large-scale initiatives with the potential to significantly reduce future greenhouse gas emissions and improve climate resilience. During the past year, the organization invested in 24 climate innovation projects across 11 countries, supporting research in next-generation carbon removal technologies, low-carbon energy systems, and methods to reduce industrial emissions. Independent analyses estimate that these projects could collectively prevent approximately 8.5 million metric tons of carbon dioxide emissions over the next two decades if successfully implemented. While many of these projects are experimental and some may never succeed, the organization believes that even a small number of successful breakthroughs could generate substantial long-term environmental benefits. Program investments are continually evaluated using scientific evidence, projected emissions reductions, and cost-effectiveness analyses, allowing resources to be directed toward the interventions expected to produce the greatest long-term environmental impact.",
  },
];

export const ORG_IDS = ORGS.map((o) => o.id);
export const orgById = (id: string) => ORGS.find((o) => o.id === id);

export const SCENARIOS = [1, 2, 3, 4, 5, 6, 7] as const;
export const SCENARIOS_SHOWN = 4;
// Two organizations per shown scenario.
export const SHOWN_COUNT = SCENARIOS_SHOWN * 2;

export const orgsInScenario = (scenario: number) => ORGS.filter((o) => o.scenario === scenario).map((o) => o.id);

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

// Runs once at consent and is stored in the session, so it is never redrawn.
// Picks 4 of the 7 scenarios in random order (a shuffle's first four are
// already in random order). Each scenario's two organizations sit next to
// each other, A or B first by coin flip (decision 11.1). Participants never
// see scenario numbers or A/B labels.
export function drawScenarios(): { shownScenarios: number[]; shownOrgIds: OrgId[] } {
  const shownScenarios = shuffle(SCENARIOS).slice(0, SCENARIOS_SHOWN);
  const shownOrgIds = shownScenarios.flatMap((s) => shuffle(orgsInScenario(s)));
  return { shownScenarios, shownOrgIds };
}

// True when shownOrgIds is exactly the two organizations of each shown
// scenario, pair by pair, in the scenarios' order.
export function isValidDraw(shownScenarios: number[], shownOrgIds: string[]): boolean {
  if (shownScenarios.length !== SCENARIOS_SHOWN || new Set(shownScenarios).size !== SCENARIOS_SHOWN) return false;
  if (!shownScenarios.every((s) => (SCENARIOS as readonly number[]).includes(s))) return false;
  if (shownOrgIds.length !== SHOWN_COUNT) return false;
  return shownScenarios.every((s, i) => {
    const pair = shownOrgIds.slice(i * 2, i * 2 + 2);
    return [...pair].sort().join() === orgsInScenario(s).sort().join();
  });
}

// Coin flip for the experimental condition, from the same CSPRNG. Used only
// when the server assignment is unavailable (client_fallback) or in test mode.
export const randomBit = () => randomInt(2) === 1;
