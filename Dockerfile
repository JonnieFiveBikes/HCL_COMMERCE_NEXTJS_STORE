# syntax=docker/dockerfile:1

FROM node:18.19.1
ENV NODE_ENV=production

WORKDIR /app

#RUN echo fs.inotify.max_user_watches=524288 > /etc/sysctl.conf 
#RUN echo sysctl -p

#COPY ["package.json", "package-lock.json*", "./"]

COPY . .
COPY .env.local.example .env.local 
COPY certs/cert.pem.sample certs/cert.pem
COPY certs/key.pem.sample certs/key.pem

RUN yarn install

#CMD [ "npm", "run mock" ]
EXPOSE 3343
CMD /app/start.sh -D FOREGROUND
