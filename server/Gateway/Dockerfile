# Node service only for Identity, using Prisma 
FROM node:24-alpine

WORKDIR /usr/src/app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

EXPOSE 4001

CMD ["npm", "run", "dev"]