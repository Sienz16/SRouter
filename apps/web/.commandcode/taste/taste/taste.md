# Taste
- Explicitly asks the agent to use project skills when performing tasks (e.g., "using skill"). Wants the agent to activate and follow relevant project skills before starting work. Confidence: 0.9
- Prefers building UI from official shadcn/ui components (installed via the shadcn CLI) rather than hand-rolled custom components — asked to refactor existing custom sidebar/topbar to use shadcn primitives. Confidence: 0.85
- Communicates in Indonesian (Bahasa Indonesia) and expects responses in the same language. Confidence: 0.9
- Prefers planned/unimplemented features to still be surfaced in the UI as status cards with a "Coming Soon" badge (e.g., Cloudflare Tunnel, Tailscale on/off status on the dashboard) rather than being omitted until implemented. Confidence: 0.6
- Prefers related dashboard/status info consolidated into a single card rather than split across multiple separate cards (asked to merge API Endpoint + Cloudflare Tunnel + Tailscale status into one card). Confidence: 0.6
- Prefers an app-shell layout where the topbar stays fixed at the top and only the main content area scrolls (complained that the topbar scrolled away with content; fixed by constraining the sidebar inset to viewport height with internal scroll). Confidence: 0.65
- Prefers a minimal topbar without extra status badges/indicators — asked to remove the "OpenAI-compatible" badge and the API online/offline indicator, calling the API status indicator ugly ("API online jelek"); wants only essential chrome like breadcrumb + theme toggle. Confidence: 0.55
