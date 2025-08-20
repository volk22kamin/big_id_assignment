## Todo App – Overview

A simple Todo application with a vanilla JS client and a Node.js/Express backend using MongoDB. Packaged with Docker and deployed to Kubernetes via a Helm chart and Jenkins pipelines.

### Technologies
- **Backend**: Node.js 18, Express, Mongoose, MongoDB
- **Frontend**: Vanilla JavaScript (static client)
- **CI/CD**: Jenkins, Kaniko (container builds in Kubernetes)
- **Packaging/Deploy**: Docker, Kubernetes, Helm

### API Endpoints
Base URL: server on port 3000
- **Health**: `GET /health`
- **List todos**: `GET /api/v2/todos`
- **Create todo**: `POST /api/v2/todos` (body: `{ "text": string }`)
- **Update todo completion**: `PUT /api/v2/todos/:id` (body: `{ "completed": boolean }`)
- **Delete todo**: `DELETE /api/v2/todos/:id`

## Helm Chart

Chart path: `todo-app/`

### Objects used
- **Deployment**: app Pods
- **Service**: Cluster networking for Pods
- **Ingress**: HTTP routing to Services
- **HorizontalPodAutoscaler (HPA)**: autoscaling by CPU/memory
- **NetworkPolicy**: traffic isolation and least-privilege networking

### Why NetworkPolicy
- **Ingress restriction**: only allow expected traffic into Pods (server to DB)
- **Egress control**: limit outbound traffic to required services (e.g., DB)
- **Least privilege**: reduce lateral movement and blast radius

### Build and Deploy with Helm
Namespace (example): `todo`

Install or upgrade per app using the base `values.yaml` and app-specific values file:

```bash
# Client
helm upgrade --install -n todo client ./todo-app \
  -f ./todo-app/values.yaml \
  -f ./todo-app/client-values.yaml

# Server
helm upgrade --install -n todo server ./todo-app \
  -f ./todo-app/values.yaml \
  -f ./todo-app/server-values.yaml

# MongoDB
helm upgrade --install -n todo mongodb ./todo-app \
  -f ./todo-app/values.yaml \
  -f ./todo-app/mongodb-values.yaml
```

Notes:
- The app name (`client`, `server`, `mongodb`) becomes the Helm release name.
- The app-specific values files set image, service, ingress, and other per-app config.

## Jenkins Pipelines

- **Client CI** (`client/Jenkinsfile`):
  - Builds and pushes the client image with Kaniko.
  - On `main`, triggers the CD job, passing the target app parameter.

- **Server CI** (`server/Jenkinsfile`):
  - Installs dependencies and runs tests.
  - Builds and pushes the server image with Kaniko.

- **CD (generic)** (`Jenkinsfile.deploy`):
  - Parameterized with `APP_TO_DEPLOY` (`client`, `server`, `mongodb`) and `BRANCH_NAME`.
  - Performs `helm upgrade --install` using the app-specific values file to deploy the selected component.


