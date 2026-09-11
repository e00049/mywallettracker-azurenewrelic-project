# 💰 MyWalletTracker

A full-stack personal finance tracker — **Django REST API + React** — deployed on **Azure Kubernetes Service (AKS)** with a fully automated, **secretless CI/CD pipeline** via Azure DevOps.

> Built as a hands-on cloud engineering project: containerized app, workload-identity auth (no stored secrets anywhere), secrets in Key Vault, and observability with New Relic APM.

**Stack:** ReactJS · Django REST Framework · Docker · Azure AKS · Azure DevOps · New Relic

---

## 📋 Table of Contents

1. [What it does](#-what-it-does)
2. [Architecture](#-architecture)
3. [Tech stack](#-tech-stack)
4. [Repository structure](#-repository-structure)
5. [Running locally](#-running-locally)
6. [Azure deployment](#-azure-deployment)
7. [CI/CD pipeline](#-cicd-pipeline)
8. [Security model](#-security-model)
9. [Roadmap](#-roadmap)

---

## ✨ What it does

MyWalletTracker lets a user log income and expenses, organise them by category, and see their spending at a glance.

- 🔐 **User accounts** with JWT authentication (register, login, auto token-refresh)
- 💸 **Transactions** — add, filter by type / category / date range
- 🏷️ **Categories** — user-scoped, deleting a category preserves its history
- 📊 **Dashboards** — a donut chart of spending by category and a 6-month income-vs-expense bar chart
- 🇮🇳 Amounts formatted in Indian rupees

---

## 🏗️ Architecture

How a request flows once the app is live on AKS:

```
                         ┌─────────────────────────────────┐
   Browser  ───HTTP──►   │      Azure Load Balancer         │
                         │        (public IP)               │
                         └───────────────┬─────────────────┘
                                         │
                                         ▼
                         ┌─────────────────────────────────┐
                         │   frontend Service  (2 pods)     │
                         │   nginx serving the React build  │
                         │   proxies /api/* → backend       │
                         └───────────────┬─────────────────┘
                                         │  (in-cluster DNS)
                                         ▼
                         ┌─────────────────────────────────┐
                         │   backend Service  (2 pods)      │
                         │   Django + gunicorn (:8000)      │
                         └───────┬──────────────────┬──────┘
                                 │                  │
                                 ▼                  ▼
                   ┌──────────────────┐   ┌────────────────────┐
                   │ Azure PostgreSQL │   │  Azure Key Vault   │
                   │ Flexible Server  │   │ (secrets via CSI)  │
                   └──────────────────┘   └────────────────────┘
```

**Key idea:** the React frontend calls the backend using the **relative path `/api/v1`**, so nginx routes API traffic internally. No hardcoded backend URL is baked into the image — the same container image runs unchanged in every environment.

---

## 🧰 Tech stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React (Vite), Tailwind CSS v4, axios, react-router-dom, recharts |
| **Backend** | Django 5, Django REST Framework, SimpleJWT, gunicorn |
| **Database** | Azure Database for PostgreSQL (Flexible Server, v16) |
| **Container registry** | Azure Container Registry (ACR) |
| **Orchestration** | Azure Kubernetes Service (AKS) |
| **Secrets** | Azure Key Vault + Secrets Store CSI Driver |
| **Identity** | Microsoft Entra Workload Identity (no stored credentials) |
| **CI/CD** | Azure DevOps Pipelines |
| **Observability** | New Relic APM |

---

## 📁 Repository structure

```
mywallettracker-azurenewrelic-project/
├── backend-django-code/          # Django REST API
│   ├── mywallettracker/          # settings package
│   ├── apps/accounts/            # auth, users
│   ├── apps/wallet/              # categories, transactions
│   ├── Dockerfile
│   └── entrypoint.sh             # runs migrations, then gunicorn
├── frontend-reactjs-code/        # React + Vite SPA
│   ├── src/api/client.js         # axios instance w/ token refresh
│   ├── src/context/AuthContext.jsx
│   ├── src/pages/                # Login, Register, Dashboard
│   ├── Dockerfile                # multi-stage: node build → nginx serve
│   └── nginx.conf
├── kubernetes-manifest-files/    # K8s YAML (applied in order 00 → 04)
│   ├── 00-serviceaccount.yaml
│   ├── 01-secretprovider.yaml    # SecretProviderClass (Key Vault → Secret)
│   ├── 03-backend.yaml
│   └── 04-frontend.yaml
├── azure-pipelines.yml           # CI/CD definition
└── README.md
```

---

## 💻 Running locally

### Prerequisites
- Python 3.12, Node.js 20, Docker (optional)

### Backend

```bash
cd backend-django-code
pip install -r requirements.txt

# No DATABASE_URL set → falls back to SQLite automatically
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

API is now at `http://localhost:8000/api/v1/`.

### Frontend

```bash
cd frontend-reactjs-code
npm install
npm run dev          # Vite dev server on http://localhost:5173
```

### With Docker

```bash
# Backend (SQLite fallback when DATABASE_URL is unset)
docker build -t mywallettracker-backend:v3 backend-django-code
docker run -p 8000:8000 mywallettracker-backend:v3

# Frontend — VITE_API_URL is a BUILD arg (baked in at build time)
docker build --build-arg VITE_API_URL=/api/v1 \
  -t mywallettracker-frontend:v1 frontend-reactjs-code
docker run -p 8080:8080 mywallettracker-frontend:v1
```

### API reference

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/v1/register/` | Create account |
| POST | `/api/v1/login/` | Get JWT tokens |
| POST | `/api/v1/token/refresh/` | Refresh access token |
| GET | `/api/v1/me/` | Current user |
| GET/POST | `/api/v1/categories/` | List / create categories |
| GET/POST | `/api/v1/transactions/` | List / create transactions |
| GET | `/api/v1/transactions/summary/` | Income / expense / balance totals |
| GET | `/api/v1/transactions/monthly/` | Last-6-months aggregation |

Transaction filters: `?type=` · `?category=` · `?start_date=` · `?end_date=`

---

## ☁️ Azure deployment

### Resources

All resources live in one resource group (`mywallettracker-azurenewrelic-rg1`, region `southindia`) and follow the naming convention `mywallettracker-NN-<type>`:

| # | Resource | Type |
|---|----------|------|
| 02 | `mywallettracker02acrrepo` | Container Registry *(no hyphens allowed)* |
| 03 | `mywallettracker-03-akscluster` | Kubernetes Service |
| 04 | `mywallettracker-04-postgresdb` | PostgreSQL Flexible Server |
| 05 | `mywallettracker-05-kv` | Key Vault |
| 06 | `mywallettracker-06-wif` | Managed identity (app → Key Vault) |
| 07 | `mywallettracker-07-adowif` | Managed identity (CI/CD) |

### Workload Identity — how the app reads secrets without any stored credential

This is the core security pattern. A pod proves who it is with a short-lived token instead of a password:

```
   Pod  ──uses──►  ServiceAccount (mwt-sa)
                          │  token
                          ▼
              Federated Identity Credential
                          │  trusts the AKS OIDC issuer
                          ▼
                 Managed Identity (06-wif)
                          │  has "Key Vault Secrets User"
                          ▼
                    Azure Key Vault
```

The **Secrets Store CSI Driver** then mounts the Key Vault secrets (`django-secret-key`, `database-url`, `newrelic-license-key`) into the pod as a Kubernetes Secret (`mwt-secrets`), so the Django code reads them from `os.environ` exactly as it does locally — no code changes between environments.

> **Gotchas learned the hard way**
> - The pod needs **both** the label `azure.workload.identity/use: "true"` **and** the CSI volume mount, or the secret is never created.
> - The Postgres connection string **must** end with `?sslmode=require`.
> - A `pg_isready` init-container waits for the database before migrations run, avoiding a crash loop on cold start.

---

## 🔄 CI/CD pipeline

`git push` to `main` → app rebuilt and redeployed automatically. **Zero secrets stored in the pipeline** — Azure DevOps authenticates to Azure via Workload Identity Federation.

```
   git push (main)
        │
        ▼
   ┌─────────────────────────────────────────────┐
   │  STAGE 1 · Build                             │
   │  • az acr build → backend image  (parallel)  │
   │  • az acr build → frontend image (parallel)  │
   └───────────────────────┬─────────────────────┘
                           ▼
   ┌─────────────────────────────────────────────┐
   │  STAGE 2 · Deploy to AKS                     │
   │  • inject identity clientId into manifests   │
   │  • kubectl apply (00 → 04)                   │
   │  • kubectl set image → new build tag         │
   │  • kubectl rollout status (waits for Ready)  │
   └─────────────────────────────────────────────┘
```

**How the pipeline authenticates:** an Azure DevOps *service connection* holds a federated credential trusting the DevOps OIDC issuer. At runtime, DevOps swaps its own token for a short-lived Azure token — the same secretless pattern the app uses in-cluster, just with DevOps as the identity provider.

The CI identity (`mywallettracker-07-adowif`) needs:
- **Contributor** on the ACR — `az acr build` runs server-side and needs management-plane access (`AcrPush` alone is not enough)
- **Azure Kubernetes Service Cluster User Role** on the cluster — to fetch the kubeconfig for deploy

---

## 🔒 Security model

**Done right:**
- ✅ No secrets in git, in images, or in the pipeline — everything flows through Workload Identity + Key Vault
- ✅ Containers run as non-root with resource limits and liveness/readiness probes
- ✅ Least-privilege roles (the app identity only gets *read* on secrets)
- ✅ Database reachable only from within Azure (no public exposure of data)

**Known rough edges (portfolio project, not yet production):**
- ⚠️ `ALLOWED_HOSTS = "*"` and `CORS_ALLOW_ALL_ORIGINS = True` — to be pinned once a domain is set
- ⚠️ No Ingress/TLS yet — the frontend is served over plain HTTP

---

## 🗺️ Roadmap

- [ ] **Ingress + TLS** — nginx-ingress + cert-manager for a real `https://` domain
- [ ] **Budgets** — monthly spending limits per category
- [ ] **Quick wins** — edit transactions, pagination
- [ ] **Receipt uploads** — attach images to transactions via Azure Blob Storage

---

<div align="center">

Built with ReactJS · Django · Azure AKS

</div>
