docker compose is inside docker, to run mysql, you need to start MySQL from the repo root. run: 
//
docker compose -f docker/docker-compose.yml up -d
//
to shut it down, run: 
docker compose -f docker/docker-compose.yml down
//
To check the DB is up:
Test-NetConnection -ComputerName 127.0.0.1 -Port 3307(IF RUNNING IN POWERSHELL)
nc -zv 127.0.0.1 3307(IF RUNNING IN UBUNTU)
if you see: TcpTestSucceeded : True(WINDOWS) or Connection to 127.0.0.1 3307 port [tcp/*] succeeded!(UBUNTU), then it means database is correctly started.
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
Windows Powershell:
Invoke-RestMethod http://localhost:8080/health
Invoke-RestMethod http://localhost:8080/api/content/themes

Admin login:
$body = '{"username":"admin","password":"change_me_now"}'
Invoke-RestMethod -Method Post http://localhost:8080/api/admin/login -ContentType 'application/json' -Body $body -SessionVariable s
Invoke-RestMethod http://localhost:8080/api/admin/me -WebSession $s

Ubuntu Bash:
Health:
curl http://localhost:8080/health

Public themes:
curl http://localhost:8080/api/content/themes

Survey definition:
curl http://localhost:8080/api/surveys/wellbeing-check

Admin login and save cookie:

rm -f cookies.txt(do it if any error occurs)

curl -i -c cookies.txt \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"change_me_now"}' \
    http://localhost:8080/api/admin/login

Themes:
curl -b cookies.txt \
    -H "Content-Type: application/json" \
    -d '{
        "title":"External Media Theme",
        "description":"Testing external media URLs",
        "sortOrder":0,
        "published":true
    }' \
    http://localhost:8080/api/admin/themes

Check that the cookie file has bvom.sid:
cat cookies.txt

Check admin session:
curl -b cookies.txt http://localhost:8080/api/admin/me

Get admin themes:
curl -b cookies.txt http://localhost:8080/api/admin/themes

Get admin modules:
curl -b cookies.txt http://localhost:8080/api/admin/modules

Survey report summary:
curl -b cookies.txt http://localhost:8080/api/admin/reports/surveys/1/summary

Anonymous survey submission:
curl -H "Content-Type: application/json" \
    -d '{"cohortCode":"ICT1","answers":[{"questionId":1,"answer":4},{"questionId":3,"answer":"Feeling positive."}]}' \
    http://localhost:8080/api/surveys/1/submissions

Image upload:
curl -b cookies.txt 
    -F "image=@/full/path/to/file.png" \
    http://localhost:8080/api/admin/uploads/image

curl -b cookies.txt \
    -F "image=@/mnt/c/Users/georg/Documents/ICT1/testimgs/Dogtest01.jpg" \
    http://localhost:8080/api/admin/uploads/image

Video upload:
curl -b cookies.txt 
    -F "video=@/full/path/to/file.mp4;type=video/mp4" \
    http://localhost:8080/api/admin/uploads/video

curl -b cookies.txt \
    -F "video=@/mnt/c/Users/georg/Documents/ICT1/testvideos/Testvideo01.mp4;type=video/mp4" \
    http://localhost:8080/api/admin/uploads/video

External imgs and videos:
curl -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "themeId":1,
    "title":"External Media Module",
    "summary":"Testing external URLs",
    "body":"This module uses external media.",
    "imageUrl":"https://http.cat/images/100.jpg",
    "imageAltText":"Cat photo",
    "videoUrl":"https://www.w3schools.com/html/mov_bbb.mp4",
    "challengeText":"Test challenge",
    "sortOrder":0,
    "published":true
  }' \
  http://localhost:8080/api/admin/modules

//

for more info about backend, please check the readme inside the backend folder.

for backend, scripts avaliable are inside package.json

