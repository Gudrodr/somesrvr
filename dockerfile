FROM node

WORKDIR /project

COPY ./src /project/src/
COPY package.json package-lock.json tsconfig.json /project/

RUN ls -l
RUN npm install
RUN npm run build

WORKDIR /project/build

EXPOSE 3001
CMD sleep 10 && node app.js