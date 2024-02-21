#!/bin/sh

cp settingsTemplate.js /data/settings.js

nodemon --watch /nodes/ \
-e js,html,py,json \
--exec "rm -rf nodes/* && cp -R /nodes . && ./npmInstall.sh"

