#!/bin/bash
# OS Store — VPS Setup Script
# Run this on a fresh Ubuntu 22.04+ VPS

set -e

echo "========================================="
echo "  OS Store — VPS Setup"
echo "========================================="

# 1. Update system
echo "[1/5] Updating system..."
sudo apt update && sudo apt upgrade -y

# 2. Install Docker
echo "[2/5] Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker $USER
    echo "  Docker installed. You may need to log out and back in for group changes."
else
    echo "  Docker already installed."
fi

# 3. Install Docker Compose
echo "[3/5] Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    sudo apt install -y docker-compose-plugin
    # Also install standalone for compatibility
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
else
    echo "  Docker Compose already installed."
fi

# 4. Setup firewall
echo "[4/5] Configuring firewall..."
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 8000/tcp  # API (direct, remove after setting up nginx)
sudo ufw --force enable

# 5. Clone and start
echo "[5/5] Ready to deploy!"
echo ""
echo "Next steps:"
echo "  1. git clone https://github.com/jeevan6976/OSstore.git"
echo "  2. cd OSstore"
echo "  3. cp .env.example .env"
echo "  4. nano .env  (edit your secrets)"
echo "  5. docker-compose up -d"
echo ""
echo "Done!"
