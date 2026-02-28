# Node service only for Authentication, using Prisma 
FROM node:24-alpine

WORKDIR /usr/src/app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

RUN npx prisma generate

EXPOSE 4004


CMD ["sh", "-c", "npx prisma migrate dev --name init  && npm run dev"]