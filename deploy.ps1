Write-Host "Copying vChat to 192.168.1.179..." -ForegroundColor Green
scp -r . meyssam@192.168.1.179:/home/meyssam/vchat/

Write-Host "Deploying vChat..." -ForegroundColor Green  
# ssh meyssam@192.168.1.179 "cd /home/meyssam/vchat/ && docker compose down && docker compose up --build -d"

Write-Host "vChat deployed at https://192.168.1.179:3000" -ForegroundColor Yellow
Read-Host "Press Enter to continue"