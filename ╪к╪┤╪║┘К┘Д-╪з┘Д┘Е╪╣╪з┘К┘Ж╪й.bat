@echo off
chcp 65001 >nul
cd /d "%~dp0"
if not exist node_modules (
  echo تثبيت المكتبات لأول مرة...
  call npm install --no-audit --no-fund
)
echo.
echo المعاينة تعمل على: http://localhost:5173
echo للتجربة على iPhone: افتح عنوان Network الظاهر بالأسفل من جوال على نفس شبكة الواي فاي
echo لإيقاف المعاينة: أغلق هذه النافذة
echo.
call npm run dev -- --open
