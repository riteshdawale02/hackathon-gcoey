#!/usr/bin/env bash
# ==============================================================================
# PulseQueue 1-Command EC2 Deployment Script (t3.xlarge / Ubuntu / Amazon Linux)
# ==============================================================================
set -e

echo "🚀 Starting PulseQueue Automated Deployment on EC2..."

# 1. Detect OS & Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo "📦 Docker not found. Installing Docker..."
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        if [[ "$ID" == "ubuntu" || "$ID_LIKE" == *"ubuntu"* || "$ID" == "debian" ]]; then
            sudo apt-get update -y
            sudo apt-get install -y ca-certificates curl gnupg
            sudo install -m 0755 -d /etc/apt/keyrings
            curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
            sudo chmod a+r /etc/apt/keyrings/docker.gpg
            echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $VERSION_CODENAME stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
            sudo apt-get update -y
            sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
        elif [[ "$ID" == "amzn" || "$ID_LIKE" == *"rhel"* || "$ID_LIKE" == *"centos"* ]]; then
            sudo yum update -y
            sudo yum install -y docker
            sudo systemctl enable docker
            sudo systemctl start docker
        fi
        sudo usermod -aG docker $USER || true
    fi
fi

# Ensure docker service is running
sudo systemctl start docker || true

echo "🐳 Building and launching microservices via Docker Compose..."
# Use docker compose (v2) or docker-compose (v1)
if docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
else
    COMPOSE_CMD="docker-compose"
fi

$COMPOSE_CMD down --remove-orphans || true
$COMPOSE_CMD up -d --build

echo "⏳ Waiting for microservices to initialize..."
sleep 15

# Fetch EC2 Public IP if available via IMDS, else fallback to hostname
PUBLIC_IP=$(curl -s --connect-timeout 2 http://169.254.169.254/latest/meta-data/public-ipv4 || curl -s ifconfig.me || echo "localhost")

echo ""
echo "=========================================================================="
echo "🎉 PulseQueue Hospital System is LIVE on EC2!"
echo "=========================================================================="
echo "👉 Web App Portal:        http://${PUBLIC_IP}"
echo "👉 Waiting Lobby TV:      http://${PUBLIC_IP}/display"
echo "👉 Doctor Examination:    http://${PUBLIC_IP}/doctor"
echo "👉 Reception Desk:        http://${PUBLIC_IP}/reception"
echo "👉 Identity Service:      http://${PUBLIC_IP}:5001/health"
echo "👉 Java Queue Service:    http://${PUBLIC_IP}:8080/health"
echo "=========================================================================="
echo "Tip: Ensure EC2 Security Group inbound allows TCP ports: 80, 3000, 5001, 8080"
