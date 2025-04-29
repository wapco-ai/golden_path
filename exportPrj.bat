@echo off  
setlocal enabledelayedexpansion  

echo # استخراج ساختار و محتوای فایل‌های پروژه > project_files.txt  
echo # تاریخ: %date% %time% >> project_files.txt  
echo. >> project_files.txt  

echo # ساختار پروژه: >> project_files.txt  
echo. >> project_files.txt  

:: ایجاد درخت ساختاری پروژه  
dir /s /b /a:-D src 2>nul | findstr /V "node_modules dist .github .git" | sort >> project_files.txt  

echo. >> project_files.txt  
echo # محتوای فایل‌های اصلی: >> project_files.txt  
echo. >> project_files.txt  

:: پیدا کردن و استخراج محتوای فایل‌های جاوا اسکریپت و ری‌اکت  
for /r %%F in (*.js *.jsx *.ts *.tsx *.css) do (  
    set "filepath=%%F"  
    set "filepath=!filepath:%CD%=!"  
    
    :: نادیده گرفتن node_modules  
    echo !filepath! | findstr /C:"node_modules" > nul  
    if errorlevel 1 (  
        echo ## !filepath! >> project_files.txt  
        echo ```javascript >> project_files.txt  
        type "%%F" >> project_files.txt  
        echo ``` >> project_files.txt  
        echo. >> project_files.txt  
    )  
)  

echo # استخراج فایل‌ها با موفقیت انجام شد.  
echo # خروجی در فایل project_files.txt ذخیره شد.  

endlocal  