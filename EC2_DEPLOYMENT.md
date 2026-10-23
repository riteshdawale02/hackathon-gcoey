# 🚀 PulseQueue: AWS EC2 Deployment Guide

This guide provides end-to-end instructions for deploying **PulseQueue** (Smart Token & Queue Management System) onto an **AWS EC2** instance using Docker and Docker Compose.

---

## 📋 Table of Contents
1. [Architecture & Zero-Config Design](#1-architecture--zero-config-design)
2. [EC2 Instance & Security Group Prerequisites](#2-ec2-instance--security-group-prerequisites)
3. [Method A: 1-Command Automated Deployment (Recommended)](#3-method-a-1-command-automated-deployment-recommended)
4. [Method B: Manual Step-by-Step Deployment](#4-method-b-manual-step-by-step-deployment)
5. [Configuring Google Cloud OAuth 2.0 (Optional)](#5-configuring-google-cloud-oauth-20-optional)
6. [Access URLs & Test Accounts](#6-access-urls--test-accounts)
7. [Useful Maintenance Commands](#7-useful-maintenance-commands)
8. [Troubleshooting & FAQs](#8-troubleshooting--faqs)

---

## 1. Architecture & Zero-Config Design

PulseQueue is engineered with a **zero-configuration proxy architecture**. You **do not need to change `localhost` to your EC2 IP address in the code**:

```
                       ┌────────────────────────────────────────────────────────┐
                       │                     AWS EC2 Host                       │
                       │                                                        │
 Internet Traffic      │   ┌────────────────────────────────────────────────┐   │
 ────────────────────> │   │         Nginx Reverse Proxy & Frontend         │   │
 (HTTP Port 80)        │   │         (pulsequeue-frontend container)        │   │
                       │   └───────┬────────────────────────┬───────────────┘   │
                       │           │                        │                   │
                       │           │ /api/auth/*            │ /api/queue/*      │
                       │           │ /api/patients/*        │ /api/tokens/*     │
                       │           │ /api/departments/*     │                   │
                       │           ▼                        ▼                   │
                       │   ┌────────────────┐       ┌────────────────┐          │
                       │   │ Node.js Auth   │       │ Java Spring    │          │
                       │   │ :5001          │       │ :8080          │          │
                       │   └───────┬────────┘       └───────┬────────┘          │
                       │           │                        │                   │
                       │           └───────────┬────────────┘                   │
                       │                       ▼                                │
                       │              ┌─────────────────┐                       │
                       │              │ PostgreSQL :5432│                       │
                       │              └─────────────────┘                       │
                       └────────────────────────────────────────────────────────┘
```

- **Relative Routing (`baseURL: ''`)**: The React frontend uses relative paths. All browser calls go to `http://<EC2-IP>/api/*`.
- **Nginx Ingress**: Nginx forwards API requests to backend containers over the internal Docker network (`pulsequeue-net`).
- **Data Persistence**: Database storage is persisted in the Docker volume `pgdata`.

---

## 2. EC2 Instance & Security Group Prerequisites

### Recommended Instance Specification
| Specification | Recommendation | Notes |
|---|---|---|
| **Instance Type** | `t3.xlarge` (or `t3.large`) | 4 vCPUs, 16 GB RAM (Fast compilation of multi-stage Java/Spring Boot & Node.js containers) |
| **Operating System** | **Ubuntu 22.04 LTS** (or Amazon Linux 2023) | Fully supported by the automated installer script |
| **Storage (EBS)** | 25 GB+ gp3 | Ample space for Docker images, build caches, and database logs |

---

### Inbound Security Group Rules (Firewall)
Before deploying, ensure your EC2 Security Group permits incoming traffic on these ports:

| Type | Protocol | Port Range | Source | Description |
|---|---|---|---|---|
| **SSH** | TCP | `22` | `My IP` (or `0.0.0.0/0`) | Secure Shell remote access |
| **HTTP** | TCP | `80` | `0.0.0.0/0` (Anywhere) | **Primary Web Portal & API Gateway** |
| **Custom TCP** | TCP | `3000` | `0.0.0.0/0` (Anywhere) | Alternate Frontend Web Port |
| **Custom TCP** | TCP | `5001` | `0.0.0.0/0` (Anywhere) | Node.js Identity Service direct port |
| **Custom TCP** | TCP | `8080` | `0.0.0.0/0` (Anywhere) | Java Spring Boot Queue Service direct port |

> **Note**: Port `5432` (PostgreSQL) is kept internal by default. You do not need to expose it publicly.

---

## 3. Method A: 1-Command Automated Deployment (Recommended)

### Step 1: Connect to your EC2 Instance via SSH
```bash
ssh -i /path/to/your-key.pem ubuntu@<YOUR-EC2-PUBLIC-IP>
```

### Step 2: Clone the Repository
```bash
git clone https://github.com/riteshdawale02/hackathon-gcoey.git
cd hackathon-gcoey
```

### Step 3: Run the 1-Command Deploy Script
```bash
chmod +x deploy-ec2.sh
./deploy-ec2.sh
```

**What the script does automatically:**
1. Checks for Docker and installs Docker Engine & Docker Compose plugins if missing.
2. Builds the multi-stage images for React, Node.js Identity Service, and Java Spring Boot.
3. Launches PostgreSQL, seeds database tables, and initializes microservices.
4. Detects your public IP via AWS Instance Metadata Service (IMDS).
5. Prints your active endpoints and URLs.

---

## 4. Method B: Manual Step-by-Step Deployment

If you prefer executing each step manually:

### Step 1: Install Docker & Docker Compose
```bash
# Update repositories
sudo apt-get update -y
sudo apt-get install -y ca-certificates curl gnupg

# Add Docker GPG key
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Add Docker Apt repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker engine and compose
sudo apt-get update -y
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER
```
*(Log out and log back in, or run `newgrp docker` to apply group permissions).*

### Step 2: Clone Repository
```bash
git clone https://github.com/riteshdawale02/hackathon-gcoey.git
cd hackathon-gcoey
```

### Step 3: Launch Services via Docker Compose
```bash
# Build and run in detached mode
docker compose up -d --build
```

### Step 4: Verify All Services are Running
```bash
docker compose ps
```
You should see 4 healthy containers:
- `pulsequeue-postgres` (`5432/tcp`)
- `pulsequeue-identity-service` (`5001/tcp`)
- `pulsequeue-queue-service` (`8080/tcp`)
- `pulsequeue-frontend` (`80/tcp`, `3000/tcp`)

---

## 5. Configuring Google Cloud OAuth 2.0 (Optional)

If you wish to use official **Sign in with Google** on EC2:

1. Go to the [Google Cloud Console Credentials Page](https://console.cloud.google.com/apis/credentials).
2. Edit your **OAuth 2.0 Client ID**.
3. Under **Authorized JavaScript Origins**, add your EC2 HTTP address:
   ```text
   http://<YOUR-EC2-PUBLIC-IP>
   http://<YOUR-EC2-PUBLIC-IP>:3000
   ```
4. Click **Save**.
5. On the PulseQueue login page (`http://<YOUR-EC2-PUBLIC-IP>/login`), click **"⚙️ Google Cloud Setup"** and paste your Client ID. The setting will instantly activate for all sessions.

---

## 6. Access URLs & Test Accounts

Once deployed, access PulseQueue in any web browser:

| Portal | URL | Description |
|---|---|---|
| 🏠 **Main Landing Page** | `http://<EC2-IP>/` | System overview, live KPI metrics & module launcher |
| 👤 **Patient Check-in** | `http://<EC2-IP>/patient` | Digital token generation, AI Triage, live queue wait & QR pass |
| 👩‍💼 **Reception Desk** | `http://<EC2-IP>/reception` | Walk-in patient registration, phone lookup, department triage |
| 👨‍⚕️ **Doctor Console** | `http://<EC2-IP>/doctor` | Examination console, chamber selection, 1-click "Call Next" |
| 📺 **Waiting Lobby TV** | `http://<EC2-IP>/display` | Full-screen broadcast with audio chimes & voice announcements |
| 🩺 **Node Health Check** | `http://<EC2-IP>:5001/health` | Identity service status |
| ☕ **Java Health Check** | `http://<EC2-IP>:8080/health` | Queue service status |

---

### Pre-Configured Test Logins
*(You can also use the 1-click preset buttons on the login screen):*

| Role | Email | Password | Department / Assigned Chamber |
|---|---|---|---|
| **Doctor (Pediatrics)** | `dr.ananya@pulsequeue.com` | `Password123!` | Pediatrics — **Chamber 104** |
| **Doctor (Cardiology)** | `dr.sharma@pulsequeue.com` | `Password123!` | Cardiology — **Room 101** |
| **Doctor (General Med)** | `dr.chen@pulsequeue.com` | `Password123!` | General Medicine — **Room 203** |
| **Receptionist** | `reception@pulsequeue.com` | `Password123!` | Walk-in Counter |
| **Hospital Admin** | `admin@pulsequeue.com` | `Password123!` | System Administration |

---

## 7. Useful Maintenance Commands

Run these commands inside the `hackathon-gcoey` directory on your EC2 instance:

```bash
# View real-time logs for all microservices
docker compose logs -f

# View logs for a specific service
docker compose logs -f queue-service
docker compose logs -f identity-service
docker compose logs -f frontend

# Restart a specific service
docker compose restart queue-service

# Pull latest code and re-deploy without downtime
git pull origin main
docker compose up -d --build

# Stop all services
docker compose down

# Stop and wipe database volumes (Clean reset)
docker compose down -v
```

---

## 8. Troubleshooting & FAQs

### Q1: The browser shows "This site can't be reached" (Connection timed out)
- **Cause**: Port 80 is not opened in your AWS Security Group.
- **Fix**: Open the **AWS EC2 Console -> Instances -> Security Groups -> Inbound rules**, and add an inbound rule: Type: `HTTP`, Port: `80`, Source: `0.0.0.0/0`.

### Q2: Java container takes a while to start on the first run
- **Cause**: Spring Boot 3 compiles inside the multi-stage Docker build on initial creation.
- **Fix**: Wait ~60 seconds. You can monitor progress with `docker compose logs -f queue-service`.

### Q3: Audio chime / Voice speech is muted on Lobby TV
- **Cause**: Modern browsers require user interaction before autoplaying audio.
- **Fix**: Click the **"Chime Muted"** toggle button in the top-right corner of the Lobby TV screen (`/display`) once to enable audio chimes and voice synthesis.

### Q4: How do I assign a custom doctor chamber?
- **Answer**: On `http://<EC2-IP>/doctor`, click the **"CONSULTATION CHAMBER"** badge at the top to select from hospital chambers (`Chamber 104`, `Chamber 101`, `Chamber 203`, etc.) or enter a custom chamber name.

---

**🎉 You are all set! PulseQueue is now running on AWS EC2.**
