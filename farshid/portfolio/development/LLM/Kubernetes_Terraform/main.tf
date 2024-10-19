# Configure Kubernetes provider and connect to the Kubernetes API server
provider "kubernetes" {
  host                   = "https://localhost:6443"
  config_context_cluster = "docker-desktop"
  config_path            = "~/.kube/config"
}

# Create a pod
resource "kubernetes_pod" "random_server" {
  metadata {
    name = "random-example"
    labels = {
      App = "random_server"
    }
  }

  spec {
    container {
      image = "mitchallen/random-server:latest"
      name  = "random"
      port {
        container_port = 3100
      }
    }
  }
}
# Create a service
resource "kubernetes_service" "random" {
  metadata {
    name = "random-example"
  }
  spec {
    selector = {
      App = "${kubernetes_pod.random_server.metadata.0.labels.App}"
    }
    port {
      port        = 80
      target_port = 3100
    }

    type = "NodePort"
  }
}
