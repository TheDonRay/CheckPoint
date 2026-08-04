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

```
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
cd checkpoint
npm install
```

Create a `.env` file in the project root:

```
MONGODB_URI=mongodb://localhost:27017/checkpoint
PORT=3000
```

Seed the database, then start the server:

```bash
npm run seed
npm run dev
```

## Project structure

```
checkpoint/
├── src/
│   ├── config/
│   │   └── db.js              # mongoose connection
│   ├── models/
│   │   └── User.js            # schema definition
│   ├── middleware/
│   │   ├── parseQuery.js      # coerce and bound params
│   │   ├── sanitize.js        # block operator injection
│   │   ├── loadUser.js        # fetch document, attach to req
│   │   ├── requireRole.js     # factory: returns middleware
│   │   ├── requireActive.js   # account state check
│   │   └── errorHandler.js    # four-arg, registered last
│   ├── routes/
│   │   └── users.js
│   └── app.js
├── seed/
│   ├── data.json
│   └── seed.js
└── .env
```

## Writing a policy

A policy is an ordinary Express middleware. It has three moves: attach something to `req`, end the request with `res`, or call `next()`.

```js
// src/middleware/requireActive.js
module.exports = (req, res, next) => {
  if (!req.user) return next(new Error('requireActive must run after loadUser'));
  if (req.user.status !== 'active') {
    return res.status(403).json({ error: 'account is not active' });
  }
  next();
};
