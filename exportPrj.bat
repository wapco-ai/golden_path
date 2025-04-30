@echo off  
setlocal enabledelayedexpansion  

echo # استخراج ساختار و محتوای فایل‌های پروژه > project_files.txt  
echo # تاریخ: %date% %time% >> project_files.txt  
echo. >> project_files.txt  

echo # ساختار پروژه: >> project_files.txt  
echo. >> project_files.txt  

:: ایجاد درخت ساختاری پروژه (حذف پوشه‌های نامطلوب با هر ترکیب حروف)  
dir /s /b /a:-D src 2>nul | findstr /V /I "\\node_modules\\ \\dist\\ \\.github\\ \\.git\\" | sort >> project_files.txt  

echo. >> project_files.txt  
echo # محتوای فایل‌های اصلی: >> project_files.txt  
echo. >> project_files.txt  

:: استخراج محتوای فایل‌های غیرخالی (با فیلتر دقیق‌تر پوشه‌ها)  
for /r %%F in (*.js *.jsx *.ts *.tsx *.css) do (  
set "filepath=%%F"  
set "filepath=!filepath:%CD%=!"  

:: حذف فایل‌های داخل پوشه‌های نامطلوب (با هر ترکیب حروف)  
echo !filepath! | findstr /I /C:"node_modules" /C:"dist" /C:".github" /C:".git" > nul  
if errorlevel 1 (  
    :: بررسی عدم خالی بودن فایل  
    for %%A in ("%%F") do if %%~zA gtr 0 (  
        echo ## !filepath! >> project_files.txt  
        echo ```javascript >> project_files.txt  
        type "%%F" >> project_files.txt  
        echo ``` >> project_files.txt  
        echo. >> project_files.txt  
    )  
)  
)  

echo # استخراج فایل‌ها با موفقیت انجام شد.  
echo # خروجی در فایل project_files.txt ذخیره شد.  

endlocal  