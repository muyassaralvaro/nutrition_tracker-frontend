# Tracker preview

Routes: `/home`, `/calendar`, `/camera`, `/profile`, `/settings`. `TrackerShell` owns shared navigation. `tracker-data.ts` stores profile, weight, and meal values in browser `sessionStorage`; no server data or authenticated session exists yet. `nutrition.ts` calculates editable adult targets and daily completion from recorded values. Camera capture and upload show a temporary photo, then an editable nutrition form. Photo and AI estimates are not saved or generated yet. Connect Laravel auth, food catalog, photo analysis, and account actions before production use.
