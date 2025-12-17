#!/bin/bash

# Define the domains to map
DOMAINS=(
    "volteryde.org"
    "admin.volteryde.org"
    "dispatch.volteryde.org"
    "partners.volteryde.org"
    "support.volteryde.org"
    "docs.volteryde.org"
)

# Host file path
HOSTS_FILE="/etc/hosts"

# IP address to map to
IP="127.0.0.1"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root (sudo)"
  exit 1
fi

echo "Updating $HOSTS_FILE with local domains for Volteryde Platform..."

for DOMAIN in "${DOMAINS[@]}"; do
    if grep -q "$DOMAIN" "$HOSTS_FILE"; then
        echo "Domain $DOMAIN already exists in hosts file."
    else
        echo "$IP $DOMAIN" >> "$HOSTS_FILE"
        echo "Added $DOMAIN to hosts file."
    fi
done

echo "Done! You can now access:"
for DOMAIN in "${DOMAINS[@]}"; do
    echo "  http://$DOMAIN"
done
