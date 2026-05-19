const l="https://searx.be/search";async function f(a){try{const t=new URL(l);t.searchParams.append("q",a),t.searchParams.append("format","json");const o=await fetch(t.toString());if(!o.ok)throw new Error(`SearXNG API error: ${o.statusText}`);const e=await o.json(),n=`Search Results for "${a}"`;let r="";const i=[];return e.results&&Array.isArray(e.results)&&e.results.length>0&&(r=e.results.slice(0,3).map((s,c)=>`[Source ${c+1}] "${s.title}": ${s.content||s.snippet||""}`).join(`

`),e.results.forEach(s=>{s.title&&s.url&&i.push({text:s.title,url:s.url})})),r||(r="No real-time search results or organic summaries were found for this query."),{type:"web",title:n,summary:r,source:"SearXNG (searx.be)",related:i.slice(0,5)}}catch(t){return console.error("Web Search Error:",t),{type:"web",title:"Search unavailable",summary:"The web search tool encountered a technical limitation (network/CORS).",source:"System",related:[]}}}function h(a,t){const o=/\b(exam|timetable|result|schedule|notification|board|date|class-12|rbse|cbse|ssc|hsc)\b/i.test(a);let e=`CRITICAL GROUNDING CONTEXT for "${a}":
`;return e+=`SEARCH SUMMARY: ${t.summary}

`,t.related.length>0&&(e+=`SOURCE LIST:
`,t.related.slice(0,5).forEach(n=>{const r=/\.(gov\.in|nic\.in|edu\.in)\b/i.test(n.url);e+=`- [${r?"AUTHORITATIVE":"THIRD-PARTY"}] ${n.text}: ${n.url}
`})),e+=`
STRICT INSTRUCTIONS FOR OFFICIAL DATA:`,o?e+=`
1. This query asks for OFFICIAL DATA (dates, results, schedules).
2. RULE: You may ONLY state dates if a source tagged [AUTHORITATIVE] or a known official board website confirms them.
3. RULE: If no [AUTHORITATIVE] source confirms the 2026 dates, you MUST use the following template:
   "The [Official Body] has not yet released the official [Item] for 2026. Based on previous years, it is usually published around [Month], but no dates are confirmed yet."
4. FORBIDDEN: Do not mention "tentative" or "expected" dates from THIRD-PARTY sites.
5. ZERO TOLERANCE for hallucinating timetables or days of the week.`:e+=`
Use the above information as grounding context. If the results are insufficient, rely on your internal base knowledge but never state unverified facts as certainty.`,e}export{h as formatResultsForPrompt,f as searchWeb};
