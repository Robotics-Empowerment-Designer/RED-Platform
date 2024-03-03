#!/bin/bash

# add new robot modules here
packages=(./nodes/base/ ./nodes/pepper/)

for i in "${packages[@]}"
do
   : 
   npm install $i --no-audit --progress=false
done

node-red start -v --userDir /data $FLOWS