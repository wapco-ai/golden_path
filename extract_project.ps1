# فایل خروجی  
$outputFile = "project_files_power.txt"  

# حذف فایل خروجی قبلی اگر وجود داشته باشد  
if (Test-Path $outputFile) {  
    Remove-Item $outputFile  
}  

# شروع خروجی  
"# استخراج ساختار و محتوای فایل‌های پروژه" | Out-File -FilePath $outputFile -Encoding utf8  
"# تاریخ: $(Get-Date)" | Out-File -FilePath $outputFile -Append -Encoding utf8  
"" | Out-File -FilePath $outputFile -Append -Encoding utf8  

"# ساختار پروژه:" | Out-File -FilePath $outputFile -Append -Encoding utf8  
"" | Out-File -FilePath $outputFile -Append -Encoding utf8  

# ایجاد درخت ساختاری پروژه  
Get-ChildItem -Path "./src" -Recurse -File |   
    Where-Object { $_.FullName -notmatch "node_modules" -and $_.FullName -notmatch "\.git" -and $_.FullName -notmatch "\.dist" -and $_.FullName -notmatch "\.github" } |   
    Select-Object -ExpandProperty FullName |   
    ForEach-Object { $_ -replace [regex]::Escape((Get-Location)), "" } |   
    Sort-Object |   
    Out-File -FilePath $outputFile -Append -Encoding utf8  

"" | Out-File -FilePath $outputFile -Append -Encoding utf8  
"# محتوای فایل‌های اصلی:" | Out-File -FilePath $outputFile -Append -Encoding utf8  
"" | Out-File -FilePath $outputFile -Append -Encoding utf8  

# پیدا کردن و استخراج محتوای فایل‌های جاوا اسکریپت و ری‌اکت  
Get-ChildItem -Path "./src" -Recurse -File -Include "*.js","*.jsx","*.ts","*.tsx","*.css" |   
    Where-Object { $_.FullName -notmatch "node_modules" -and $_.FullName -notmatch "\.git" } |   
    ForEach-Object {  
        $relativePath = $_.FullName -replace [regex]::Escape((Get-Location)), ""  
        
        "## $relativePath" | Out-File -FilePath $outputFile -Append -Encoding utf8  
        "```javascript" | Out-File -FilePath $outputFile -Append -Encoding utf8  
        Get-Content $_.FullName | Out-File -FilePath $outputFile -Append -Encoding utf8  
        "```" | Out-File -FilePath $outputFile -Append -Encoding utf8  
        "" | Out-File -FilePath $outputFile -Append -Encoding utf8  
    }  

Write-Host "# استخراج فایل‌ها با موفقیت انجام شد."  
Write-Host "# خروجی در فایل $outputFile ذخیره شد."  