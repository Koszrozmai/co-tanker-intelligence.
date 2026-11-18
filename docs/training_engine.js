// User-facing study prompts: NOT official inspection questions or guarantees of compliance.
export const REFERENCE_DESK = [
  {
    "id": "imoupdates",
    "title": "IMO — amendments & entry into force",
    "summary": "Official register of IMO amendments and effective dates. Check the actual instrument, applicability and ship particulars.",
    "url": "https://www.imo.org/en/about/conventions/pages/amendments-to-imo-instruments.aspx",
    "topic": "Regulations",
    "region": "Global"
  },
  {
    "id": "imoibc",
    "title": "IMO — chemical carriage / IBC Code",
    "summary": "Starting point for carriage rules, IBC and MARPOL Annex II; consult applicable authoritative legal texts and ship documents.",
    "url": "https://www.imo.org/en/ourwork/environment/pages/chemicalpollution-default.aspx",
    "topic": "Cargo",
    "region": "Global"
  },
  {
    "id": "sire",
    "title": "OCIMF — SIRE 2.0",
    "summary": "Official SIRE 2.0 programme materials, question library and operator/inspector guidance.",
    "url": "https://www.ocimf.org/programmes/sire-2-0/",
    "topic": "SIRE 2.0",
    "region": "Global"
  },
  {
    "id": "cdi",
    "title": "CDI-Marine — inspection process",
    "summary": "Official CDI-M inspection process; obtain current programme materials and question sets through authorised channels.",
    "url": "https://www.cdim.org/psp/cdim.wp_inspection_process",
    "topic": "CDI-M",
    "region": "Global"
  },
  {
    "id": "cdi_docs",
    "title": "CDI-M — publications",
    "summary": "Official CDI-M downloads and publication catalogue, including materials with restricted or paid access.",
    "url": "https://cdim.org/psp/cdim.wp_download_documents",
    "topic": "CDI-M",
    "region": "Global"
  },
  {
    "id": "paris",
    "title": "Paris MoU — official 2026 notices",
    "summary": "Official PSC publications and campaigns in the European trading area. A CIC may not apply to every tanker.",
    "url": "https://parismou.org/2026/",
    "topic": "PSC",
    "region": "Europe"
  },
  {
    "id": "cyprus",
    "title": "Cyprus SDM — circulars 2026",
    "summary": "Flag circular index. Confirm whether a particular circular applies to your vessel and its effective date.",
    "url": "https://www.gov.cy/dms/en/documents/circulars-2026/",
    "topic": "Flag",
    "region": "Cyprus"
  },
  {
    "id": "cyprus_onboard",
    "title": "Cyprus SDM — onboard circular list",
    "summary": "Official list of circulars required on board Cyprus-flagged ships; verify latest revisions.",
    "url": "https://www.gov.cy/dms/en/documents/list-of-circulars-required-to-be-on-board-cyprus-flag-vessels/",
    "topic": "Flag",
    "region": "Cyprus"
  },
  {
    "id": "emsa",
    "title": "EMSA — maritime safety",
    "summary": "EU maritime safety and policy-related updates; identify the underlying legal or implementing instrument.",
    "url": "https://www.emsa.europa.eu/",
    "topic": "EU",
    "region": "Europe"
  }
];
export const PRACTICE_QUESTIONS = [
  {
    "id": "q01",
    "inspection": "psc",
    "topic": "Certificates",
    "question": "What should you do if a statutory certificate seems current but the related survey endorsement cannot be located?",
    "guidance": "Check original approved records and survey status, escalate to Master/company/class or flag as appropriate; do not represent the certificate as compliant until verified.",
    "url": "https://www.imo.org/en/ourwork/iiis/pages/port%20state%20control.aspx"
  },
  {
    "id": "q02",
    "inspection": "psc",
    "topic": "Crew knowledge",
    "question": "A PSCO asks a deck rating to explain the emergency escape route from the work area. How would you prepare the crew?",
    "guidance": "Use meaningful onboard familiarisation and demonstrations, not rehearsed scripted answers; verify signage, accessibility and muster awareness.",
    "url": "https://www.imo.org/en/ourwork/iiis/pages/port%20state%20control.aspx"
  },
  {
    "id": "q03",
    "inspection": "psc",
    "topic": "Fire equipment",
    "question": "An extinguisher position is blocked by stores during a port stay. What action is appropriate?",
    "guidance": "Clear the obstruction immediately, inspect relevant fire readiness areas, document and address the cause under shipboard procedures.",
    "url": "https://www.imo.org/en/ourwork/iiis/pages/port%20state%20control.aspx"
  },
  {
    "id": "q04",
    "inspection": "psc",
    "topic": "Deficiencies",
    "question": "How should a Chief Officer treat an unresolved defect before the vessel arrives at a Paris MoU port?",
    "guidance": "Assess risk and operational impact, report accurately through Master and SMS, track corrective actions, and use flag/class/port notifications where applicable.",
    "url": "https://parismou.org/"
  },
  {
    "id": "q05",
    "inspection": "psc",
    "topic": "MARPOL",
    "question": "Which documents help verify residue-disposal controls for noxious liquid substances?",
    "guidance": "Review approved P&A Manual, Cargo Record Book, relevant cargo categories, washing/disposal records and reception facility documents as applicable.",
    "url": "https://www.imo.org/en/ourwork/environment/pages/chemicalpollution-default.aspx"
  },
  {
    "id": "q06",
    "inspection": "psc",
    "topic": "Mooring",
    "question": "What physical and documentary checks would you prioritise in the mooring area?",
    "guidance": "Review condition and safe operation of ropes, leads, brake tests/records as required, snap-back controls, housekeeping and crew understanding.",
    "url": "https://parismou.org/"
  },
  {
    "id": "q07",
    "inspection": "psc",
    "topic": "Hours of rest",
    "question": "How should you respond if recorded rest hours conflict with actual cargo watches?",
    "guidance": "Address fatigue and manning immediately, correct records truthfully according to SMS, escalate to Master and investigate the underlying planning issue.",
    "url": "https://www.imo.org/en/ourwork/humanelement/pages/stcw-conv-link.aspx"
  },
  {
    "id": "q08",
    "inspection": "psc",
    "topic": "Port campaign",
    "question": "How would you verify whether a newly announced PSC campaign applies to your chemical tanker?",
    "guidance": "Read the official campaign scope, dates, geographical coverage and question sheet; never assume a general cargo headline applies automatically.",
    "url": "https://parismou.org/2026/"
  },
  {
    "id": "q09",
    "inspection": "sire",
    "topic": "Interview",
    "question": "An inspector asks why an operational risk control is in your cargo plan. What makes a credible answer?",
    "guidance": "Explain the actual hazard, how the control is implemented, what you personally verify and how crew are briefed. Avoid memorised answers disconnected from practice.",
    "url": "https://www.ocimf.org/programmes/sire-2-0/"
  },
  {
    "id": "q10",
    "inspection": "sire",
    "topic": "Human factors",
    "question": "How can you demonstrate that crew understand a stop-work expectation during cargo transfer?",
    "guidance": "Ask for practical examples, confirm authority to stop and communication routes, and observe authentic behaviour during operations.",
    "url": "https://www.ocimf.org/programmes/sire-2-0/"
  },
  {
    "id": "q11",
    "inspection": "sire",
    "topic": "Pre-inspection",
    "question": "How should you use the public SIRE 2.0 Question Library?",
    "guidance": "Use published OCIMF guidance to identify systems, human factors and process areas; check real onboard evidence. Do not claim to predict a particular inspection CVIQ.",
    "url": "https://www.ocimf.org/programmes/sire-2-0/"
  },
  {
    "id": "q12",
    "inspection": "sire",
    "topic": "Cargo plan",
    "question": "Which aspects of a planned load/discharge are worth explaining at a SIRE 2.0 interview?",
    "guidance": "Cargo characteristics, stability/stress limits, transfer line-up, rate/pressure limits, atmosphere control, emergency actions, monitoring and crew roles as applicable.",
    "url": "https://www.ocimf.org/programmes/sire-2-0/"
  },
  {
    "id": "q13",
    "inspection": "sire",
    "topic": "Permit to work",
    "question": "A permit form is complete, but the job site controls differ from those specified. What matters?",
    "guidance": "Stop or make safe as necessary; confirm physical isolations, atmospheric checks and risk controls, correct the process and engage the team. A signature is not evidence alone.",
    "url": "https://www.ocimf.org/programmes/sire-2-0/"
  },
  {
    "id": "q14",
    "inspection": "sire",
    "topic": "Equipment",
    "question": "Why is it useful to ask crew to demonstrate normal equipment checks instead of only reviewing a PMS entry?",
    "guidance": "A physical demonstration shows understanding, configuration, limitations and whether recorded checks correspond to actual shipboard practice.",
    "url": "https://www.ocimf.org/programmes/sire-2-0/"
  },
  {
    "id": "q15",
    "inspection": "sire",
    "topic": "Leadership",
    "question": "How should a Chief Officer respond when a junior officer raises a concern about a cargo line-up?",
    "guidance": "Treat the challenge constructively, pause if risk warrants, physically verify the system together, document discrepancies and reinforce speaking up.",
    "url": "https://www.ocimf.org/programmes/sire-2-0/"
  },
  {
    "id": "q16",
    "inspection": "sire",
    "topic": "Evidence",
    "question": "What is the difference between a review note and verified inspection evidence?",
    "guidance": "A review note records a concern or suggestion; verified evidence requires actual observation, authentic records or a completed test by competent shipboard personnel.",
    "url": "https://www.ocimf.org/programmes/sire-2-0/"
  },
  {
    "id": "q17",
    "inspection": "cdi",
    "topic": "Cargo acceptance",
    "question": "Before loading a chemical cargo, which ship-specific documents deserve priority?",
    "guidance": "Current Certificate of Fitness and cargo list, relevant IBC carriage conditions, SDS, coating compatibility, cargo plan, approved procedures and terminal requirements.",
    "url": "https://www.imo.org/en/ourwork/environment/pages/chemicalpollution-default.aspx"
  },
  {
    "id": "q18",
    "inspection": "cdi",
    "topic": "Cleaning",
    "question": "How should you decide whether a tank is ready for a sensitive nominated cargo?",
    "guidance": "Match previous cargo/cleaning history to approved cleaning instructions, coating limitations and charterer specifications; use actual inspection/testing evidence where required.",
    "url": "https://www.cdim.org/psp/cdim.wp_inspection_process"
  },
  {
    "id": "q19",
    "inspection": "cdi",
    "topic": "Atmosphere",
    "question": "Why should an officer avoid copying a generic oxygen or LEL limit for all cargo operations?",
    "guidance": "Limits depend on product hazards, operation, equipment, atmosphere and approved ship-specific rules; verify applicable regulations, SMS and instrument instructions.",
    "url": "https://www.imo.org/en/ourwork/environment/pages/chemicalpollution-default.aspx"
  },
  {
    "id": "q20",
    "inspection": "cdi",
    "topic": "Wall wash",
    "question": "What should you establish before relying on a wall wash test result?",
    "guidance": "Confirm the charterer/test specification, sampling method, test media, contamination controls, equipment calibration and the documented acceptance criteria.",
    "url": "https://www.cdim.org/psp/cdim.wp_inspection_process"
  },
  {
    "id": "q21",
    "inspection": "cdi",
    "topic": "Annex II",
    "question": "Which factors determine whether a prewash is required and how residues are handled?",
    "guidance": "Check actual cargo category, unloading location, approved P&A Manual and applicable MARPOL Annex II provisions; verify reception arrangements and records.",
    "url": "https://www.imo.org/en/ourwork/environment/pages/chemicalpollution-default.aspx"
  },
  {
    "id": "q22",
    "inspection": "cdi",
    "topic": "Transfer",
    "question": "What is the value of independent line-up verification before cargo transfer?",
    "guidance": "It helps catch wrong valve positions, cross-contamination paths and incorrect shore connections before flow begins; implement approved two-person verification where required.",
    "url": "https://www.cdim.org/psp/cdim.wp_inspection_process"
  },
  {
    "id": "q23",
    "inspection": "cdi",
    "topic": "Pumps",
    "question": "What should you investigate after repeated slop-pump seal failures?",
    "guidance": "Review actual product compatibility, dry running, suction conditions, alignment, mechanical seal design, operating pressures and maintenance history with technical team.",
    "url": "https://www.cdim.org/"
  },
  {
    "id": "q24",
    "inspection": "cdi",
    "topic": "Spill prevention",
    "question": "What can a CDI inspector infer from repeatedly poor drip-tray/scupper housekeeping?",
    "guidance": "Potential weaknesses in pollution prevention practices, supervision and inspections; verify controls physically and correct causes, not just appearance.",
    "url": "https://www.cdim.org/psp/cdim.wp_inspection_process"
  }
];
const dateOnly=(d)=>{const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return `${y}-${m}-${day}`;};
export const today=()=>dateOnly(new Date());
export function ensurePractice(state){if(!state.practice||typeof state.practice!=='object'||Array.isArray(state.practice))state.practice={reviews:{},sessions:0};if(!state.practice.reviews||typeof state.practice.reviews!=='object')state.practice.reviews={};return state.practice;}
export function sanitizePractice(raw){const out={reviews:{},sessions:0};if(!raw||typeof raw!=='object')return out;const ids=new Set(PRACTICE_QUESTIONS.map(q=>q.id));const rev=raw.reviews&&typeof raw.reviews==='object'?raw.reviews:{};
 for(const [key,v] of Object.entries(rev)){if(!ids.has(key)||!v||typeof v!=='object')continue;const streak=Math.min(100,Math.max(0,Number(v.streak)||0));const due=/^20\d\d-\d\d-\d\d$/.test(v.due||'')?v.due:today();out.reviews[key]={streak,due,last:String(v.last||'').slice(0,24),lastRating:['again','soon','confident'].includes(v.lastRating)?v.lastRating:'soon'};}
 out.sessions=Math.min(100000,Math.max(0,Math.floor(Number(raw.sessions)||0)));return out;}
