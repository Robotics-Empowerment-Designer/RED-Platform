#!/bin/sh

# build Node-RED container
sudo docker build -t node-red node-red/

# create data folder for Node-RED
mkdir -p node-red/data
#mkdir -p node-red/data-salt
#mkdir -p node-red/data-pepper

# give container write permissions
chmod 777 node-red/data
#chmod 777 node-red/data-salt
#chmod 777 node-red/data-pepper
chown 1000 node-red/data
#chown 1000 node-red/data-salt
#chown 1000 node-red/data-pepper

