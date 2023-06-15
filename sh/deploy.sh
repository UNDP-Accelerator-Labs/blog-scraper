#!/usr/bin/env bash

cd -- "$( dirname -- "${BASH_SOURCE[0]}" )/../" &> /dev/null

if ! make -s git-check ; then
    echo "working directory needs to be clean to deploy"
    exit 1
fi

BRANCH_MAIN=main

if [ $(make -s branch) != "${BRANCH_MAIN}" ]; then
    echo "must be on ${BRANCH_MAIN} to deploy"
    exit 2
fi

TAG=$(make -s next-version)

echo "deploying version: ${TAG}"
git tag "${TAG}"
git push --tags
