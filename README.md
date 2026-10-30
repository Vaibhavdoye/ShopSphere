\# ShopSphere – Enterprise E-Commerce Platform



ShopSphere is a full-stack e-commerce application built with React, TypeScript, Node.js, Express, and PostgreSQL. It provides product browsing, user authentication, shopping cart management, and order processing.



\## 1. Technology Stack



\### Frontend

\- React 19

\- TypeScript

\- Vite

\- CSS

\- Local Storage for cart persistence



\### Backend

\- Node.js

\- Express 5

\- TypeScript

\- PostgreSQL

\- JWT Authentication

\- bcryptjs for password hashing

\- Helmet and Express Rate Limit for security



\## 2. Project Structure



```text

Enterprise-Ecommerce-Project/

│

├── backend/

│   ├── database/

│   │   └── orders.sql

│   ├── services/

│   │   ├── - product-service/

│   │   ├── auth-service/

│   │   └── order-service/

│   ├── tests/

│   │   └── auth.test.ts

│   ├── src/

│   │   └── server.ts

│   ├── package.json

│   └── tsconfig.json

│

├── frontend/

│   ├── public/

│   ├── src/

│   │   ├── assets/

│   │   ├── App.tsx

│   │   ├── App.css

│   │   ├── index.css

│   │   └── main.tsx

│   └── package.json

│

└── README.md

```



\## 3. Main Features



\- User registration and login

\- JWT-based authentication

\- Secure password hashing

\- Product listing and browsing

\- Shopping cart management

\- Cart persistence using Local Storage

\- Order placement and management

\- PostgreSQL database integration

\- Input validation and error handling

\- Rate limiting and security headers



\## 4. Backend Services



| Service | Port | Responsibility |

|---|---:|---|

| Main API | 5000 | Main API and health endpoint |

| Product Service | 5001 | Product operations |

| Auth Service | 5002 | Registration and authentication |

| Order Service | 5003 | Order operations |



\## 5. Installation and Setup



\### Prerequisites

\- Node.js and npm

\- PostgreSQL

\- Git



\### Backend Setup



Open a terminal in the backend directory:



```bash

cd backend

npm install

```



Configure the required database and JWT environment variables in `backend/.env`. Do not commit this file.



Build the backend:



```bash

npm run build

```



Start the main API:



```bash

npm run dev

```



\### Frontend Setup



Open another terminal:



```bash

cd frontend

npm install

npm run dev

```



Open the local URL displayed by Vite in your browser.



\### Additional Services



The Product, Auth, and Order services are located in `backend/services/`. Configure their database and environment requirements before starting them individually.



\## 6. Database



ShopSphere uses PostgreSQL for persistent application data.



The order database schema is available at:



`backend/database/orders.sql`



The order schema references the `users` table, which must exist before creating the order tables.



\## 7. API Endpoints



\### Main API

\- `GET /api/health`



\### Product Service

\- `GET /health`

\- `GET /api/products`

\- `GET /api/products/:id`



\### Auth Service

\- `GET /health`

\- `GET /health/db`

\- `POST /api/auth/register`

\- `POST /api/auth/login`

\- `GET /api/auth/me`



\### Order Service

\- `GET /health`

\- `GET /health/db`

\- `POST /api/orders`

\- `GET /api/orders`



\## 8. Testing



Run backend tests:



```bash

cd backend

npm test

```



Build the frontend:



```bash

cd frontend

npm run build

```



Build the backend:



```bash

cd backend

npm run build

```



\## 9. Security



The project includes:

\- JWT-based authentication

\- bcrypt password hashing

\- Helmet security headers

\- Express rate limiting

\- Input validation

\- Parameterized database queries

\- Environment-based secret configuration



\## 10. Future Improvements



\- API Gateway integration

\- Role-based authorization

\- Automated end-to-end testing

\- CI/CD pipeline

\- Docker and Kubernetes deployment

\- Centralized logging and monitoring

\- Performance testing and optimization

\- Expanded technical documentation



\## 11. Project Goal



The goal of ShopSphere is to demonstrate a modular e-commerce application with a React frontend, Node.js backend services, secure authentication, and PostgreSQL database integration.

