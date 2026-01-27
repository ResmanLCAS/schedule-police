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

## 📦 LINE Webhook Event Types & Payload Structure

To keep the LINE webhook handling **type-safe and predictable**, this project defines explicit TypeScript interfaces for incoming webhook events.

### Base Event: `LineWebhookEvent`

```ts
export interface LineWebhookEvent {
    type: string;
    timestamp: number;
    source: {
        type: string;
        groupId?: string;
        userId: string;
    };
}
```

#### Explanation

This interface represents the **base structure** of any LINE webhook event.

| Field            | Description                                                    |
| ---------------- | -------------------------------------------------------------- |
| `type`           | Event type sent by LINE (e.g. `message`, `follow`, `unfollow`) |
| `timestamp`      | Event creation time (Unix timestamp in milliseconds)           |
| `source.type`    | Source of the event (`user`, `group`, `room`)                  |
| `source.userId`  | LINE user ID who triggered the event                           |
| `source.groupId` | Present only if the event originates from a group              |

This base interface allows the system to **safely inspect and branch logic** before accessing event-specific properties.

---

### Message Event Payload: `LineWebhookMessagePayload`

```ts
export interface LineWebhookMessagePayload extends LineWebhookEvent {
    message: {
        id: string;
        type: string;
        quoteToken: string;
        text: string;
        markAsReadToken: string;
    };
    replyToken: string;
}
```

#### Explanation

This interface extends `LineWebhookEvent` and represents a **text message event**.

Additional fields include:

| Field             | Description                             |
| ----------------- | --------------------------------------- |
| `message.id`      | Unique message ID generated by LINE     |
| `message.type`    | Message type (`text`, `image`, etc.)    |
| `message.text`    | Actual message content sent by the user |
| `quoteToken`      | Token used for quoted replies           |
| `markAsReadToken` | Token used to mark messages as read     |
| `replyToken`      | Token required to reply to the message  |

---

### How These Interfaces Are Used

When handling webhook events:

1. The raw request body is parsed
2. Events are filtered by `event.type`
3. If `type === "message"`, the payload is **safely cast** to `LineWebhookMessagePayload`
4. Command routing logic is applied based on `message.text`

This approach ensures:

* Compile-time safety
* Cleaner command handlers
* Easier future support for non-text events

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

## 🛠️ Local Development Setup

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/ResmanLCAS/schedule-police.git
cd schedule-police
```

---

### 2️⃣ Install Dependencies

```bash
npm install
```

> Make sure you are using **Node.js ≥ 20.9.0**

---

### 3️⃣ Environment Variables Setup

This project **relies on environment variables** for authentication, database access, and LINE integration.

Create a `.env` file at the root of the project:

```bash
touch .env
```

#### Required Environment Variables

These values are **managed via Vercel** and should be copied from your Vercel project settings:

```env
PGHOST=
PGDATABASE=
PGUSER=
PGPASSWORD=

DATABASE_URL=

LINE_CHANNEL_INFO=
LINE_CHANNEL_SECRET=
LINE_CHANNEL_ACCESS_TOKEN=

JWT_SECRET=

SLC_X_RECSEL_SECRET=
X_AUTH_SECRET=
```

> ⚠️ **Do not commit `.env` files**
> Always obtain the latest environment values from **Vercel → Project Settings → Environment Variables**

---

### 4️⃣ Run the Development Server

```bash
npm run dev
```

The app will be available at:

```
http://localhost:3000
```

---

## 📌 Summary

**Schedule Police** is:

* Bot-first
* API-driven
* Secure by design
* Easy to extend

The LINE webhook acts as a command router, while domain controllers handle business logic cleanly and predictably.

---


## 🌐 Deployment Notes (Vercel)

* The project is designed to run on **Vercel**
* LINE Webhook URL must point to:

```
https://<your-domain>/api/notify/line
```

* Environment variables must be configured in Vercel
* Cron-triggered Messier notifications rely on:

```
POST /api/notify/teaching
```

Protected via:

```http
X-Auth-Token: X_AUTH_SECRET
```

---

## 🧠 Development Philosophy

* **Bot-first architecture**
* Thin API routes, fat controllers
* Explicit typing over dynamic payloads
* Manual auth for clarity and control
* Minimal frontend, operational backend

---