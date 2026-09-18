# Two-minute demo and judge Q&A

## Before presenting

Verify whether this is LOCAL MOCK or LIVE REAL AI. State that accurately. Use a photograph you are authorized to upload, without faces, private addresses or confidential data. Confirm all provider free quotas before enabling live calls. This prototype does not contact municipal authorities or dispatch emergency responders.

## Two-minute script

**0:00-0:20 - Problem:** Citizens see damaged infrastructure, but an isolated photo does not create a useful repair queue. CivicLens turns reports into structured evidence for human review.

**0:20-0:50 - Report:** Enter a location and description; upload a real infrastructure image. Submit. Show the returned category, provisional severity, summary and reasoning. In local mode say explicitly: this is simulated analysis and the image was not analyzed by AI.

**0:50-1:15 - Explain priority:** Show severity/frequency/recency points. The model does not invent this 0-100 score: the server computes it. It is an operational heuristic, not a certified safety assessment or probability.

**1:15-1:40 - Dashboard:** Open the risk dashboard. Show highest-priority open reports and areas. Explain related-area reports are not confirmed duplicates and resolved issues leave the open queue.

**1:40-2:00 - Action:** In the authorized admin tab move the submitted report to under review, then in progress. Refresh to verify persistence. Conclude: from citizen reports to actionable infrastructure intelligence, with human judgment retained.

## Ten likely questions

1. **Where is AI?** A multimodal Gemini model reads the normalized image and description and produces schema-validated classifications and explanations.
2. **Why not train a model?** The hackathon uses an existing image/text model rather than pretending to have a locally trained model or labeled safety dataset.
3. **Is the risk score AI-generated?** No. A tested deterministic function applies disclosed severity, frequency and recency weights.
4. **Can the AI be wrong?** Yes. Severity is provisional, explanations disclose uncertainty, and failures are visibly routed for human review.
5. **Why Neon?** A dedicated PostgreSQL database avoids modifying two existing live Supabase applications.
6. **Why Cloudinary?** Signed server-side uploads handle report media separately from database records; URLs are checked against the expected account and report ID.
7. **How are secrets secured?** Environment variables on the server, ignored local env files, no public-variable prefixes or credential logging, and constant-time admin-token verification.
8. **What if a dependency fails?** Missing setup fails closed, AI is retried at most once, fallback is labeled, and ambiguous database commits do not trigger blind image deletion.
9. **Does frequency mean duplicates?** No. Same normalized area/category and recent open status define a simple, explicitly heuristic related-report count.
10. **What is still missing?** A verified live deployment, provider-key configuration, full changed-version build checks and visual QA are pending in this handoff. Longer-term work includes user accounts, abuse prevention, moderation, SQL aggregation, validated risk weights and geospatial clustering.
