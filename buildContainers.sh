#!/bin/sh

# build Node-RED container
sudo docker build -t node-red node-red/

# create data folder for Node-RED
mkdir -p node-red/data

