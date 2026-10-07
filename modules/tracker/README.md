# Tracker

`TrackerShell` guards `/home`, `/calendar`, `/camera`, `/profile`, and `/settings` with `/api/v1/me`. `tracker-data.ts` reads profile, targets, weights, meals, and day summaries from Laravel. Calendar statuses use `/api/v1/calendar`; selected days use `/api/v1/days/{date}`. No nutrition data uses browser storage.

Camera keeps photo visible while queued analysis runs. AI estimates one dish with calories and nutrients. Users edit the estimate before saving; confirmed dish descriptions and nutrition become references for later scans. Account actions call Laravel. Avatar upload and contact support remain pending backend endpoints.
