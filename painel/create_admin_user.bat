@echo off
SETLOCAL

REM garante que estamos no diretório do script
cd /d "%~dp0"

REM verifica se node está no PATH
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
  echo Node.js nao encontrado. Instale Node.js (https://nodejs.org/) e tente novamente.
  pause
  exit /b 1
)

REM executa o script Node
echo Executando create_admin_user.js...
node "%~dp0create_admin_user.js"
set RC=%ERRORLEVEL%

if %RC% neq 0 (
  echo Erro: o script retornou codigo %RC%.
  pause
  exit /b %RC%
)

echo Operacao concluida com sucesso.
pause