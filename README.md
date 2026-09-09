# GZU.LAB — Comparing API Architectures

A responsive English-language blog project based on the assignment in `Comparing API Architectures.pdf`.

## Included

- Comparison matrix for SOAP, REST API, GraphQL and gRPC using 8 criteria.
- REST API selection and justification for a Student Management System.
- Interactive campus API simulator with enroll, list-courses and drop-course scenarios.
- Animated Client → REST API → Database → Response request flow.
- Communication/architecture diagram.
- Technical references from the assignment brief.
- Responsive Gen Z University visual system with jQuery interactions and Bootstrap layout utilities.

## Run locally

Open `index.html` directly, or serve the folder for the best browser behavior:

```bash
python -m http.server 5500
```

Then visit `http://localhost:5500`.

## Run with Docker

Build and start the Nginx container:

```bash
docker compose up -d --build
```

Open `http://localhost:8090`.

To stop the container:

```bash
docker compose down
```

## Deploy on a VPS

Install Docker and Docker Compose on the VPS, then run:

```bash
git clone https://github.com/QuangTam2005/API-Blog.git
cd API-Blog
docker compose up -d --build
```

The website will be available at port `8090`:

```text
http://YOUR_VPS_IP:8090
```

When updating the website:

```bash
git pull
docker compose up -d --build
```
