# production images
FROM node:14-alpine
ENV TZ utc

ARG RELEASE_VERSION
RUN apk add --no-cache tini
ENTRYPOINT ["/sbin/tini", "--", "subquery-query"]

RUN npm i -g @subquery/query@${RELEASE_VERSION}
WORKDIR /workdir

CMD ["-f","/app"]
