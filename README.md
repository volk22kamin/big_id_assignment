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

### Kubernetes prerequisites
- **Image pull secret (Docker Hub)**: The chart references `imagePullSecret: dockerhub-creds` and default namespace `todo` (see `todo-app/values.yaml`). Create the secret in each target namespace before deploying:

```bash
kubectl -n todo create secret docker-registry dockerhub-creds \
  --docker-username=DOCKERHUB_USERNAME \
  --docker-password=DOCKERHUB_PASSWORD \
  --docker-email=YOUR_EMAIL \
  --docker-server=https://index.docker.io/v1/
```

- **MongoDB secrets (server connectivity)**: Create secrets to store MongoDB root credentials and the application connection URI. Replace placeholders with your values and adjust the DB Service name (`todo-app-db-green`) if your environment differs.

```bash
# MongoDB root user (used by the DB on first start)
kubectl -n todo create secret generic mongo-root \
  --from-literal=MONGO_INITDB_ROOT_USERNAME='<mongo_root_username>' \
  --from-literal=MONGO_INITDB_ROOT_PASSWORD='<mongo_root_password>'

# Application connection URI for the server
kubectl -n todo create secret generic mongo-app \
  --from-literal=MONGODB_URI='mongodb://<app_user>:<app_password>@todo-app-db-green:27017/todoapp?authSource=admin'
```


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

### Jenkins RBAC for kubectl (required)
To run `kubectl` from Jenkins Pods using ServiceAccount `jenkins` in namespace `jenkins`, bind cluster-admin:

```bash
kubectl create clusterrolebinding jenkins-admin \
  --clusterrole=cluster-admin \
  --serviceaccount=jenkins:jenkins
```

Adjust namespace/name if your Jenkins ServiceAccount differs.

### Manual steps required
- Image tags for deployment are set manually in the corresponding app values files (`todo-app/client-values.yaml`, `todo-app/server-values.yaml`, `todo-app/mongodb-values.yaml`).
- After deploying the server, copy the Service IP and paste it into the client values as the API URL so the client points to the server.
  - (A better approach is to use a DNS name for the server to keep a stable endpoint for the client, but to avoid costs this setup uses the raw IP.)

### MongoDB StatefulSet with Persistent Storage
The Helm chart automatically creates a StatefulSet for MongoDB when `statefulset.enabled: true` is set in `todo-app/mongodb-values.yaml`. This provides:

- **Persistent storage** using `do-block-storage-retain` (10Gi)
- **Stable network identity** with predictable DNS names
- **Data retention** - storage survives pod restarts and deletions
- **Ordered operations** for deployment and scaling

**Configuration in `todo-app/mongodb-values.yaml`:**
```yaml
statefulset:
  enabled: true

persistence:
  enabled: true
  storageClass: do-block-storage-retain
  size: 10Gi
  mountPath: /data/db
```

The chart automatically:
- Creates a StatefulSet instead of Deployment for MongoDB
- Sets up persistent volume claims with the specified storage class
- Mounts the persistent volume to `/data/db`
- Maintains the same service endpoints for client/server connectivity


## Future Considerations

- **Helm Chart Values / Loops**  
  Currently, environment variables, volumes, and other pod settings are defined explicitly. In a larger chart, it’s recommended to:
  - Iterate (`range`) over `.Values.envs` for environment variables.  
  - Iterate (`range`) over `.Values.volumes` and `.Values.volumeMounts`.  
  - This ensures new items can be added without modifying templates, making the chart more robust and maintainable.

- **DNS & Service Discovery**  
  For now, the client requires manual updates of the server’s Service IP. Future-proofing:
  - Can use Route53 or any other dns provider.
  - deploy LB.

