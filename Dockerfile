FROM --platform=$BUILDPLATFORM node:24 AS frontend
ARG TARGETOS
ARG TARGETARCH

WORKDIR /surmai
RUN corepack enable

COPY package.json .
COPY pnpm-lock.yaml .
RUN pnpm install --frozen-lockfile

ADD src src
ADD public public
COPY eslint.config.js .
COPY index.html .
COPY postcss.config.js .
COPY tsconfig.app.json .
COPY tsconfig.json .
COPY tsconfig.node.json .
COPY vite.config.ts .
RUN pnpm run build

FROM --platform=$BUILDPLATFORM golang:1.24.1-alpine3.21 AS backend
ARG TARGETOS
ARG TARGETARCH

WORKDIR /build

# Copy the go.mod and go.sum files to the /build directory
COPY backend/go.mod .
COPY backend/go.sum .
RUN go mod download

COPY backend .
RUN GOOS=${TARGETOS} GOARCH=${TARGETARCH} go build -o surmai-backend

FROM --platform=$BUILDPLATFORM golang:1.24.1-alpine3.21 AS litestream
ADD https://github.com/benbjohnson/litestream/releases/download/v0.3.13/litestream-v0.3.13-linux-amd64.tar.gz /tmp/litestream.tar.gz
RUN tar -C /usr/local/bin -xzf /tmp/litestream.tar.gz

FROM alpine:3.21

RUN apk add --no-cache tzdata

COPY backend/init.sh /pb/init.sh
COPY backend/litestream-init.sh /pb/litestream-init.sh
COPY backend/datasets /datasets
COPY --from=frontend /surmai/dist /pb_public
COPY --from=backend /build/surmai-backend /pb/surmai-backend
COPY --from=litestream /usr/local/bin/litestream /usr/local/bin/litestream
COPY litestream.yaml /etc/litestream.yml

EXPOSE 8080

# start PocketBase
CMD ["/pb/litestream-init.sh"]
