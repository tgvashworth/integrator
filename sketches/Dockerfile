FROM node:0.11-onbuild
ADD . /tests
WORKDIR /tests
ENV test "list-app"
ENV hub_hostport "hub:4444"
ENV target_hostport "target"
RUN make docker-install
CMD ./run-example ${test} http://${hub_hostport}/wd/hub https://${target_hostport}
