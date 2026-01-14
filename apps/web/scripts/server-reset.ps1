# server-reset.ps1
# 서버 문제 발생 시 빠른 리셋 스크립트
# 사용법: powershell -ExecutionPolicy Bypass -File scripts/server-reset.ps1

Write-Host "🔄 서버 리셋 시작..." -ForegroundColor Cyan

# 1. 포트 3000 사용 프로세스 종료
Write-Host "`n1️⃣ 포트 3000 프로세스 확인 및 종료..."
$connections = netstat -ano | Select-String ":3000.*LISTENING"
if ($connections) {
    foreach ($conn in $connections) {
        $pid = ($conn -split '\s+')[-1]
        if ($pid -and $pid -ne "0") {
            Write-Host "   종료: PID $pid" -ForegroundColor Yellow
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        }
    }
} else {
    Write-Host "   ✅ 포트 3000 사용 중인 프로세스 없음" -ForegroundColor Green
}

# 2. .next 폴더 삭제
Write-Host "`n2️⃣ .next 캐시 폴더 삭제..."
$nextPath = Join-Path $PSScriptRoot "..\.next"
if (Test-Path $nextPath) {
    Remove-Item -Recurse -Force $nextPath
    Write-Host "   ✅ .next 폴더 삭제 완료" -ForegroundColor Green
} else {
    Write-Host "   ✅ .next 폴더 없음" -ForegroundColor Green
}

# 3. 잠시 대기
Start-Sleep -Seconds 2

# 4. 서버 시작
Write-Host "`n3️⃣ 서버 시작 중..."
Write-Host "   http://localhost:3000 에서 접속 가능" -ForegroundColor Cyan
Write-Host ""

Set-Location (Join-Path $PSScriptRoot "..")
npm run dev
