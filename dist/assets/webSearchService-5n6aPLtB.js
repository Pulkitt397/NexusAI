const u="https://api.duckduckgo.com/";async function d(s){try{const t=new URL(u);t.searchParams.append("q",s),t.searchParams.append("format","json"),t.searchParams.append("no_redirect","1"),t.searchParams.append("no_html","1"),t.searchParams.append("t","nexusai");const o=await fetch(t.toString());if(!o.ok)throw new Error(`DuckDuckGo API error: ${o.statusText}`);const e=await o.json(),n=e.Heading||s;let a=e.Answer||e.Abstract||e.AbstractText||"";const l=e.AbstractSource||(e.Answer?"DuckDuckGo Answer":"DuckDuckGo"),i=[];return e.RelatedTopics&&Array.isArray(e.RelatedTopics)&&e.RelatedTopics.forEach(r=>{r.Text&&r.FirstURL?i.push({text:r.Text,url:r.FirstURL}):r.Topics&&Array.isArray(r.Topics)&&r.Topics.forEach(c=>{c.Text&&c.FirstURL&&i.push({text:c.Text,url:c.FirstURL})})}),a||(i.length>0?a=i[0].text:a="The search query did not yield a direct summary. Please rely on authoritative internal knowledge while acknowledging the current temporal grounding if provided."),{type:"web",title:n,summary:a,source:l,related:i.slice(0,5)}}catch(t){return console.error("Web Search Error:",t),{type:"web",title:"Search unavailable",summary:"The web search tool encountered a technical limitation (network/CORS).",source:"System",related:[]}}}function f(s,t){const o=/\b(exam|timetable|result|schedule|notification|board|date|class-12|rbse|cbse|ssc|hsc)\b/i.test(s);let e=`CRITICAL GROUNDING CONTEXT for "${s}":
`;return e+=`SEARCH SUMMARY: ${t.summary}

`,t.related.length>0&&(e+=`SOURCE LIST:
`,t.related.slice(0,5).forEach(n=>{const a=/\.(gov\.in|nic\.in|edu\.in)\b/i.test(n.url);e+=`- [${a?"AUTHORITATIVE":"THIRD-PARTY"}] ${n.text}: ${n.url}
`})),e+=`
STRICT INSTRUCTIONS FOR OFFICIAL DATA:`,o?e+=`
1. This query asks for OFFICIAL DATA (dates, results, schedules).
2. RULE: You may ONLY state dates if a source tagged [AUTHORITATIVE] or a known official board website confirms them.
3. RULE: If no [AUTHORITATIVE] source confirms the 2026 dates, you MUST use the following template:
   "The [Official Body] has not yet released the official [Item] for 2026. Based on previous years, it is usually published around [Month], but no dates are confirmed yet."
4. FORBIDDEN: Do not mention "tentative" or "expected" dates from THIRD-PARTY sites.
5. ZERO TOLERANCE for hallucinating timetables or days of the week.`:e+=`
Use the above information as grounding context. If the results are insufficient, rely on your internal base knowledge but never state unverified facts as certainty.`,e}export{f as formatResultsForPrompt,d as searchWeb};
