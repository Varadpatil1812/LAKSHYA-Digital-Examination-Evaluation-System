# 📚 LAKSHYA — Digital Examination & Evaluation System

> ज्ञानस्य दीपः विद्यर्थीणां कृते — *A lamp of knowledge for students*

A full-stack online examination platform where students take timed, auto-graded MCQ exams and administrators manage the entire question bank — built with **Spring Boot 3 + Spring Security (JWT)** on the backend and **React 18 + Vite** on the frontend.

---

## 📑 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Architecture](#-architecture)
- [Authentication & Security](#-authentication--security)
- [Getting Started](#-getting-started)
- [Environment Configuration](#-environment-configuration)
- [API Reference](#-api-reference)
- [Database Schema](#-database-schema)
- [Team](#-team)

---

## ✨ Features

### 🎓 For Students
- Secure registration and login with strict password rules (uppercase, lowercase, digit, special character)
- Dynamic subject selection — subjects are derived live from the question bank, never hardcoded
- Timed MCQ exams with a 15-second per-question countdown and auto-advance on timeout
- Instant scoring with percentage and letter grade (A+ through F)
- Personal exam history dashboard with best/average score stats and subject filtering

### 🛠️ For Administrators
- Create, edit, and delete questions with four answer choices and a correct-answer designation
- Assign questions to existing subjects or create new ones on the fly
- Full question bank view in a card-based admin grid

### 🌐 Platform-Wide
- Stateless JWT authentication (HMAC-SHA256 signed)
- Role-based access control enforced at the backend (`ROLE_STUDENT`, `ROLE_ADMIN`)
- Global exception handling with structured JSON error responses
- Interactive API documentation via Swagger / OpenAPI

---

## 🛠️ Tech Stack

### Frontend
| Tech | Version |
|------|---------|
| React | 18 |
| Vite | 5 |
| React Router DOM | v6 |
| React Bootstrap | — |
| Axios | — |
| jwt-decode | — |

### Backend
| Tech | Version |
|------|---------|
| Spring Boot | 3.5 |
| Java | 21 |
| Spring Security | 6 |
| Spring Data JPA (Hibernate) | — |
| JJWT | 0.12.6 |
| BCrypt | — |
| ModelMapper | 3.2.3 |
| SpringDoc OpenAPI / Swagger UI | 2.8.8 |

### Database
| Tech | Notes |
|------|-------|
| MySQL | 8 — schema auto-managed via Hibernate `ddl-auto=update` |

### Build Tools
Maven (backend) · Vite (frontend)

---

## 📁 Project Structure

```
WJP_Project/
├── Backend/                              Spring Boot (Maven)
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/cdac/
│       │   ├── BackendApplication.java        Entry point — ModelMapper & PasswordEncoder beans
│       │   ├── controller/                    REST endpoints
│       │   ├── service/                       Business logic (interface + impl)
│       │   ├── dao/                           Spring Data JPA repositories
│       │   ├── entities/                      JPA entities (User, OnlineExam, ExamResult)
│       │   ├── dto/                           Request/response DTOs
│       │   ├── security/                      JWT filter, JwtUtils, SecurityConfiguration
│       │   ├── custom_exceptions/              ApiException, NotFoundException
│       │   └── globleexceptionhandler/        @RestControllerAdvice global handler
│       └── resources/
│           └── application.properties         DB, JWT secret, server config
│
└── Frontend/                             Vite + React
    ├── package.json
    └── src/
        ├── main.jsx / App.jsx                 Entry point, router, layout shell
        ├── context/AuthContext.jsx             Global auth state (Context API)
        └── Component/
            ├── Layout/                         Navbar, Footer
            ├── Pages/                          Home, About, Contact, Feedback, SignIn, SignUp, Logout
            ├── Exam_System_UI/                 QuizStarter, QuizPage, ExamHistory,
            │                                   ManageQuizzes, AddQuestion, QuestionListAdmin,
            │                                   QuestionCardAdmin
            ├── Service/                        AdminService, QuizService, UserService (Axios calls)
            └── Common/                         Reusable Popup/Toast components
```

---

## 🏗️ Architecture

The backend follows a strict **layered architecture**:

```
HTTP request
   │
   ▼
Controller   →  validates input (@Valid), delegates to Service, returns ResponseEntity
   │
   ▼
Service      →  business logic, grade calculation, duplicate checks, transactions
   │
   ▼
DAO          →  Spring Data JPA repositories — zero hand-written SQL
   │
   ▼
Entity       →  JPA-mapped classes → MySQL tables (auto-created via Hibernate)
```

**Cross-cutting concerns:**
- 🧩 **DTOs** decouple the API contract from the database schema — entities are never exposed directly on the wire
- ⚠️ **GlobalExceptionHandler** (`@RestControllerAdvice`) converts every thrown exception into a structured JSON `ErrorResponse`
- 🔒 **Spring Security filter chain** intercepts every request before it reaches a controller

---

## 🔐 Authentication & Security

LAKSHYA implements stateless authentication using **JWT (JSON Web Tokens)**, layered on top of **Spring Security**.

### 🔑 Login Flow

1. Client `POST /users/signin` with `{ email, password }`
2. `UserController` wraps the credentials in a `UsernamePasswordAuthenticationToken` and delegates to Spring's `AuthenticationManager`
3. `CustomUserDetailsServiceImpl.loadUserByUsername()` loads the `User` entity from MySQL via `UserDao.findByEmail()`
4. Spring Security verifies the password with `BCryptPasswordEncoder.matches()`
5. On success, `JwtUtils.generateJwtToken()` builds a signed JWT containing the user's email (`sub`), issue time (`iat`), expiry (`exp`), and role (`authorities` custom claim)
6. The token is signed with **HMAC-SHA256** using a 256-bit secret key, returned to the client as `{ message, jwt }`

### 🛡️ Per-Request Verification

`JWTCustomFilter` (an `OncePerRequestFilter`) intercepts every incoming request **before** it reaches any controller:

1. Reads the `Authorization: Bearer <token>` header
2. Extracts and validates the JWT — `JwtUtils.validateJwtToken()` verifies the HMAC-SHA256 signature and checks expiry
3. Extracts the username (email) from the validated claims
4. Re-loads the corresponding `UserDetails` from the database via `UserDetailsService.loadUserByUsername()` — ensuring authorities always reflect the **current** role stored in MySQL, not a stale snapshot from the token
5. Builds an authenticated `UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities())` and stores it in `SecurityContextHolder`
6. Passes the request down the filter chain — Spring Security then enforces URL-based authorization rules (`permitAll`, `hasRole("ADMIN")`, `authenticated()`)

### 🗺️ Authorization Rules (`SecurityConfiguration`)

| Route pattern | Access |
|---|---|
| `/users/signup`, `/users/signin` | 🌍 Public |
| `/online-exam/subjects`, `/online-exam/questions/subject/**` | 🌍 Public |
| `/swagger-ui/**`, `/v*/api-docs/**` | 🌍 Public |
| `/online-exam/admin/**`, `/admin/**` | 🔒 `ROLE_ADMIN` only |
| `/exam-results/**` | ✅ Any authenticated user |
| Everything else | ✅ Authenticated |

Session management is **`STATELESS`** — no server-side session store; the JWT alone carries identity on every request, enabling horizontal scalability.

---

## 🚀 Getting Started

### ✅ Prerequisites
- Java 21 JDK
- Node.js 18+
- MySQL 8 (running locally, or update `application.properties` accordingly)
- Maven (or use the bundled `mvnw` wrapper)

---

### 1. Backend Setup

```bash
cd Backend

mvn spring-boot:run
```

Backend runs on → **`http://localhost:8080`**
The `examsys` schema is auto-created on first run (`createDatabaseIfNotExist=true`, `ddl-auto=update`).

📘 Swagger UI: `http://localhost:8080/swagger-ui/index.html`

---

### 2. Frontend Setup

```bash
cd Frontend
npm install
npm run dev
```

Frontend runs on → **`http://localhost:5173`**
Both servers must run simultaneously.

---

### 3. Creating the First Admin Account

Admins cannot self-register from the UI. Either:

```bash
curl -X POST http://localhost:8080/users/signup \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Admin","lastName":"User","email":"admin@lakshya.com","password":"Admin@123","role":"ROLE_ADMIN"}'
```

or sign up as a student via the UI, then promote manually:

```sql
UPDATE user SET role = 'ROLE_ADMIN' WHERE email = 'admin@lakshya.com';
```

---

## 📝 Environment Configuration

Key properties in `Backend/src/main/resources/application.properties`:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/examsys?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true
spring.datasource.username=CDAC
spring.datasource.password=********

spring.jpa.hibernate.ddl-auto=update

SECRET_KEY=<64-char hex string — HMAC-SHA256 signing key>
EXP_TIMEOUT=86400000   # JWT validity in ms (24 hours)
```

> ⚠️ **Do not commit a real `SECRET_KEY` or database password to version control.** Use environment variables or a `.env`-style override (e.g. `application-local.properties`, git-ignored) for any deployment beyond local development.

---

## 📡 API Reference

### 👤 Users
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `POST` | `/users/signup` | 🌍 Public | Register a new student |
| `POST` | `/users/signin` | 🌍 Public | Authenticate, returns JWT |
| `GET` | `/users/admin/all-students` | 🔒 Admin | List all students |

### 📝 Online Exam
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/online-exam/subjects` | 🌍 Public | Distinct list of subjects |
| `GET` | `/online-exam/questions/subject/{subject}` | 🌍 Public | Questions for a subject |
| `GET` | `/online-exam/all-questions` | 🌍 Public | All questions (admin grid) |
| `GET` | `/online-exam/question/{id}` | ✅ Authenticated | Single question |
| `POST` | `/online-exam/admin/create-new-question` | 🔒 Admin | Create a question |
| `PUT` | `/online-exam/admin/question/{id}/update` | 🔒 Admin | Update a question |
| `DELETE` | `/online-exam/admin/question/{id}/delete` | 🔒 Admin | Delete a question |

### 🏆 Exam Results
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `POST` | `/exam-results/submit` | ✅ Authenticated | Submit exam result |
| `GET` | `/exam-results/my-history` | ✅ Authenticated | Full result history |
| `GET` | `/exam-results/my-history/{subject}` | ✅ Authenticated | History filtered by subject |

Full interactive documentation is available via Swagger UI once the backend is running.

---

## 🗄️ Database Schema

```sql
user                  → id, first_name, last_name, email (unique), password (BCrypt), role
online_exam           → id, question, subject, correct_answer
online_exam_choices   → online_exam_id (FK), choice   — join table via @ElementCollection
exam_result           → id, user_id (FK), subject, score, total_questions, attempted_at
```

Schema is generated automatically by Hibernate from the JPA entity classes — no manual migration scripts required for local development.

---

## 👥 Team

| Name | Contribution |
|------|---------------|
| **Ritik Garhewal** | Frontend — Navbar, ExamHistory, API integration |
| **Salonee Shirsat** | Backend — Quiz APIs, ExamResult service, JPA repositories |
| **Shreya Jangid** | Backend — DTO design across modules, plus general backend support |
| **Sneha Ghongade** | Full stack — QuizPage timer/scoring, entity design (User, OnlineExam, ExamResult) |
| **Varad Patil** | Designed and built the backend's core architecture, including the Spring Security configuration and JWT-based authentication flow (token generation, validation, and the request filter), and set up the database. Also contributed to core parts of the frontend. |

---

> 📚 Built with ❤️ by Ritik Garhewal, Salonee Shirsat, Shreya Jangid, Sneha Ghongade & Varad Patil — CDAC Mumbai, Kharghar, 2026