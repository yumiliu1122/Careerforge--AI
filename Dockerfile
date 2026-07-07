FROM node:22-alpine

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src ./src
COPY public ./public
RUN mkdir -p /app/data

ENV NODE_ENV=production
ENV PORT=4173
ENV DATA_FILE=/app/data/store.json
EXPOSE 4173

VOLUME ["/app/data"]
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||4173)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "src/main.js"]
