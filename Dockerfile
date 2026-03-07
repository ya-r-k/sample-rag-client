FROM node:20-alpine
ENV NODE_ENV=production
WORKDIR /usr/src/app
COPY ["./SampleRag.Client/package.json", "./SampleRag.Client/package-lock.json*", "./SampleRag.Client/npm-shrinkwrap.json*", "./SampleRag.Client/"]
RUN npm install --production
COPY . .
EXPOSE 5284
RUN chown -R node /usr/src/app
USER node
CMD ["npm", "start"]