export function rateQuestion(state,id,rating,now=new Date()){
 const q=PRACTICE_QUESTIONS.find(x=>x.id===id);if(!q||!['again','soon','confident'].includes(rating))return {ok:false,error:'Unknown question or rating'};
 const p=ensurePractice(state),v=p.reviews[id]||{streak:0},nextStreak=rating==='confident'?Math.min((v.streak||0)+1,20):rating==='soon'?Math.max(0,(v.streak||0)-1):0;
 const days=rating==='again'?0:rating==='soon'?2:Math.min(60,nextStreak<=1?7:nextStreak===2?14:nextStreak===3?30:60);
 const d=new Date(now.getFullYear(),now.getMonth(),now.getDate()+days,12);
 p.reviews[id]={streak:nextStreak,due:dateOnly(d),last:now.toISOString(),lastRating:rating};p.sessions=(p.sessions||0)+1;
 return {ok:true,review:p.reviews[id]};
}
export function dueQuestions(state,filter='all',day=today()){
 const p=ensurePractice(state);
 return PRACTICE_QUESTIONS.filter(q=>(filter==='all'||q.inspection===filter)&&(!p.reviews[q.id]||p.reviews[q.id].due<=day)).sort((a,b)=>{
  const da=p.reviews[a.id]?.due||'0000-00-00',db=p.reviews[b.id]?.due||'0000-00-00';return da.localeCompare(db)||a.id.localeCompare(b.id);
 });
}

