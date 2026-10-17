import type { Dictionary } from "./types";
import { ORGS } from "../orgs";

const agree = { low: "Strongly disagree", high: "Strongly agree" };

export const en: Dictionary = {
  langName: "English",
  masthead: {
    protocolLabel: "Research study consent and survey",
    protocolTitle: "Jain Philanthropy and Effective Altruism",
    // Official identifier: kept in English in every language.
    irbLabel: "USF IRB Study No. 010845",
  },
  footer: {
    investigators: "Principal investigators: Prof. Justin Henry and AJ Chauradia",
    hypothetical: "The giving exercise in this study is hypothetical. No payment is collected and no money is transferred to any organization.",
    privacy: "Responses are stored without IP addresses. Your email is separated from your answers during storage.",
  },
  landing: {
    title: "Welcome to our survey!",
    p1: "This survey is in support of a study on \u201cJain Philanthropy and Effective Altruism\u201d conducted by researchers at the University of South Florida and will take approximately 20 minutes to complete. The purpose of the study is to understand the choices that American Jains make in their support of various charitable organizations, including differences in generational tendencies as well as underlying motivations (e.g. religious v. secular) for making choices in charitable donation. The survey asks for some general information about your current giving status after which you will watch a short video and complete a short questionnaire regarding hypothetical donations to a set of charitable organizations. Please note that the organizations listed in this section of the survey are fictional and any similarities they may have to current global charities are purely coincidental. The only identifying personal information you will be asked to provide is your email address. We do not anticipate any risks to you in undertaking this survey. Our paper on Jain charitable giving will be shared with JSTB for distribution following publication.",
    contactLead: "Contact the survey researchers should you wish to follow up with them for any reason: Prof. Justin Henry",
    contactJoin: "and AJ Chauradia",
    p3: "You are free to stop taking the online survey at any time, in which case none of the data you have entered to that point will be used or electronically stored. Publication of data from this study will be purely anonymous in aggregate form. No identifying information will be made public from this study. For more information on the digital security of data collected from this study, see below.",
    confirmHeading: "To participate, please confirm:",
    q1: "I am at least 18 years old and I agree to participate in this anonymous survey.",
    q1yes: "Yes, I agree",
    q1no: "No (end survey)",
    q2: "Do you identify as Jain (by religion, family background, or regular practice)?",
    q2yes: "Yes",
    q2no: "No (screen out / end survey)",
    q3: "Do you currently live in the United States?",
    q3yes: "Yes",
    q3no: "No (screen out / end survey)",
    consentButton: "Click here to consent to participate in this study",
    error: "Please answer all three questions to continue.",
    subtext: "The online survey will be administered through a secure, encrypted (HTTPS/TLS) web platform. Data transmitted between participants\u2019 devices and the survey server will be encrypted in transit using industry-standard protocols. Data stored on the investigators\u2019 encrypted database does not record the respondent\u2019s IP address, though since transmission is initiated through the participant\u2019s personal digital device, internet confidentiality cannot be completely guaranteed. No personal identifying information beyond that explicitly collected for informed consent will be transmitted or stored with survey responses, and all study data will be exported promptly after data collection. Identifying information (your email) will be removed from the private responses to the survey in the process of data storage and will not be used for any other future studies without the participant\u2019s later consent.",
  },
  screenedOut: {
    title: "Thank you for your interest",
    body: "This study is limited to adults who identify as Jain and currently live in the United States, so the survey ends here. No information you entered has been stored.",
    contactLead: "Questions about the study can be sent to",
  },
  common: {
    other: "Other:",
    otherPlaceholder: "Please specify",
    emailError: "Please enter a valid email address.",
    stepOf: (n, total) => `Step ${n} of ${total}`,
  },
  survey: {
    title: "About you and your giving",
    submit: "Continue to the video",
    sections: [
      {
        id: "contact",
        title: "Contact",
        instructions: "Your email is the only identifying information collected. It is removed from your responses during storage.",
        questions: [{ id: "email", type: "text", inputType: "email", text: "Email address" }],
      },
      {
        id: "A",
        title: "Section A: Background",
        questions: [
          { id: "A1", type: "radio", text: "Age", options: ["18 to 24", "25 to 34", "35 to 44", "45 to 54", "55 to 64", "65+", "Prefer not to say"] },
          { id: "A2", type: "radio", text: "Gender", options: ["Woman", "Man", "Non-binary / gender diverse", "Prefer not to say"], allowOther: true },
          { id: "A3", type: "radio", text: "Highest education completed", options: ["High school or less", "Some college", "Associate's degree", "Bachelor's degree", "Graduate/professional degree", "Prefer not to say"] },
          { id: "A4", type: "radio", text: "Occupation category (choose closest)", options: ["Tech / Engineering", "Medicine / Healthcare", "Business / Finance", "Academia / Education"], allowOther: true },
          { id: "A5", type: "radio", text: "City/region", options: ["Tampa Bay area", "Orlando area", "Miami/Fort Lauderdale area", "Other Florida"], allowOther: true },
          { id: "A6", type: "radio", text: "Generational status", options: ["US-born", "Born outside the US"] },
          { id: "A7", type: "text", inputType: "number", text: "If born outside the US, years living in the US" },
        ],
      },
      {
        id: "B",
        title: "Section B: Baseline giving behavior",
        questions: [
          { id: "B1", type: "radio", text: "In the past 12 months, did you donate money to any charitable organization(s)?", options: ["Yes", "No", "Prefer not to say"] },
          { id: "B2", type: "radio", text: "If yes, about how much did you donate in total in the past 12 months?", options: ["Less than $100", "$100 to $499", "$500 to $999", "$1,000 to $4,999", "$5,000+", "Prefer not to say"] },
          { id: "B3", type: "radio", text: "If yes, was some or all of this a contribution to a Jain temple (e.g., aarti, temple donation, swamivatsalya/sponsored lunch)? If so, roughly what percentage of your total giving went to the temple?", options: ["All of it", "Most of it (more than half)", "Some of it (less than half)", "None of it", "Prefer not to say"] },
          { id: "B4", type: "radio", text: "Do you believe that supporting a charitable organization outside the temple could generate negative karmic consequences for the donor (e.g., through the organization's actions)?", options: ["Yes", "No", "Unsure"] },
          { id: "B5", type: "checkbox", text: "Beyond any temple donations, when you donate, which types of organizations do you typically prioritize? (select all that apply)", options: ["Local community services", "Education (e.g., scholarships, schools)", "Animal welfare", "Environment / climate", "Health / poverty relief"], allowOther: true },
          { id: "B6", type: "radio", text: "Beyond monetary donations, do you volunteer your time to any charitable organizations?", options: ["Yes, primarily at/through the temple", "Yes, primarily outside the temple", "Yes, both", "No"] },
          { id: "B7", type: "scale", text: "If you donate to charitable organizations outside a temple, how important is it that an organization is Jain-run or Jain-affiliated?", low: "Not important at all", high: "Extremely important" },
        ],
      },
      {
        id: "C",
        title: "Section C: Jain ethics and harm-minimization",
        instructions: "Please rate how much you agree with each statement.",
        questions: [
          { id: "C1", type: "scale", text: "I try to minimize harm to living beings (ahimsa) in my daily decisions.", ...agree },
          { id: "C2", type: "scale", text: "When giving charity, I worry about unintended harm caused by an organization's actions.", ...agree },
          { id: "C3", type: "scale", text: "Environmental impact is an important part of \u201cdoing the right thing.\u201d", ...agree },
          { id: "C4", type: "scale", text: "Helping animals is an important moral priority.", ...agree },
          { id: "C5", type: "scale", text: "Even well-intentioned charity can create harm if it is not carefully designed.", ...agree },
        ],
      },
      {
        id: "D",
        title: "Section D: Familiarity with evidence-based giving",
        questions: [
          { id: "D1", type: "radio", text: "Before today, had you heard of \u201ceffective altruism\u201d or \u201cevidence-based philanthropy\u201d?", options: ["Yes, and I know a lot about it", "Yes, but only a little", "No"] },
          { id: "D2", type: "scale", text: "Charities should be compared using measurable outcomes (e.g., lives improved per dollar).", ...agree },
          { id: "D3", type: "scale", text: "Focusing too much on metrics can miss important moral values.", ...agree },
          { id: "D4", type: "scale", text: "I trust charities more when they share clear evidence and transparent reporting.", ...agree },
        ],
      },
    ],
  },
  watch: {
    title: "Please watch this short video",
    lede: "The Continue button becomes available near the end of the video.",
    noVideo: "The video could not be loaded. Please refresh the page. If it still does not appear, contact the researchers listed below.",
    watched: (pct) => `${pct}% watched`,
    cont: "Continue to the giving portal",
  },
  give: {
    title: "Giving portal",
    lede: "You have $1,000 to give. Read about each organization, then give to up to three of them. You may give the whole $1,000 to one organization. Please give the full $1,000 before you review and confirm.",
    hypothetical: "This is a hypothetical exercise for research. All organizations and money in this exercise are hypothetical and were created only for this study. No payment is processed and no money is sent to any organization.",
    balance: "Available to give",
    remaining: (n) => `${n} left to give`,
    complete: "All $1,000 allocated",
    readMore: "Read more",
    confirm: "Confirm",
    change: "Change",
    remove: "Remove",
    close: "Close",
    amountLabel: "Gift amount in whole dollars ($1 to $1,000)",
    yourGift: "Your gift",
    errAmount: "Enter a whole-dollar amount from $1 to $1,000.",
    errOver: (n) => `That is more than you have left. ${n} remaining.`,
    errMaxGifts: "You can give to at most three organizations. Remove or change a gift to add another.",
    continueReason: (n) => `Allocate the full $1,000 to continue. ${n} remaining.`,
    giftsChosen: (n) => `${n} of 3 organizations chosen`,
    review: "Review and confirm gifts",
  },
  review: {
    title: "Review your gifts",
    lede: "Please check the amounts below. You can go back to change them.",
    total: "Total",
    edit: "Back to giving portal",
    confirm: "Confirm gifts",
  },
  confirmation: {
    title: "Thank you for your gifts",
    body: "Your hypothetical gifts have been recorded for this study. A summary is shown below for your reference.",
    reference: "Reference",
    cont: "Continue to final questions",
  },
  post: {
    title: "A few final questions",
    submit: "Submit my responses",
    error: "Your responses could not be saved. Please check your connection and try again.",
    sections: [
      {
        id: "F",
        title: "About your gifts",
        questions: [
          // Options are filled in at runtime with the organizations this participant funded (app/post/page.tsx).
          { id: "F2", type: "radio", text: "Which organization did you give the most to?", options: [] },
          { id: "F3", type: "scale", text: "How confident do you feel about your allocation?", low: "Not at all confident", high: "Extremely confident" },
          { id: "F4", type: "checkbox", text: "What influenced your allocation the most? (select up to 2)", options: ["Alignment with Jain principles", "Measurable impact / evidence", "Familiarity / trust", "Local/community connection", "Urgency of need"], max: 2, allowOther: true },
        ],
      },
      {
        id: "G",
        title: "Section G: Your reactions",
        instructions: "Please rate how much you agree with each statement.",
        questions: [
          { id: "G1", type: "scale", text: "The information I read made it easier to compare where my donation would do the most good.", ...agree },
          { id: "G2", type: "scale", text: "I would consider donating to a non-Jain-run organization if it clearly followed Jain-aligned safeguards.", ...agree },
          { id: "G3", type: "scale", text: "Impact metrics (e.g., cost per outcome) increased my trust in the organization(s).", ...agree },
          { id: "G4", type: "scale", text: "Jain-aligned safeguards increased my trust in the organization(s).", ...agree },
          { id: "G5", type: "scale", text: "I felt the information respected Jain values rather than replacing them.", ...agree },
          { id: "G6", type: "scale", text: "I would like to learn more about evidence-based philanthropy.", ...agree },
        ],
      },
      {
        id: "H",
        title: "Section H: In your own words",
        questions: [
          { id: "H1", type: "textarea", text: "What does \u201cresponsible giving\u201d mean to you as a Jain (if applicable)?" },
          { id: "H2", type: "textarea", text: "What concerns would you have about charities that emphasize impact metrics?" },
          { id: "H3", type: "textarea", text: "What safeguards would you want to see before supporting a charity outside the Jain community?" },
        ],
      },
    ],
  },
  done: {
    title: "Thank you for participating",
    body: "Your responses have been recorded. You may now close this window.",
    contactLead: "If you have questions about this study, please contact",
  },
  // English names and descriptions come straight from lib/orgs.ts (verbatim).
  orgs: Object.fromEntries(ORGS.map((o) => [o.id, { name: o.name, description: o.description }])) as Dictionary["orgs"],
};
