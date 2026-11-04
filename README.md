# ShopSphere – Enterprise E-Commerce Platform

ShopSphere is a full-stack e-commerce application built with React, TypeScript, Node.js, Express, and PostgreSQL. It provides product browsing, user authentication, shopping cart management, and order processing.

## 1. Technology Stack

### Frontend
- React 19
- TypeScript
- Vite
- CSS
- Local Storage for cart persistence

### Backend
- Node.js
- Express 5
- TypeScript
- PostgreSQL
- JWT Authentication
- bcryptjs for password hashing
- Helmet and Express Rate Limit for security

### Infrastructure
- Docker and Docker Compose
- Kubernetes
- GitHub Actions

## 2. Project Structure

```text
Enterprise-Ecommerce-Project/
├── backend/
│   ├── database/
│   ├── services/
│   │   ├── - product-service/
│   │   ├── auth-service/
│   │   └── order-service/
│   ├── src/
│   ├── tests/
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
├── k8s/
│   └── microservices.yaml
├── .github/
│   └── workflows/
│       └── ci.yml
└── README.md
```

## 3. Main Features

- User registration and login
- JWT-based authentication
- Role-based authorization
- Secure password hashing
- Product listing and browsing
- Shopping cart management
- Cart persistence using Local Storage
- Order placement and management
- PostgreSQL database integration
- Input validation and error handling
- Rate limiting and security headers
- Microservices architecture
- API Gateway integration

## 4. Backend Services

| Service | Port | Responsibility |
|---|---:|---|
| Main API Gateway | 5000 | Routes API requests |
| Product Service | 5001 | Product operations |
| Auth Service | 5002 | Registration and authentication |
| Order Service | 5003 | Order operations |

## 5. Installation and Setup

### Prerequisites
- Node.js and npm
- PostgreSQL
- Git
- Docker Desktop (for container deployment)
- Kubernetes (for orchestration)

### Backend Setup

```bash
cd backend
npm install
npm run build
npm run dev
```

Configure the required database and JWT environment variables in the appropriate `.env` files. Never commit secrets.

### Frontend Setup

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL displayed by Vite in your browser.

### Additional Services

The Product, Auth, and Order services are located in `backend/services/`. Configure their environment variables and database requirements before starting them individually.

## 6. Database

ShopSphere uses PostgreSQL for persistent application data.

The order database schema is available at:

`backend/database/orders.sql`

The order schema references the users table, which must exist before creating the order tables.

Database indexing is implemented for order query optimization.

## 7. API Endpoints

### Main API Gateway
- `GET /api/health`
- `GET /api/metrics`

### Product Service
- `GET /health`
- `GET /api/products`
- `GET /api/products/:id`

### Auth Service
- `GET /health`
- `GET /health/db`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Order Service
- `GET /health`
- `GET /health/db`
- `POST /api/orders`
- `GET /api/orders`

The API Gateway routes authentication, product, and order requests to their respective services.

## 8. Testing

### Backend Tests

```bash
cd backend
npm test
```

### Backend Build

```bash
cd backend
npm run build
```

### Frontend Build

```bash
cd frontend
npm run build
```

### End-to-End Testing

Playwright is used for automated end-to-end testing of the shopping journey.

## 9. Security

Implemented security features:
- JWT-based authentication
- Role-based authorization
- bcrypt password hashing
- Helmet security headers
- Express rate limiting
- Input validation
- Parameterized database queries
- Environment-based secret configuration
- Non-root backend container execution
- Kubernetes resource limits and health probes

Production HTTPS and PostgreSQL TLS must be configured with valid production certificates and a TLS-enabled database provider before public production deployment.

## 10. Monitoring and Logging

- Structured JSON request logging
- Request timestamp, method, URL, status code, and response time
- API metrics endpoint at `/api/metrics`
- Application uptime and memory usage
- Total request counter
- Health check endpoints

## 11. Docker Deployment

The main Docker Compose configuration can be started with:

```bash
docker compose up --build -d
```

Check running containers:

```bash
docker compose ps
```

Stop containers:

```bash
docker compose down
```

For the microservices configuration:

```bash
cd backend
docker compose -f compose.microservices.yaml up --build -d
```

## 12. Kubernetes Deployment

Kubernetes configuration is available in the `k8s/` directory.

Check deployments, pods, and services:

```bash
kubectl get deployments,pods,services
```

Check backend rollout:

```bash
kubectl rollout status deployment/shopsphere-backend
```

View backend logs:

```bash
kubectl logs deployment/shopsphere-backend
```

The current Kubernetes setup has been tested locally using Docker Desktop Kubernetes.

## 13. CI/CD

GitHub Actions CI workflow:

`.github/workflows/ci.yml`

The existing CI pipeline runs automated checks.

Continuous Deployment (CD) to a cloud environment is a remaining deployment task.

## 14. Performance and Database Optimization

- PostgreSQL indexing for frequently queried data
- Database connection pooling
- Order query optimization
- API response caching for product lookup
- Performance testing using Autocannon

## 15. Deployment Status and Future Improvements

### Implemented
- Three backend microservices
- API Gateway
- Authentication and authorization
- Docker containerization
- Kubernetes deployment configuration
- Unit tests and end-to-end testing
- GitHub Actions CI
- JSON logging and API metrics
- Database indexing and performance testing

### Remaining Production Tasks
- Cloud deployment (AWS, GCP, or Azure)
- Continuous Deployment pipeline
- Public HTTPS with a valid TLS certificate
- Production PostgreSQL TLS activation
- Final integration testing coverage review

## 16. Project Goal

The goal of ShopSphere is to demonstrate a modular e-commerce application with a React frontend, Node.js backend microservices, secure authentication, PostgreSQL database integration, automated testing, and container orchestration.
