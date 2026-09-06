FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npx prisma generate

RUN npm run build

RUN cp -r src/generated dist/generated

EXPOSE 5000

CMD ["npm", "start"]