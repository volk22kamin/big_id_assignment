## to run this app in local:
#### docker network create mongodb
#### docker run -d --network mongodb --name mongo -p 27017:27017 mongo

#### docker run -d --name server --network mongodb -e MONGO_HOST=mongo -p 3000:3000 volk22kaimn/basic-to-do-server:1.0.0
#### docker run -d --name client --network mongodb -p 80:80 volk22kaimn/basic-to-do-client

### if you want to run with docker compose, run this:
#### docker compose up -d
### to remove: 
#### docker compose down -v