# HAQMS Assessment Documentation

## 1. Issues Identified
* **Schema Missing:** The entire Prisma schema definition was omitted from the repository.
* **Security - Credential Leaks:** The user registration and login endpoints explicitly logged plaintext passwords. The registration endpoint also returned the hashed password in its HTTP JSON response.
* **Security - Weak Authorization:** The JWT tokens generated were missing valid expiration values (set to `365d` or completely ignored via `ignoreExpiration: true` during verify). The `authorizeAdminOnlyLegacy` middleware entirely omitted the `ADMIN` role-checking logic, essentially turning into a no-op allowing any authenticated user to utilize admin functionality like deleting patients.
* **Security - SQL Injection:** `GET /api/doctors` used `prisma.$queryRawUnsafe` with direct string interpolation for search queries, leaving it incredibly vulnerable.
* **Performance - N+1 Queries:** `GET /api/appointments` iterated through fetched appointments using a `for` loop, querying the database independently for the patient and doctor details associated with each iteration instead of leveraging SQL joins via Prisma's `include` feature.
* **Performance - Sequential DB Blocking:** The `/api/doctors/stats` and `/api/reports/doctor-stats` endpoints utilized multiple individual `await` queries sequentially rather than aggregating them in parallel, artificially restricting event loop throughput. The reports endpoint specifically triggered an artificial 80ms `setTimeout` delay on every row iteration.
* **Database & Concurrency - Race Conditions & Collisions:** The queue token check-in system (`POST /api/queue/checkin`) queried the max token value and then subsequently used it to create a new token, creating a textbook race condition vulnerability explicitly forced open by a 350ms delay. The appointments `POST /api/appointments` relied on a fundamentally flawed exact-millisecond constraint check to prevent double bookings.
* **Frontend - Memory Leak:** The dashboard queue polling feature in `frontend/src/app/queue/page.js` utilized `setInterval` without returning a proper `clearInterval` cleanup in its `useEffect` hook, resulting in an unmanageable amount of overlapping state mutation network calls across route changes.
* **Frontend - Application Crashes:** `frontend/src/app/dashboard/page.js` crashed the entire application trying to render a patient's unassigned medical history because it immediately executed `.toUpperCase()` on potentially `null` properties without safety checking. Additionally, entering text into the dashboard search bar caused catastrophic parent component re-renders on every keystroke by dispatching a query every time the state string changed.
* **Missing Features:** The Next.js application returned a 404 whenever the legacy "View Diagnostic Reports Details" route for a patient's historical records was clicked.

## 2. Fixes Implemented
* **Reconstructed Schema:** Authored a complete `backend/prisma/schema.prisma` file containing relational configurations, strict datatypes, auto-updating timestamps, and the necessary index unique constraints.
* **Security:** Refactored `backend/src/routes/auth.js` to strip out all `.password` payload logs and returns. Standardized JWT issuance to a `1d` limit, forcing re-authentication, and reinstated `ignoreExpiration: false`. Finalized the strict `ADMIN` check inside `authorizeAdminOnlyLegacy`.
* **SQL Injection Patch:** Migrated `/api/doctors` away from `queryRawUnsafe` entirely, preferring Prisma's `findMany({ where: { name: { contains: search } } })` native parameterization.
* **React Bug Fixes:** Fixed the `setInterval` memory leak by ensuring `clearInterval` is natively provided to the `useEffect` garbage collector. Added explicit JS optional chaining to `medicalHistory?.toUpperCase()`.
* **Incomplete Features:** Built `frontend/src/app/patients/[id]/history-records/page.js` to seamlessly hook into the Next router, retrieving and displaying formatted clinical profiles and legacy appointment logs dynamically.

## 3. Optimizations Performed
* **Database Join Efficiency:** Replaced the N+1 `for` loop in appointments with native Prisma `include: { patient: true, doctor: true }` configuration, drastically minimizing connection bottlenecks.
* **Concurrent Event Loops:** Wrapped all sequential dashboard statistics queries into `await Promise.all([])` wrappers, significantly boosting performance latency on large volume databases. Stripped away fake network latency.
* **Debounced Event Hooks:** Replaced immediate keystroke dispatching for patient lists with a 300ms JS timer debounce within the `useEffect` dependency array, saving hundreds of unnecessary query computations.
* **Transaction Concurrency Handling:** Shifted the multi-stage token increment architecture in `queue.js` into an atomic `prisma.$transaction()` block, eliminating parallel overwrites completely. Restructured duplicate booking architecture around native Prisma `P2002` double-booking DB constraints (via `@@unique([doctorId, appointmentDate])`) rather than sequential JS logic checks.
* **Optimized Offset Fetching:** Instead of using `.slice()` to slice the entire user table within Node.js, `patients.js` now uses `skip` and `take` to apply genuine SQL pagination logic directly onto the DB engine.

## 4. Remaining Known Issues
* The project utilizes a hardcoded API domain `http://localhost:5000/api` natively throughout the frontend configuration. These variables should be swapped out with generic generic environment contexts `process.env.NEXT_PUBLIC_API_URL` to facilitate containerization scaling.
* `POST /api/patients` uses incomplete registration verifications that do not restrict phone numbers via REGEX nor do they enforce valid email structural schemas.
* Global Express Error Handling strictly passes the internal unparsed error stack details directly back to the Next.js API client (e.g. `res.status(500).json({ error: error.message })`), risking environment structural disclosures on unhandled crashes.

## 5. Approach and Reasoning Behind Major Decisions
* **Focusing on Native Prisma Solutions over Javascript:** While many database concurrency features *can* be faked inside NodeJS memory (e.g. using array slices for pagination, string manipulation for SQL, manual error-handling loops for N+1 queries), prioritizing Prisma's native `findMany()`, `$transaction()`, `include`, and `skip/take` leverages the underlying efficiency of the PostgreSQL database engines, offloading the mathematical strain. Relying on unique database keys `@@unique` via the `schema.prisma` architecture guarantees transactional consistency across multi-threaded loads much better than Javascript exact-millisecond string parsing ever will.
* **Fixing React Lifecycle Constraints:** Understanding the fundamental nature of single-page application mounts. A simple `clearInterval` wrapper and 300ms debounce significantly improves client-side DOM processing latency.
