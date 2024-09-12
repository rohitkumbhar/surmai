FROM alpine:latest

ARG PB_VERSION=0.22.20

RUN apk add --no-cache \
    unzip \
    ca-certificates

# download and unzip PocketBase
ADD https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip /tmp/pb.zip
RUN unzip /tmp/pb.zip -d /pb/
COPY pocketbase/init.sh /pb/init.sh
COPY pocketbase/pb_migrations /pb_migrations
COPY pocketbase/pb_hooks /pb_hooks
COPY dist/assets /pb_public/assets/
COPY dist/index.html /pb_public

EXPOSE 8080

# start PocketBase
CMD ["/pb/init.sh"]