# PrimetradeAI – Scalable REST API + Frontend

A full-stack application with **JWT authentication**, **role-based access control**, and **CRUD operations** for tasks, built with FastAPI (Python), PostgreSQL, and React.

## Project Structure

```
primetradeai/
├── backend/              # FastAPI REST API
│   ├── app/
│   │   ├── main.py           # FastAPI app, CORS, lifespan
│   │   ├── config.py         # pydantic-settings (env)
│   │   ├── database.py       # Async SQLAlchemy engine/session
│   │   ├── models.py         # ORM models (User, Task)
│   │   ├── schemas.py        # Pydantic request/response schemas
│   │   ├── auth.py           # JWT + password hashing utils
│   │   ├── dependencies.py   # get_db, get_current_user, get_admin_user
│   │   ├── exceptions.py     # Custom HTTP exception handlers
│   │   └── routers/
│   │       ├── auth.py       # /auth/register, /auth/login, /auth/me
│   │       └── tasks.py      # CRUD /tasks endpoints
│   ├── requirements.txt
│   └── .env
└── frontend/             # React + Vite UI
    ├── src/
    │   ├── components/   # Navbar, TaskForm, TaskList
    │   ├── context/      # AuthContext
    │   ├── pages/        # Login, Register, Dashboard
    │   └── services/     # Axios API client
    ├── index.html
    ├── vite.config.js
    └── package.json
```

## Tech Stack

| Layer       | Technology                         |
|-------------|------------------------------------|
| Backend     | Python 3.11+, FastAPI, Uvicorn     |
| Database    | PostgreSQL 16 (Neon)               |
| ORM         | SQLAlchemy 2.0 (async)             |
| Auth        | JWT (python-jose), bcrypt (passlib)|
| Validation  | Pydantic v2                        |
| API Docs    | Auto-generated Swagger + ReDoc     |
| Frontend    | React 18, Vite, React Router 6     |
| HTTP Client | Axios                              |

## Setup & Run

### Prerequisites

- Python 3.11+
- Node.js >= 18
- A running PostgreSQL instance (or use the provided Neon connection)

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate    # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload   # starts on http://localhost:8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev               # starts on http://localhost:3000
```

## API Endpoints

Base URL: `http://localhost:8000/api/v1`

| Method | Endpoint            | Auth Required | Role  | Description          |
|--------|---------------------|---------------|-------|----------------------|
| POST   | `/auth/register`    | No            | -     | Register new user    |
| POST   | `/auth/login`       | No            | -     | Login                |
| GET    | `/auth/me`          | Yes           | *     | Get current user     |
| GET    | `/tasks`            | Yes           | *     | List user's tasks    |
| POST   | `/tasks`            | Yes           | *     | Create a task        |
| GET    | `/tasks/{id}`       | Yes           | *     | Get task by ID       |
| PUT    | `/tasks/{id}`       | Yes           | *     | Update a task        |
| DELETE | `/tasks/{id}`       | Yes           | *     | Delete a task        |

- `user` role: sees/manages only own tasks.
- `admin` role: sees/manages all tasks.

### Roles & Creating an Admin

All users register with the `user` role by default. To test the admin view:

1. **Register a normal user** via the UI (e.g., `john@example.com` / `password123`). This user has `user` role and can only see their own tasks.
2. **Promote that user to admin** by running this SQL on your Neon database (replace the email):
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'john@example.com';
   ```
3. **Log out and log back in** — the navbar now shows `John (admin)`.
4. **Create a second normal user** in a different browser/incognito window (e.g., `jane@example.com` / `password123`). This user has `user` role.
5. **Create tasks as both users** — each can only see their own tasks.
6. **Log in as the admin user** — the admin sees **all tasks** from every user. The normal user still sees only their own.

**Seed script** (alternative that creates a dedicated admin account):
```bash
cd backend
python -c "
import asyncio
from app.database import async_session_factory, init_db
from app.auth import hash_password
from app.models import User
from sqlalchemy import select