export const VERIFIED_BRIEFS = [
  {
    "title": "Paris / Tokyo MoU — 2026 cargo securing CIC",
    "status": "ACTIVE CAMPAIGN · SCOPE CHECK",
    "date": "2026-09-01 → 2026-11-30",
    "summary": "This concentrated inspection campaign concerns securing cargo units and cargo transport units under SOLAS. Do not assume that its questionnaire directly addresses bulk liquid chemical cargoes. Check official scope before applying it to your tanker.",
    "url": "https://parismou.org/paris-and-tokyo-mous-launch-2026-concentrated-inspection-campaign-on-cargo-securing/"
  },
  {
    "title": "IMO MEPC 85 — upcoming meeting",
    "status": "MEETING PREVIEW · NOT ADOPTED",
    "date": "2026-11-30 → 2026-12-03",
    "summary": "IMO agenda includes possible BWM amendments, MARPOL amendments and potential pressure-vacuum device requirements for crude-oil tankers. These are agenda proposals; track the final outcome, applicable ship types and later entry-into-force dates.",
    "url": "https://www.imo.org/en/mediacentre/meetingsummaries/pages/preview-mepc-85.aspx"
  },
  {
    "title": "IMO MSC 111 — draft IBC substances",
    "status": "DRAFT · NOT AN IN-FORCE RULE",
    "date": "2026-05-13 → 2026-05-22",
    "summary": "The Maritime Safety Committee agreed draft IBC Code amendments concerning substances provisionally classified under MEPC.2 guidance. Check later adoption and effective dates before changing carriage procedures.",
    "url": "https://www.imo.org/en/mediacentre/meetingsummaries/pages/temporary-msc-111.aspx"
  },
  {
    "title": "IMO MSC 111 — VDES as AIS alternative",
    "status": "ADOPTED · FUTURE EFFECTIVE DATE",
    "date": "2028-01-01",
    "summary": "IMO states SOLAS V/19 changes permitting VDES as an alternative to AIS enter into force on 1 January 2028. Check vessel-specific applicability and class/flag guidance before planning equipment action.",
    "url": "https://www.imo.org/en/mediacentre/meetingsummaries/pages/temporary-msc-111.aspx"
  }
];
