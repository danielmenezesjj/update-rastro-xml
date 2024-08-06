# Usar uma imagem base do Node.js
FROM node:18

# Definir o diretório de trabalho no container
WORKDIR /usr/src/app

# Copiar o package.json e package-lock.json para o diretório de trabalho
COPY package*.json ./

# Instalar as dependências do Node.js
RUN npm install

# Copiar o restante dos arquivos da aplicação para o diretório de trabalho
COPY . .

# Expor a porta que a aplicação vai rodar
EXPOSE 1290

# Comando para iniciar a aplicação
CMD ["node", "server.js"]
