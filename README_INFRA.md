# Volteryde Platform Infrastructure Guide

This guide explains how to set up the local development environment ensuring all applications are accessible via their respective subdomains.

## Prerequisites

- Docker & Docker Compose
- Node.js (for local scripts)

## 1. Local DNS Setup

To access the applications via `volteryde.org` and its subdomains locally, you need to map these domains to `127.0.0.1` in your `/etc/hosts` file.

We have provided a script to automate this:

```bash
sudo ./scripts/setup-local-dns.sh
```

This will add the following entries to your hosts file:
- `volteryde.org`
- `admin.volteryde.org`
- `dispatch.volteryde.org`
- `partners.volteryde.org`
- `support.volteryde.org`
- `docs.volteryde.org`

## 2. Running the Platform

Start all services using Docker Compose:

```bash
docker-compose up -d --build
```

The `--build` flag is recommended when starting for the first time or after changing Dockerfiles.

## 3. Accessing Applications

Once the containers are running and the DNS is set up, you can access the applications at:

| Application | URL | Internal Port (Container) |
|-------------|-----|---------------------------|
| **Landing Page** | `http://volteryde.org` | 3000 |
| **Admin Dashboard** | `http://admin.volteryde.org` | 3000 |
| **Dispatcher App** | `http://dispatch.volteryde.org` | 3000 |
| **Partner App** | `http://partners.volteryde.org` | 3000 |
| **Support App** | `http://support.volteryde.org` | 3000 |
| **Docs Platform** | `http://docs.volteryde.org` | 3000 |

## Troubleshooting

- **502 Bad Gateway**: This usually means the application container is not yet ready or failed to start. Check logs with `docker-compose logs -f <service-name>`.
- **Connection Refused**: Ensure you ran the DNS setup script and that Docker is running.
- **Port Conflicts**: Ensure ports 80 and 443 are free on your host machine.
