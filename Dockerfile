FROM node:20 AS builder


WORKDIR /surmai
RUN mkdir node_modules
ADD src src
ADD public public
COPY .eslintrc.cjs .
COPY index.html .
COPY package.json .
COPY postcss.config.js .
COPY tsconfig.app.json .
COPY tsconfig.json .
COPY tsconfig.node.json .
COPY vite.config.ts .

RUN npm install --no-audit
RUN npm run build

FROM alpine:latest

ARG PB_VERSION=0.22.22

RUN apk add --no-cache \
    unzip \
    ca-certificates

# download and unzip PocketBase
ADD https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip /tmp/pb.zip
RUN unzip /tmp/pb.zip -d /pb/
COPY pocketbase/init.sh /pb/init.sh
COPY pocketbase/pb_migrations /pb_migrations
COPY pocketbase/pb_hooks /pb_hooks

COPY --from=builder /surmai/dist /pb_public


EXPOSE 8080

# start PocketBase
CMD ["/pb/init.sh"]
