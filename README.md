# Technologies to implement / work on 
- Sentry 
- AI 
- AWS cloud service 
- backup into another mongodb account to test 
- Load testing add more endpoints 


# Checkpoint

An Express + MongoDB service that seeds a database and gates every query behind pluggable validation middleware, so any request can be inspected, transformed, or blocked before it reaches your data.

## Why

Most tutorial CRUD APIs validate inline, inside the route handler. Checkpoint pulls that logic out into a chain of composable middleware functions — each one a small, independently testable unit that decides whether a request continues, gets rewritten, or stops.

The database layer is deliberately boring. The interesting part is the policy layer in front of it.

## Concepts

**Seed** — a script that loads fixture data into MongoDB so there's something to query against. Run once, re-runnable, safe to wipe.

**Policy** — a middleware function that examines a request and returns a verdict: allow, deny, or modify. Policies know nothing about each other and can be reordered or swapped freely.

**Chain** — the ordered list of policies applied to a route. Order matters: cheap checks first, database lookups later.

## Request lifecycle

```text
Request
   │
   ▼
[ parse ]        coerce and bound query params
   │
   ▼
[ sanitize ]     strip Mongo operator injection
   │
   ▼
[ load ]         fetch the target document, 404 if absent
   │
   ▼
[ authorize ]    check state and ownership, 403 if denied
   │
   ▼
[ handler ]      the route finally runs
   │
   ▼
[ errors ]       four-arg error handler, registered last
```

Any policy can end the request early. Nothing downstream runs after a rejection.

## Stack

- Node.js
- Express
- MongoDB with Mongoose
- dotenv for configuration

## Getting started

```bash
git clone <repo-url>
cd checkpoint/backend
npm install
```

Create a `.env` file in `backend/`:

```ini
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/checkpoint
PORT=4565
```

The database name at the end of the URI matters. A connection string ending in
`.mongodb.net/?appName=...` — nothing between the slash and the `?` — silently
connects to a database named `test`.

Seed the database, then start the server:

```bash
npm run seed
npm run dev
```

## Project structure

```text
checkpoint/
├── README.md
└── backend/
    ├── config/
    │   └── db.js              # mongoose connect / disconnect
    ├── models/
    │   └── User.js            # schema definition
    ├── middleware/
    │   ├── parseQuery.js      # coerce and bound params
    │   ├── sanitize.js        # block operator injection
    │   ├── loadUser.js        # fetch document, attach to req
    │   ├── requireRole.js     # factory: returns middleware
    │   ├── requireActive.js   # account state check
    │   └── errorHandler.js    # four-arg, registered last
    ├── routes/                # paths, and the chain each one carries
    ├── controllers/           # terminal handlers — the [handler] step
    ├── services/              # query logic, once it needs sharing
    ├── seed/
    │   ├── data.json
    │   └── seed.js
    ├── app.js                 # express app
    ├── server.js              # connects to mongo, binds the port
    └── .env
```

`server.js` sits above `app.js` deliberately: it owns process concerns — env,
database connection, port binding — while `app.js` owns only the Express app.
That split is what lets tests import the app without binding a port.

## Writing a policy

A policy is an ordinary Express middleware. It has three moves: attach something to `req`, end the request with `res`, or call `next()`.

```js
// backend/middleware/requireActive.js
export default (req, res, next) => {
  if (!req.user) return next(new Error('requireActive must run after loadUser'));
  if (req.user.status !== 'active') {
    return res.status(403).json({ error: 'account is not active' });
  }
  next();
};
```

Note the guard on the first line. A policy that depends on an earlier policy
should say so out loud rather than fail mysteriously when the chain is
reordered.

## Seeding

`seed/seed.js` is a standalone script, not part of the server. It has no `req`
or `res`, it connects to Mongo itself, and the process exits when it finishes.
Run it by hand:

```bash
npm run seed
```

It wipes the collection before inserting, so it is safe to re-run as often as
you like. Fixtures live in `seed/data.json` and cover every role × status
combination, so each policy in the chain has both a passing and a failing case
to exercise.

Seeding is a development convenience. Creating a user at runtime is a different
thing entirely — that would be a route plus a controller, sitting behind the
same middleware chain as every other request.
