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
- **Ingress**: HTTP routing to Services (infra ready but not used here)
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
  --values ./todo-app/values.yaml \
  --values ./todo-app/client-values.yaml

# Server
helm upgrade --install -n todo server ./todo-app \
  --values ./todo-app/values.yaml \
  --values ./todo-app/server-values.yaml

# MongoDB
helm upgrade --install -n todo mongodb ./todo-app \
  --values ./todo-app/values.yaml \
  --values ./todo-app/mongodb-values.yaml
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

### Jenkins notifications and triggers
- **Email notifications**: Configured Jenkins mail step (Mailer plugin) to send build status emails to Gmail on success/failure (see `post { success { mail ... } failure { mail ... } }` in CI Jenkinsfiles).
- **GitHub webhooks**: Repository webhooks trigger Jenkins builds on each commit.
- **Path-based triggers**: Jobs are configured so that only changes under `server/**` trigger the Server CI pipeline and only changes under `client/**` trigger the Client CI pipeline (e.g., with Included Regions/when-changes filtering).

### Jenkins installation
- Installed Jenkins via Helm chart with custom overrides for pod templates used by the pipelines:

```bash
helm repo add jenkinsci https://charts.jenkins.io
helm repo update
helm install my-jenkins jenkinsci/jenkins --version 5.8.79 -f my-jenkins-values.yaml
```

The custom values file configures the required Kubernetes pod templates (Kaniko, Node, k8s-tools) for the pipelines.

### Manual steps required
- Image tags for deployment are set manually in the corresponding app values files (`todo-app/client-values.yaml`, `todo-app/server-values.yaml`, `todo-app/mongodb-values.yaml`).
- After deploying the server, copy the Service IP and paste it into the client values as the API URL so the client points to the server.
  - (A better approach is to use a DNS name for the server to keep a stable endpoint for the client, but to avoid costs this setup uses the raw IP.)


