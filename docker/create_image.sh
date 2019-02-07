#!/usr/bin/env bash

set -e

usage () {
  echo "Usage:"
  echo " sh create_image.sh [IMAGE_VERSION]"
  echo "Example:"
  echo " './create_image.sh 3.14.0"
  exit 1
}

if [ -z "$1" ]; then
    usage
fi

# move to current directory
cd "${BASH_SOURCE%/*}/"
VERSION=$1

echo "Changing the version in docker file"
sed -i s/VERSION/$VERSION/ Dockerfile.node

# prepare files to be added to the image
rm -rf add
mkdir add
mkdir add/netimpair_with_node
cp -r ../api add/netimpair_with_node/api
cp -r ../public add/netimpair_with_node/public
cp  ../LICENSE add/netimpair_with_node/
cp  ../package.json add/netimpair_with_node/
cp  ../readme.md add/netimpair_with_node/
cp  ../server.js add/netimpair_with_node/
cp  ../localhost.crt add/netimpair_with_node/
cp  ../localhost.key add/netimpair_with_node/

# build node image
docker build -f Dockerfile.node -t netimpair-with-node:${VERSION} .

# remove prepared files
rm -rf add

# remove dangling images
yes | docker image prune
