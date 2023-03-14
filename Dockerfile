FROM node:19.7.0-alpine

WORKDIR /server

COPY ./package.json .
RUN npm install

COPY . .

EXPOSE 3000

CMD [ "node", "server.js" ]