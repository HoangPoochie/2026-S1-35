docker compose is inside docker, to run mysql, you need to start MySQL from the repo root. run: 
//
docker compose -f docker/docker-compose.yml up -d
//
to shut it down, run: 
docker compose -f docker/docker-compose.yml down
//
To check the DB is up:
Test-NetConnection -ComputerName 127.0.0.1 -Port 3307
if you see: TcpTestSucceeded : True, then it means database is correctly started.
//
For migrations, run: 
cd backend
npm run migrate
//
To run the backend, you need to go to the backend, not staying in the root. run: 
cd backend 
Then,
For development:
npm run dev
For a normal run:
npm start
//

//
How To Test
Automated test:
cd backend
npm test

That test boots the app against a temporary MySQL test database and verifies the APIs above.

Quick manual checks after the backend is running on port 8080:
Invoke-RestMethod http://localhost:8080/health
Invoke-RestMethod http://localhost:8080/api/content/themes

Admin login:
$body = '{"username":"admin","password":"change_me_now"}'
Invoke-RestMethod -Method Post http://localhost:8080/api/admin/login -ContentType 'application/json' -Body $body -SessionVariable s
Invoke-RestMethod http://localhost:8080/api/admin/me -WebSession $s

//

for more info about backend, please check the readme inside the backend folder.

for backend, scripts avaliable are inside package.json

