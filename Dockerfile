# Usa Node.js 20
FROM node:20-alpine

# Establece el directorio de trabajo
WORKDIR /app

# Copia package.json y package-lock.json
COPY package*.json ./

# Instala dependencias
RUN npm ci

# Copia el resto del código
COPY . .

# Define la URL del API como argumento de build
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Compila el frontend
RUN npm run build

# Expone el puerto
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["npx", "tsx", "api/server.ts"]
