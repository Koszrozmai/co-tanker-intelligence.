/* Built-in sources are source-index pages, not an assertion of complete regulatory coverage. */
export const BASE_SOURCES = [
  {id:'imo',name:'IMO · Press Briefings',region:'Global',kind:'Authority',mode:'html',url:'https://www.imo.org/en/mediacentre/pressbriefings/pages/default.aspx',selector:'h3 a[href]',icon:'IMO'},
  {id:'cyprus',name:'Cyprus Flag · Circulars',region:'Flag',kind:'Flag Administration',mode:'cyprus',url:'https://www.gov.cy/dms/en/documents/circulars-'+new Date().getUTCFullYear()+'/',icon:'CY'},
  {id:'paris',name:'Paris MoU · PSC',region:'Europe',kind:'PSC Authority',mode:'paris',url:'https://parismou.org/posts/news/',icon:'PSC'},
  {id:'intertanko',name:'INTERTANKO · News Desk',region:'Global',kind:'Industry (partly restricted)',mode:'html',url:'https://www.intertanko.com/news-desk',selector:'a[href*="/news-desk/newsdeskarticle/"]',icon:'IT'},
  {id:'ocimf',name:'OCIMF · Members’ News',region:'Global',kind:'Industry guidance',mode:'html',url:'https://www.ocimf.org/news-and-events/newsletter',selector:'a[href*="/news-and-events/newsletter/issue-"]',icon:'OC'},
  {id:'emsa',name:'EMSA · Latest News',region:'Europe',kind:'EU Agency',mode:'html',url:'https://www.emsa.europa.eu/newsroom/latest-news.html',selector:'a[href*="/newsroom/latest-news/item/"]',icon:'EU'},
  {id:'bimco',name:'BIMCO · Industry News',region:'Global',kind:'Industry guidance',mode:'html',url:'https://www.bimco.org/news-insights/bimco-news/',selector:'a[href*="/news-insights/bimco-news/20"]',icon:'BI'},
  {id:'echa',name:'ECHA · Chemicals News',region:'Europe',kind:'EU Agency',mode:'html',url:'https://echa.europa.eu/news',selector:'a[href*="/news-and-events/"], a[href*="/news/"]',icon:'CH'},
  {id:'mca',name:'UK MCA · Maritime notices',region:'Europe',kind:'Authority',mode:'html',url:'https://www.gov.uk/government/organisations/maritime-and-coastguard-agency',selector:'a[href*="/government/publications/"], a[href*="/government/news/"]',icon:'UK'}
];
export const QUICK_LINKS = [
  {group:'Mandatory instruments / primary sources',name:'IMO Conventions (SOLAS, MARPOL, STCW)',url:'https://www.imo.org/en/about/conventions/pages/listofconventions.aspx',scope:'Global – verify amendments & entry into force'},
  {group:'Mandatory instruments / primary sources',name:'IMO Circulars & Documents',url:'https://www.imo.org/en/ourwork/pages/circulars.aspx',scope:'Not all documents are public'},
  {group:'Mandatory instruments / primary sources',name:'Cyprus flag · Documents',url:'https://www.gov.cy/dms/en/documents/',scope:'Flag notices & circulars'},
  {group:'Mandatory instruments / primary sources',name:'EUR-Lex · EU Law',url:'https://eur-lex.europa.eu/',scope:'EU/EEA legal instruments & consolidated text'},
  {group:'Mandatory instruments / primary sources',name:'UK MCA · Ships and cargoes',url:'https://www.gov.uk/government/collections/ships-and-cargoes-guidance-and-bulletins',scope:'UK notices and safety bulletins'},
  {group:'Port State Control',name:'Paris MoU · Inspection tools',url:'https://parismou.org/',scope:'European ports and North Atlantic'},
  {group:'Port State Control',name:'Tokyo MoU',url:'https://www.tokyo-mou.org/',scope:'Asia–Pacific PSC'},
  {group:'Tankers & operational standards',name:'CDI-M · Inspection process',url:'https://www.cdim.org/psp/cdim.wp_inspection_process',scope:'Chemical tanker vetting procedures'},
  {group:'Tankers & operational standards',name:'CDI-M · Documents & publications',url:'https://cdim.org/psp/cdim.wp_download_documents',scope:'Current inspection materials / publications'},
  {group:'Tankers & operational standards',name:'OCIMF SIRE 2.0',url:'https://www.ocimf.org/programmes/sire-2-0/',scope:'Vetting programme / user guidance'},
  {group:'Tankers & operational standards',name:'INTERTANKO',url:'https://www.intertanko.com/',scope:'Tanker industry updates, some members-only'},
  {group:'Tankers & operational standards',name:'ICS',url:'https://www.ics-shipping.org/',scope:'Industry guidance'},
  {group:'Tankers & operational standards',name:'IACS',url:'https://iacs.org.uk/',scope:'Class unified requirements / interpretations'},
  {group:'EU / environmental',name:'European Maritime Safety Agency',url:'https://www.emsa.europa.eu/',scope:'Maritime safety policy and operations'},
  {group:'EU / environmental',name:'European Chemicals Agency',url:'https://echa.europa.eu/',scope:'Chemical classification / REACH / CLP (scope-dependent)'},
  {group:'EU / environmental',name:'EU Transport – Maritime',url:'https://transport.ec.europa.eu/transport-modes/maritime_en',scope:'EU maritime policy & legislation'},
  {group:'Worldwide safety',name:'US Coast Guard · Maritime',url:'https://www.dco.uscg.mil/Our-Organization/Assistant-Commandant-for-Prevention-Policy-CG-5P/Marine-Safety-Center-MSC/',scope:'United States marine safety resources'},
  {group:'Worldwide safety',name:'ReCAAP ISC',url:'https://www.recaap.org/',scope:'Asia maritime security alerts'}
];
export const TOPICS = [
 {id:'cargo',title:'Chemical cargo operations',subtitle:'IBC Code · MARPOL Annex II · P&A Manual',desc:'Check cargo-specific carriage conditions, pollution category, tank cleaning, stripping, prewash and discharge restrictions. Use the vessel’s approved manuals and latest IBC/flag requirements.',queries:['MARPOL Annex II','IBC Code','chemical tanker','prewash','cargo containment']},
 {id:'vetting',title:'SIRE 2.0 and vetting',subtitle:'OCIMF · inspection readiness',desc:'Monitor programme changes, photo repository guidance, human factors and inspection preparation. SIRE is an industry vetting programme, not a SOLAS amendment.',queries:['SIRE 2.0','OCIMF','vetting','human factors']},
 {id:'psc',title:'PSC & inspection campaigns',subtitle:'Paris MoU · CIC · deficiency trends',desc:'Review current concentrated inspection campaigns and common deficiency areas for European ports; verify whether the campaign applies to your vessel.',queries:['Paris MoU','PSC','CIC','inspection campaign']},
 {id:'environment',title:'Environmental compliance',subtitle:'MARPOL · EU ETS · FuelEU Maritime',desc:'Separate ship/technical duties from owner, company and verifier responsibilities. Confirm dates, scope, ship size and voyage applicability before acting.',queries:['MARPOL','EU ETS','FuelEU Maritime','ballast water']},
 {id:'operations',title:'Tanker safety & shipboard work',subtitle:'ISGOTT · enclosed spaces · permits to work',desc:'Cross-check operational guidance with ship-specific SMS/QMS, permits, cargo plans, equipment manuals and terminal requirements.',queries:['ISGOTT','enclosed space','mooring','tank cleaning','permit to work']},
 {id:'navigation',title:'Navigation & regional security',subtitle:'SOLAS V · piracy · route notices',desc:'Include route-specific risk assessment, official navigation warnings, company instructions and relevant coastal-State restrictions.',queries:['SOLAS V','Strait of Hormuz','Red Sea','navigation','security']}
];
export const DEFAULT_SETTINGS = {intervalMinutes:60,notify:true,europeFirst:true,hideRead:false,maxAgeDays:365, enabledIds: BASE_SOURCES.map(s=>s.id), keywords:'chemical tanker, cargo, MARPOL, SOLAS, IBC, SIRE, CDI, vetting, PSC, tank cleaning, enclosed space, Cyprus, Paris MoU, PSC, EU ETS, FuelEU Maritime, ballast water, safety, mooring'};
