FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

ENV NEXT_PUBLIC_API_URL=http://localhost:5000/api

RUN npm install

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]