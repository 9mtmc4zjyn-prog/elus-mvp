# ELUS - Product Requirements

## Concept
ELUS is a contextual human presence platform that connects people, businesses, services and opportunities in a healthy, useful and safe way. NOT a common social network — no infinite feed, no likes, no chat.

Slogan: **"Uma internet mais humana."**

## Visual Identity
Premium dark atmospheric, minimalist, sophisticated but human.
- Background: graphite/deep blue (#0B101A)
- Discreet cyan accent (#5E9EAB), cold silver (#A1A9B8), matte white (#EDEDED)
- Soft particles, dynamic radar with sense of living human presence

## Screens Implemented (MVP — all mocked data)
1. **Splash** — Logo ELUS + slogan + breathing rings animation
2. **Login / Signup** — Simulated auth
3. **Profile type selection** — Essential / Complete / Business
4. **Profile setup** — Editable fields (name/photo/description public, others locked)
5. **Field of Presence (Radar)** — Animated radar sweep, concentric rings, profile nodes positioned by compatibility (high comp = larger/brighter, low = opaque). Filters: All / People / Businesses / Services / Communities.
6. **Public profile** — Photo + name public; sensitive fields shown locked (dots) with "Solicitar acesso" CTA. Once requested → auto-connect (demo) → fields unlock.
7. **Request access** — Granular field toggles (city, profession, interests, CV, WhatsApp, email, Instagram, LinkedIn, location)
8. **Permissions received (Solicitações)** — Tabs Recebidas/Enviadas. Owner toggles each field individually to grant/deny.
9. **Connections** — List of profiles the user is connected to.
10. **Search** — Search bar across people, businesses, services, professions + suggested topics.
11. **Plans** — Free / Premium Pessoa / Premium Empresa with subtle silver/cyan accents.
12. **Bottom navigation** — Presença · Busca · Solicitações · Conexões · Perfil

## Tech Stack
- Expo SDK 54 (file-based routing via expo-router)
- React Native (no web-only libs)
- React Native Reanimated/Animated for radar animations
- Local mock data in `/app/frontend/src/context/AppContext.tsx`
- Backend stub (FastAPI) untouched — not used in MVP
