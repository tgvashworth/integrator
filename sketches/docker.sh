docker run -d -P --name selenium-hub selenium/hub
docker run --name selenium-hub-nginx -v `pwd`:/usr/share/nginx/html:ro -d nginx
docker run -d --name selenium-node-chrome --link selenium-hub:hub --link selenium-hub-nginx:hub-nginx selenium/node-chrome
docker run -d --name selenium-node-firefox --link selenium-hub:hub --link selenium-hub-nginx:hub-nginx selenium/node-firefox
