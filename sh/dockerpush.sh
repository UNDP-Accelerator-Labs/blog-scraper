#!/usr/bin/env bash

cd -- "$( dirname -- "${BASH_SOURCE[0]}" )/../" &> /dev/null

IMAGE_TAG="${IMAGE_TAG:-$(make -s name)}"
IMAGE_NAME="blogscraper:${IMAGE_TAG}"
DOCKER_LOGIN_SERVER="acclabdocker.azurecr.io"
DOCKER_IMAGE_URL="${DOCKER_LOGIN_SERVER}/${IMAGE_NAME}"

echo "pushing ${IMAGE_NAME} to ${DOCKER_IMAGE_URL}"

docker tag "${IMAGE_NAME}" "${DOCKER_IMAGE_URL}"
docker push "${DOCKER_IMAGE_URL}"
docker rmi "${DOCKER_IMAGE_URL}"
