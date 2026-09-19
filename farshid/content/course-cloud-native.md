Docker and Kubernetes fundamentals for cloud-native infrastructure.

# Cloud-Native Infrastructure with Kubernetes

## Docker Basics

```bash
docker run -ti ubuntu:latest bash
docker ps -format $FORMAT
docker ps -l
docker commit ID
docker tag imageID my-image
docker run --rm -ti ubuntu sleep 5
docker run -d -ti ubuntu bash    # detached
docker attach name               # Ctrl+P /Q to detach
docker logs container_name -p
docker images
```

#Docker #Kubernetes #CloudNative