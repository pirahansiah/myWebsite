# https://scriptable.com/cloud/how-to-run-kubernetes-on-localhost-terraform-mac/


"""
This script outlines the setup and use of Kubernetes on a local machine using Terraform, along with tools like Docker and Kubernetes command-line interface (CLI) utilities, all managed through Homebrew on macOS. It demonstrates the installation of required software, setting up Kubernetes with Terraform, querying the Kubernetes cluster, and visualizing Terraform plans. Finally, it guides through cleaning up resources with Terraform. This sequence ensures a practical approach to infrastructure as code (IaC) development and testing in a controlled, local environment.
"""

"""
Kubernetes on Localhost (Terraform, Mac)
brew tap hashicorp/tap
brew install hashicorp/tap/terraform
terraform version 
I am using 1.8.2
brew upgrade terraform
open -a Docker
brew install kubectl
brew install kubernetes-cli
kubectl cluster-info
kubectl config current-context
kubectl config view
terraform init
terraform fmt
terraform plan
terraform apply
"""


"""
kubectl get pods
kubectl get svc random-example -o jsonpath='{.spec.ports[0].nodePort}'
curl localhost:30427
kubectl get services
terraform graph -type=plan


brew install graphviz
terraform graph -type=plan | dot -Tpng > plan.png



# clean up
terraform destroy
kubectl get pods

"""