#!/usr/bin/env bash
rm -rf add
mkdir add
mkdir add/netimpair_with_node
cp  setTZ.sh add/netimpair_with_node/
cp -r ../api add/netimpair_with_node/api
cp -r ../public add/netimpair_with_node/public
cp  ../LICENSE add/netimpair_with_node/
cp  ../package.json add/netimpair_with_node/
cp  ../readme.md add/netimpair_with_node/
cp  ../server.js add/netimpair_with_node/
cp  ../localhost.crt add/netimpair_with_node/
cp  ../localhost.key add/netimpair_with_node/
docker build -f Dockerfile -t netimpair-with-node:3.12.0 .
rm -rf add