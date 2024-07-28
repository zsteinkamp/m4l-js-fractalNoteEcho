FROM node:20

WORKDIR /app
RUN yarn install
CMD ["npm", "run", "dev"]
