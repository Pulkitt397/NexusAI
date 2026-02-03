const l="https://api.duckduckgo.com/";async function u(r){try{const t=new URL(l);t.searchParams.append("q",r),t.searchParams.append("format","json"),t.searchParams.append("no_redirect","1"),t.searchParams.append("no_html","1"),t.searchParams.append("t","nexusai");const s=await fetch(t.toString());if(!s.ok)throw new Error(`DuckDuckGo API error: ${s.statusText}`);const e=await s.json(),o=e.Heading||r;let a=e.Abstract||e.AbstractText||"";const i=e.AbstractSource||"DuckDuckGo",n=[];return e.RelatedTopics&&Array.isArray(e.RelatedTopics)&&e.RelatedTopics.forEach(c=>{c.Text&&c.FirstURL&&n.push({text:c.Text,url:c.FirstURL})}),a||(n.length>0?a=n[0].text:a="Search completed but returned no direct summary context."),{type:"web",title:o,summary:a,source:i,related:n.slice(0,5)}}catch(t){return console.error("Web Search Error:",t),{type:"web",title:"Search unavailable",summary:"The web search tool encountered a technical limitation (network/CORS).",source:"System",related:[]}}}function d(r,t){const s=/\b(exam|timetable|result|schedule|notification|board|date|class-12|rbse|cbse|ssc|hsc)\b/i.test(r);let e=`CRITICAL GROUNDING CONTEXT for "${r}":
`;return e+=`SEARCH SUMMARY: ${t.summary}

`,t.related.length>0&&(e+=`SOURCE LIST:
`,t.related.slice(0,5).forEach(o=>{const a=/\.(gov\.in|nic\.in|edu\.in)\b/i.test(o.url);e+=`- [${a?"AUTHORITATIVE":"THIRD-PARTY"}] ${o.text}: ${o.url}
`})),e+=`
STRICT INSTRUCTIONS FOR OFFICIAL DATA:`,s?e+=`
1. This query asks for OFFICIAL DATA (dates, results, schedules).
2. RULE: You may ONLY state dates if a source tagged [AUTHORITATIVE] or a known official board website confirms them.
3. RULE: If no [AUTHORITATIVE] source confirms the 2026 dates, you MUST use the following template:
   "The [Official Body] has not yet released the official [Item] for 2026. Based on previous years, it is usually published around [Month], but no dates are confirmed yet."
4. FORBIDDEN: Do not mention "tentative" or "expected" dates from THIRD-PARTY sites.
5. ZERO TOLERANCE for hallucinating timetables or days of the week.`:e+=`
Use the above information as grounding context. If the results are insufficient, rely on your internal base knowledge but never state unverified facts as certainty.`,e}export{d as formatResultsForPrompt,u as searchWeb};
