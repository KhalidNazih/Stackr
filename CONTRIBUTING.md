# Contributing to Stackr

Thank you for your interest in contributing to **Stackr**! As an open-source Internal Developer Platform (IDP) and GitOps automation engine, we welcome contributions from platform engineers, SREs, frontend developers, and security practitioners.

---

## 🧭 Code of Conduct

All contributors and participants are expected to adhere to our [Code of Conduct](./CODE_OF_CONDUCT.md). Please report unacceptable behavior to the maintainers.

---

## 🛠️ Local Development Setup

The Stackr monorepo contains both Kubernetes GitOps manifests and application code:

```
Stackr/
├── apps/
│   ├── webui/        # Next.js 14 Developer Portal
│   └── backend/      # FastAPI Python Platform Service
├── BaseServices/     # Kustomize manifests for core platform
├── templates/        # Helm blueprint for tenant toolchains
└── registry/         # Declarative tenant manifests
```

### Prerequisites
- **Git**
- **kubectl** (v1.28+)
- **Helm** (v3.12+)
- **Node.js** (v20+) & **npm**
- **Python** (v3.12+) & **pip**
- **Docker** or container runtime

---

### Running the Backend (`apps/backend`)
```bash
cd apps/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Run the API locally
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
API documentation is available at `http://localhost:8000/docs`.

### Running the Web UI (`apps/webui`)
```bash
cd apps/webui
cp .env.example .env.local
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 🧩 How to Add a New Toolchain to the Tenant Blueprint

Stackr is modular. Adding new developer tools (e.g., Grafana, Harbor, Vault, Kafka) is straightforward:

### 1. Add Kubernetes Manifests
Create a new directory in `templates/tenant-blueprint/templates/<tool-name>/`:
```yaml
# templates/tenant-blueprint/templates/<tool-name>/deployment.yaml
{{- if .Values.services.<tool_name>.enabled }}
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ .Values.tenant_id }}-<tool-name>
  labels:
    tenant-id: {{ .Values.tenant_id }}
    cost-center: {{ .Values.cost_center | default "default" }}
spec:
  replicas: {{ .Values.services.<tool_name>.replicas | default 1 }}
  ...
{{- end }}
```

### 2. Declare Defaults in `values.yaml`
Add service configuration, resource limits, and toggles in `templates/tenant-blueprint/values.yaml`:
```yaml
services:
  <tool_name>:
    enabled: false
    replicas: 1
    size: "medium"
```

### 3. Expose via Ingress (Optional)
If the tool has a web UI, add a routing rule to `templates/tenant-blueprint/templates/ingress.yaml`:
```yaml
    {{- if .Values.services.<tool_name>.enabled }}
    - host: <tool-name>-{{ .Values.tenant_id }}.{{ trimPrefix "http://" (trimPrefix "https://" .Values.platform.public_base_url) }}
      http:
        paths:
        - path: /
          pathType: Prefix
          backend:
            service:
              name: {{ .Values.tenant_id }}-<tool-name>
              port:
                number: 8080
    {{- end }}
```

### 4. Enable in Developer Portal (Optional)
Add an entry to `apps/webui/config/services-catalog.json`:
```json
{
  "id": "<tool_name>",
  "name": "My Tool",
  "category": "Observability",
  "desc": "Short description of what the tool does.",
  "securityRating": 5,
  "estimatedCost": "$15/mo",
  "defaultEnabled": false,
  "defaultReplicas": 1,
  "defaultSize": "small",
  "clientId": "<tool_name>",
  "resources": {
    "small": "1 CPU · 1 Gi",
    "medium": "2 CPU · 2 Gi",
    "heavy": "4 CPU · 4 Gi"
  }
}
```
The Developer Portal automatically renders the tool's card, sizing presets, replica controls, and catalog pricing! You can also optionally map an icon in `apps/webui/components/icons/ServiceIcon.tsx`.

---

## 🧪 Quality Assurance & Verification

Before submitting a Pull Request, verify your changes pass all local checks:

### 1. Validate Kustomize Overlays
```bash
kubectl kustomize BaseServices/overlays/admin > /dev/null
kubectl kustomize BaseServices/overlays/admin_with_ui > /dev/null
```

### 2. Validate Tenant Blueprint Helm Chart
```bash
helm lint templates/tenant-blueprint
helm template test-tenant templates/tenant-blueprint -f registry/customer-01.yaml > /dev/null
```

### 3. Lint Frontend
```bash
cd apps/webui
npm run lint
```

---

## 📦 Pull Request Guidelines

1. **Fork the repo** and create a feature branch (`git checkout -b feat/my-new-feature`).
2. **Follow Conventional Commits**:
   - `feat: add Grafana tenant service blueprint`
   - `fix: prevent login redirect loop on HTTP`
   - `docs: update tenant creation walkthrough`
3. **Keep PRs focused**: Address a single feature, bug fix, or improvement per PR.
4. **Update Documentation**: If your change modifies deployment steps or configuration variables, update `WRITEUP.md` or `README.md`.
5. Open a Pull Request against `main`. All CI checks must pass before merging.
