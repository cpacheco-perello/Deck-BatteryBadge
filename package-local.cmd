@echo off
setlocal
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -Command "pnpm run build; if (Test-Path out) { Remove-Item out -Recurse -Force }; New-Item -ItemType Directory -Path out/dgs-battery -Force | Out-Null; Copy-Item plugin.json,package.json,LICENSE,README.md,main.py,decky.pyi out/dgs-battery; Copy-Item -Recurse dist out/dgs-battery/dist; tar -a -c -f out/dgs-battery-local.zip -C out dgs-battery; tar -czf out/dgs-battery-local.tar.gz -C out dgs-battery"
endlocal
