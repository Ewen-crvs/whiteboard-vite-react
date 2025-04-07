FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
COPY server/package*.json ./server/

RUN npm install && \
    cd server && npm install

COPY . .

EXPOSE 3000 6000

CMD ["npm", "run", "dev"]
