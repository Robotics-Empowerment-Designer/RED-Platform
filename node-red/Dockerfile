FROM nodered/node-red:3.0.2-16-minimal

COPY run.sh entrypoint.sh
COPY npmInstall.sh npmInstall.sh

RUN npm install ws nodemon

USER root
RUN apk add avahi-tools


ENTRYPOINT ["./entrypoint.sh"]
