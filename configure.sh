#!/usr/bin/env bash
# ==============================================================================
# Stackr IDP Blueprint — Environment Configuration Script
# ==============================================================================
# This script automates substituting environment-specific placeholders across:
#   - BaseServices/
#   - registry/
#   - system/
#   - templates/
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=========================================================="
echo "      🚀 Stackr Platform Environment Configuration        "
echo "=========================================================="
echo ""

# 1. Tailscale IP
read -r -p "1. Enter your Tailscale Ingress IP (e.g. 100.85.12.34): " TAILSCALE_IP
if [[ -z "$TAILSCALE_IP" ]]; then
    echo "❌ Error: Tailscale IP cannot be empty."
    exit 1
fi

# 2. Container Registry (e.g., myacr.azurecr.io)
read -r -p "2. Enter your Container Registry domain (e.g. myregistry.azurecr.io): " REGISTRY
if [[ -z "$REGISTRY" ]]; then
    echo "❌ Error: Registry domain cannot be empty."
    exit 1
fi
# Strip trailing slash if present
REGISTRY="${REGISTRY%/}"
# Extract ACR name prefix if using .azurecr.io, otherwise use full domain
ACR_NAME="${REGISTRY%%.azurecr.io}"

# 3. GitLab Group
read -r -p "3. Enter your GitLab Group / Username [default: root]: " GITLAB_GROUP
GITLAB_GROUP="${GITLAB_GROUP:-root}"

# 4. Keycloak Admin Password
read -r -s -p "4. Enter your Keycloak Admin Password [default: admin]: " KEYCLOAK_ADMIN_PASSWORD
echo ""
KEYCLOAK_ADMIN_PASSWORD="${KEYCLOAK_ADMIN_PASSWORD:-admin}"

# 5. Optional OpenBao Azure Key Vault Unseal configs
echo ""
echo "--- Optional: OpenBao Azure Key Vault Auto-Unseal (Press Enter to skip if not set yet) ---"
read -r -p "5. Azure Key Vault Name (optional): " KEY_VAULT_NAME
read -r -p "6. Kubelet Managed Identity Client ID (optional): " KUBELET_CLIENT_ID

echo ""
echo "Applying configurations..."

# Helper sed function compatible with Linux & macOS
replace_in_files() {
    local search="$1"
    local replace="$2"
    shift 2
    for file in "$@"; do
        if [[ -f "$file" ]]; then
            sed -i "s|${search}|${replace}|g" "$file"
        fi
    done
}

TARGET_FILES=(
    BaseServices/base/deployment/platform-api.yaml
    BaseServices/base/deployment/platform-shared-secrets.yaml
    BaseServices/base/deployment/openbao-config.hcl
    BaseServices/base/security/kyverno/restrict-image-registries.yaml
    BaseServices/overlays/admin/ingress.yaml
    BaseServices/overlays/admin_with_ui/webui.yaml
    BaseServices/overlays/admin_with_ui/webui-ingress.yaml
    system/ApplicationSet.yaml
    registry/customer-01.yaml
    templates/tenant-blueprint/templates/automation/job.yaml
    templates/tenant-blueprint/templates/gitlab/deployment.yaml
    templates/tenant-blueprint/templates/jenkins/deployment.yaml
    templates/tenant-blueprint/templates/nexus/deployment.yaml
    templates/tenant-blueprint/templates/sonarqube/deployment.yaml
    templates/tenant-blueprint/values.yaml
    apps/webui/.env.example
)

# Replace Tailscale IP
replace_in_files "<YOUR_TAILSCALE_IP>" "$TAILSCALE_IP" "${TARGET_FILES[@]}"

# Replace Registry
replace_in_files "<YOUR_PRIVATE_REGISTRY>" "$REGISTRY" "${TARGET_FILES[@]}"
replace_in_files "<YOUR_ACR_NAME>.azurecr.io" "$REGISTRY" "${TARGET_FILES[@]}"
replace_in_files "<YOUR_ACR_NAME>" "$ACR_NAME" "${TARGET_FILES[@]}"

# Replace GitLab Group
replace_in_files "<YOUR_GITLAB_GROUP>" "$GITLAB_GROUP" "${TARGET_FILES[@]}"

# Replace Keycloak Admin Password
replace_in_files "<YOUR_KEYCLOAK_ADMIN_PASSWORD>" "$KEYCLOAK_ADMIN_PASSWORD" "${TARGET_FILES[@]}"

# Replace Key Vault info if provided
if [[ -n "$KEY_VAULT_NAME" ]]; then
    replace_in_files "<YOUR_KEY_VAULT_NAME>" "$KEY_VAULT_NAME" "${TARGET_FILES[@]}"
fi

if [[ -n "$KUBELET_CLIENT_ID" ]]; then
    replace_in_files "<YOUR_KUBELET_CLIENT_ID>" "$KUBELET_CLIENT_ID" "${TARGET_FILES[@]}"
fi

echo "✅ All placeholders successfully updated!"
echo ""
echo "Summary of applied values:"
echo "  • Tailscale Ingress IP: $TAILSCALE_IP"
echo "  • Container Registry:   $REGISTRY"
echo "  • GitLab Group:         $GITLAB_GROUP"
if [[ -n "$KEY_VAULT_NAME" ]]; then
    echo "  • Key Vault Name:       $KEY_VAULT_NAME"
fi
if [[ -n "$KUBELET_CLIENT_ID" ]]; then
    echo "  • Kubelet Client ID:    $KUBELET_CLIENT_ID"
fi
echo ""
echo "You can now run:"
echo "  kubectl apply -k BaseServices/overlays/admin"
echo "  (or BaseServices/overlays/admin_with_ui if deploying the Developer Portal)"
echo "=========================================================="
