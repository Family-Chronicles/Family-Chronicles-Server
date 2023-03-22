FROM node:latest

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm config set registry "https://registry.npmjs.org/"

RUN npm install -g npm@latest

RUN npm ci

# Bundle app source
COPY . .

RUN npm run build
# If you are building your code for production
# RUN npm ci --only=production

EXPOSE 8080

CMD [ "node", "dist/server.js" ]

# docker build . -t family-chronicles/family-chronicles-server
# docker run -p 49160:8080 -d family-chronicles/family-chronicles-server
