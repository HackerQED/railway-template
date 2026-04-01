# syntax=docker/dockerfile:1
FROM node:20-alpine
RUN apk add --no-cache libc6-compat ffmpeg font-noto-cjk font-noto-emoji
WORKDIR /app

# Install dependencies
COPY package.json pnpm-lock.yaml* ./
COPY source.config.ts ./
COPY content ./content
RUN npm install -g pnpm && pnpm i --frozen-lockfile

# Build
COPY . .
RUN cp env.example .env
RUN pnpm build
RUN rm .env

# Runtime setup
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs \
  && chown -R nextjs:nodejs .next
COPY --chown=nextjs:nodejs entrypoint.sh ./
RUN chmod +x entrypoint.sh

ENV NODE_ENV=production
USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["./entrypoint.sh"]
