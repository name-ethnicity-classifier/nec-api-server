FROM node:17
WORKDIR "/app"

COPY package.json .
RUN npm install
COPY . .
EXPOSE 1337

RUN apt-get update
RUN apt-get install python3
RUN apt-get -y install python3-pip
RUN pip3 install torch==1.9.1+cpu -f https://download.pytorch.org/whl/torch_stable.html
RUN pip3 install python-dotenv
RUN pip3 install numpy

RUN npm run build
CMD ["npm", "start"]