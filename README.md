# Schedule Police 🤖📅

A **Next.js 16 application** that integrates a **LINE Messaging API bot** with a lightweight frontend dashboard.  
The bot acts as an operational assistant for schedule checking, notifications, and permission handling, while the frontend provides administrative and helper views.

This project uses **Neon (Postgres)** as the database, **JWT-based authentication**, and **role-based access control (RBAC)** — without relying on Neon Auth.

---

## ✨ Features

- 🤖 LINE Bot integration via **LINE Messaging API**
- 🔔 Schedule notification & manual trigger commands
- 🧠 Teaching schedule resolution via **Messier API**
- 🔐 JWT authentication & role-based authorization
- 🗄️ Serverless Postgres using **Neon**
- 🧩 Modular controller-based architecture
- 🎨 Minimal frontend using Next.js App Router + Tailwind + Radix UI

---

## 🧱 Tech Stack

### Core
- **Next.js 16 (App Router, Turbopack)**
- **React 19**
- **TypeScript**
- **Node.js ≥ 20.9**

### Backend & Infra
- **LINE Messaging API** (`@line/bot-sdk`)
- **Neon Database (Postgres)**
- **JWT Authentication**
- **Role-based access control**

### UI / UX
- Tailwind CSS v4
- Radix UI
- Framer Motion
- Sonner (toast notifications)

---

## 📁 Project Structure

```txt
src/
├── api-controller/        # Backend domain logic (LINE, auth, admin, etc.)
│   ├── admin/
│   ├── assistant/
│   ├── auth/
│   ├── line/              # LINE-specific handlers & helpers
│   ├── permission/
│   └── teaching/
│
├── app/                   # Next.js App Router
│   ├── api/notify/line/   # LINE webhook endpoint
│   ├── admin/
│   ├── home/
│   ├── login/
│   ├── layout.tsx
│   └── page.tsx
│
├── components/            # Shared UI components
├── contexts/              # React contexts (auth)
│   └── auth-context.tsx
│
├── frontend-controller/   # Client-side orchestration
│   └── assistant-controller.ts
│
├── hooks/                 # Custom React hooks
│   └── use-auth-guard.ts
│
├── lib/                   # Shared utilities
│   ├── neon.ts            # Neon DB client
│   ├── line.ts            # LINE helpers
│   ├── types.ts
│   └── utils.ts
````

---

## 🔌 LINE Bot Integration

### Webhook Endpoint

The LINE Messaging API webhook is configured to point to:

```
POST /api/notify/line
```

This endpoint:

1. Verifies the request signature (`x-line-signature`)
2. Parses incoming events
3. Routes messages based on text commands

---

### Webhook Handler (Core Logic)

```ts
export async function POST(request: NextRequest) {
    const body = await request.text();
    const signature = request.headers.get("x-line-signature");

    const valid = verifyLineSignature(body, signature || "");
    if (!valid.success || !valid.data) {
        return errorResponse("Invalid signature", 401);
    }

    const rawPayload = JSON.parse(body);
    const payloadToProcess = rawPayload.events[0];

    if (!payloadToProcess) {
        return successResponse("Message received.", null);
    }

    switch (payloadToProcess.type) {
        case "message":
            const text = payloadToProcess.message.text;

            if (text === "/help") {
                await replyMessage(payloadToProcess.replyToken, HelpMessage);

            } else if (text.startsWith("CONNECT_LINE_ID-")) {
                await HandleConnectRequest(payloadToProcess);

            } else if (text === "/notifymessier") {
                await manualNotifyTeachingSchedule(payloadToProcess);

            } else if (text.startsWith("/checkmessier")) {
                await manualCheckTeachingSchedule(payloadToProcess);

            } else if (text.startsWith("/latepermission")) {
                await createPermission(payloadToProcess);

            } else {
                console.log("Received unknown message:", payloadToProcess);
            }
            break;

        default:
            console.log("Unhandled event type:", payloadToProcess);
    }

    return successResponse("Message received.", null);
}
```

---

## 🧠 Handling `message` Events (Extending the Bot)

All **text-based commands** are handled inside:

```ts
switch (payloadToProcess.type) {
  case "message":
}
```

### ➕ Adding a New Command

To add a new bot feature:

1. Decide on a command keyword (e.g. `/status`)
2. Add a new condition:

```ts
else if (text === "/status") {
    await handleStatusCommand(payloadToProcess);
}
```

3. Implement the handler in `api-controller/line` or a relevant domain folder
4. (Optional) Add validation / role checks

This design keeps the webhook thin and pushes business logic into **domain controllers**.

---

## 🔔 `/notifymessier` Command Flow

When a user sends:

```
/notifymessier
```

The bot performs the following:

1. Calls the **Messier API endpoint**
2. Retrieves upcoming teaching/transaction data
3. Finds the **nearest schedule from the current time**
4. Processes and formats the result
5. Replies to the user via LINE Messaging API

This allows **manual triggering** of notifications, useful for:

* Testing
* Admin overrides
* Emergency checks

---

## 🗄️ CRON-JOB based messier notification (Limited by Line)

In order to use a Cron Job, you must do the following command:

```curl -L -X POST "https://schedule-police.nathabuddhi.com/api/notify/teaching" -H "X-Auth-Token: X_AUTH_SECRET"```

You can use the following cron schedule: ```5 0,2,4,6,8,10 * * 1-6```

---

## 🗄️ Database (Neon)

* Uses **Neon serverless Postgres**
* Accessed via the `postgres` client
* No Neon Auth is used

### Responsibilities

* User records
* LINE ID mappings
* Permissions
* Teaching schedules
* Audit & transaction history

---

## 🔐 Authentication & Authorization

### Authentication

* JWT-based (manual implementation)
* Tokens issued by backend
* Stored client-side (cookies / headers)

### Authorization

* Role-based access control (RBAC)
* Example roles:

  * `admin`
  * `assistant`
  * `teacher`

Roles are enforced:

* In API routes
* In frontend route guards (`use-auth-guard`)
* Inside controller logic

---

## 🧩 Frontend

The frontend exists to:

* Provide admin views
* Assist operators
* Display schedules & states
* Manage sessions

It is **not the primary interface** — the LINE bot is.

---

## 📌 Summary

**Schedule Police** is:

* Bot-first
* API-driven
* Secure by design
* Easy to extend

The LINE webhook acts as a command router, while domain controllers handle business logic cleanly and predictably.