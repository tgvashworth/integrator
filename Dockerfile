FROM node:0.11-onbuild
ADD . /tests
WORKDIR /tests
RUN make docker-install
