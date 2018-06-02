#!/usr/bin/env bash
mkdir add
mkdir add/netimpair_with_node
cp -r ../api add/netimpair_with_node/api
cp -r ../public add/netimpair_with_node/public
cp  ../LICENSE add/netimpair_with_node/
cp  ../package.json add/netimpair_with_node/
cp  ../readme.md add/netimpair_with_node/
cp  ../server.js add/netimpair_with_node/
docker build -f Dockerfile -t netimpair-with-node:3.7.1 .
rm -rf add