async def seed():
    await init_db()
    async with async_session_factory() as db:
        q = await db.execute(select(User).where(User.email == 'admin@primetrade.ai'))
        if not q.scalar_one_or_none():
            db.add(User(name='Admin', email='admin@primetrade.ai', hashed_password=hash_password('admin123'), role='admin'))
            await db.commit()
            print('Admin created → admin@primetrade.ai / admin123')

asyncio.run(seed())
"
```

After login, the navbar displays the user's name and role (e.g., `Admin (admin)`).

## Testing the App

### Via the Frontend UI

1. Open `http://localhost:3000` — you'll be redirected to `/login`.
2. Click **Register** and create an account (name, email, password).
3. You're automatically logged in and redirected to the **Dashboard**.
4. Use the **"Create New Task"** form to add tasks with a title, optional description, and status.
5. Each task appears below — use **Edit** to modify or **Delete** to remove it.
6. Click **Logout** and test login with the same credentials.
7. To test admin: promote your user to `admin` via the SQL/seed script above, then log in — the navbar shows `(admin)` and the user can see all tasks across users.

### Via Swagger UI

1. Start the backend — go to `http://localhost:8000/docs`.
2. Expand **POST /api/v1/auth/register** → **Try it out** → send a JSON body → **Execute**.
3. Copy the `token` from the response.
4. Click **Authorize** at the top, paste `Bearer <token>`, click **Authorize**.
5. Now test any authenticated endpoint (GET /api/v1/tasks, POST /api/v1/tasks, etc.).

### Via curl (quick smoke test)

```bash
# Register
curl -s -X POST http://localhost:8000/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Test User","email":"test@example.com","password":"test123"}' | python3 -m json.tool

# Login (save token)
TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com","password":"test123"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

# Create a task
curl -s -X POST http://localhost:8000/api/v1/tasks \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"My first task","description":"Testing the API"}' | python3 -m json.tool

# List tasks
curl -s http://localhost:8000/api/v1/tasks \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

## API Documentation (Swagger / ReDoc)

Once the backend is running, visit:

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

Both are auto-generated by FastAPI. Use the "Authorize" button in Swagger to paste your JWT token and test authenticated endpoints.

## Database

PostgreSQL hosted on [Neon](https://neon.tech). Schema is auto-created on first run via SQLAlchemy's `Base.metadata.create_all`.

### Models

- **users**: `id` (UUID PK), `name`, `email` (unique), `hashed_password`, `role` (user/admin), timestamps
- **tasks**: `id` (UUID PK), `title`, `description`, `status` (pending/in-progress/completed), `user_id` (FK → users), timestamps

## Scalability Notes

- **Stateless JWT**: No server-side session store; horizontal scaling is straightforward.
- **PostgreSQL indexing**: Index on `tasks.user_id` for fast per-user queries.
- **Async throughout**: FastAPI + async SQLAlchemy + asyncpg for non-blocking I/O.
- **Modular structure**: Each module (auth, tasks) is self-contained with its own router, schemas, and dependencies – easy to extract into microservices.
- **Caching (optional)**: Add Redis with `aioredis` for frequently queried data; invalidate on writes.
- **Rate limiting**: Use `slowapi` on auth endpoints to prevent brute-force attacks.
- **Load balancing**: A reverse proxy (NGINX, Traefik) can distribute traffic across multiple Uvicorn workers.
- **Containerization**: Docker + docker-compose for consistent environments across dev/staging/prod.

## Security Features

- Passwords hashed with bcrypt via passlib
- JWT with configurable expiry (default 7 days)
- Input validation via Pydantic (type coercion, length checks, regex patterns)
- Role-based dependency injection (`get_current_user`, `get_admin_user`)
- CORS middleware configured (restrict origins in production)
- UUID primary keys (no sequential ID enumeration)
- Password field never exposed (no `hashed_password` field in any response schema)
