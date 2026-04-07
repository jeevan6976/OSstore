#!/bin/bash
# OS Store — VPS Setup Script
# Run this on a fresh Ubuntu 22.04+ VPS

set -e

echo "========================================="
echo "  OS Store — VPS Setup"
echo "========================================="

# 1. Update system
echo "[1/6] Updating system..."
sudo apt update && sudo apt upgrade -y

# 2. Install Docker
echo "[2/6] Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker $USER
    echo "  Docker installed. You may need to log out and back in for group changes."
else
    echo "  Docker already installed."
fi

# 3. Install Docker Compose v2 plugin
echo "[3/6] Installing Docker Compose v2..."
# Remove broken v1 if present
sudo apt remove -y docker-compose 2>/dev/null || true
sudo rm -f /usr/local/bin/docker-compose 2>/dev/null || true
sudo apt install -y docker-compose-plugin
echo "  Docker Compose v2 installed: $(docker compose version)"

# 4. Setup firewall
echo "[4/6] Configuring firewall..."
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 8000/tcp  # API (direct, remove after setting up nginx)
sudo ufw --force enable

# 5. Install systemd service (auto-stop on logout)
echo "[5/6] Installing systemd service..."
sudo cp /root/OSstore/infra/osstore.service /etc/systemd/system/osstore.service
sudo systemctl daemon-reload
echo "  Service installed."
echo ""
echo "  Usage:"
echo "    sudo systemctl start osstore   # Start containers"
echo "    sudo systemctl stop osstore    # Stop containers"
echo "    sudo systemctl status osstore  # Check status"
echo ""
echo "  To auto-stop on SSH logout, add to your ~/.bash_logout:"
echo '    sudo systemctl stop osstore'

# 6. Clone and start
echo "[6/6] Ready to deploy!"
echo ""
echo "Next steps:"
echo "  1. git clone https://github.com/jeevan6976/OSstore.git"
echo "  2. cd OSstore"
echo "  3. cp .env.example .env"
echo "  4. nano .env  (edit your secrets)"
echo "  5. sudo systemctl start osstore   # builds + starts everything"
echo "  6. sudo systemctl stop osstore    # stops everything when done"
echo ""
echo "To auto-stop on logout:"
echo '  echo "sudo systemctl stop osstore" >> ~/.bash_logout'
echo ""
echo "Done!"
