FROM node:18-alpine

WORKDIR /app

# Install OpenSSL for certificate generation
RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm install --production

COPY . .

# Generate self-signed certificate with server IP
RUN openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=192.168.1.179"

EXPOSE 3000

CMD ["npm", "start"]