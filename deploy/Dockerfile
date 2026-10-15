# Static output is generated and tested on the host; no package download here.
# Initial local base; pin a maintained multi-architecture digest before release.
ARG NGINX_IMAGE=nginx:1.27-alpine
FROM ${NGINX_IMAGE}
ARG VERSION=0.2.0-snapshot
ARG REVISION=workspace-snapshot
LABEL org.opencontainers.image.title="ProudAuth website" \
      org.opencontainers.image.source="https://github.com/proudauth/proudauth-website" \
      org.opencontainers.image.licenses="Apache-2.0" \
      org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.revision="${REVISION}"
COPY deploy/nginx.conf /etc/nginx/nginx.conf
COPY dist/ /site/
USER nginx
EXPOSE 8080
ENTRYPOINT ["nginx", "-g", "daemon off;"]
