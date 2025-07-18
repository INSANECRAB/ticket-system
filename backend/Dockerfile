FROM node:20-bullseye
WORKDIR /app
RUN apt-get update && apt-get install -y openssl
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 4000
CMD ["npm", "run", "start"] 