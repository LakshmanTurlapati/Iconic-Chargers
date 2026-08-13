FROM node:22-alpine@sha256:c610fcdfb1d5b4740dd70c284ed3cb16bb857e0f7166196e36a5501df7a3aa32 AS build

WORKDIR /build
COPY scripts/build_site.mjs scripts/seo-copy.mjs scripts/verify_site_output.mjs scripts/
COPY data/iconic-badges.json data/seo-slugs.json data/
COPY web/ web/
COPY CITATION.cff DATA-RIGHTS.md ./
COPY deploy/indexnow-key.txt deploy/

RUN node scripts/build_site.mjs \
    && node scripts/verify_site_output.mjs \
    && cp deploy/indexnow-key.txt .site/indexnow-key.txt

FROM nginx:1.30.4-alpine@sha256:97d490c12ba55b4946b01546d1c3ed324e8d41ab1c9fcb2a616aa470620e5b46 AS runtime

COPY deploy/nginx.conf /etc/nginx/nginx.conf
COPY --from=build /build/.site/ /usr/share/nginx/html/

RUN nginx -t && rm -f /tmp/nginx.pid

EXPOSE 8080
STOPSIGNAL SIGQUIT
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1

USER nginx
ENTRYPOINT ["/usr/sbin/nginx"]
CMD ["-g", "daemon off;"]
