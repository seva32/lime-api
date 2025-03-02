FROM my-base-image:nx-base AS builder

ARG NODE_ENV
ARG PORT
ARG BUILD_FLAG
ARG IS_DOCKER
ARG DOCKER_DEV
WORKDIR /app/builder
COPY . .
RUN npx nx build api --skip-nx-cache ${BUILD_FLAG}

FROM my-base-image:nx-base

WORKDIR /app
COPY --from=builder /app/builder ./
ENV NODE_ENV=$NODE_ENV
ENV PORT=$PORT
ENV IS_DOCKER=$IS_DOCKER
ENV DOCKER_DEV=$DOCKER_DEV

CMD ["node", "./dist/apps/api/main.js"]