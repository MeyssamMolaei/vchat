@echo off
echo Copying vChat to 192.168.1.179...

scp -r . meyssam@192.168.1.179:/home/meyssam/vchat/

echo Deploying vChat...
@REM ssh meyssam@192.168.1.179 "cd /home/meyssam/vchat/ && docker compose down && docker compose up --build -d"

echo vChat deployed at https://192.168.1.179:3000
pause