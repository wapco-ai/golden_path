@echo off  
echo Creating project structure...  

:: Create main directories  
mkdir public  
mkdir public\icons  
mkdir public\locales  
mkdir src  
mkdir src\assets  
mkdir src\components  
mkdir src\components\common  
mkdir src\components\layout  
mkdir src\components\map  
mkdir src\components\settings  
mkdir src\contexts  
mkdir src\hooks  
mkdir src\pages  
mkdir src\services  
mkdir src\store  
mkdir src\utils  

:: Create public files  
type nul > public\locales\fa.json  
type nul > public\robots.txt  

:: Create component files  
type nul > src\components\common\Button.jsx  
type nul > src\components\common\Input.jsx  
type nul > src\components\common\Loader.jsx  
type nul > src\components\layout\Header.jsx  
type nul > src\components\layout\Footer.jsx  
type nul > src\components\layout\Menu.jsx  
type nul > src\components\map\MapView.jsx  
type nul > src\components\map\QRScanner.jsx  
type nul > src\components\map\LocationTracker.jsx  
type nul > src\components\map\DirectionGuide.jsx  
type nul > src\components\settings\SettingsForm.jsx  

:: Create context files  
type nul > src\contexts\AuthContext.jsx  

:: Create hook files  
type nul > src\hooks\useGPS.js  
type nul > src\hooks\useIMU.js  
type nul > src\hooks\useOfflineStorage.js  
type nul > src\hooks\useQRCode.js  

:: Create page files  
type nul > src\pages\HomePage.jsx  
type nul > src\pages\LoginPage.jsx  
type nul > src\pages\MapPage.jsx  
type nul > src\pages\QRScanPage.jsx  
type nul > src\pages\SettingsPage.jsx  
type nul > src\pages\NotFoundPage.jsx  

:: Create service files  
type nul > src\services\api.js  
type nul > src\services\auth.js  
type nul > src\services\geolocation.js  
type nul > src\services\storage.js  
type nul > src\services\qrcode.js  

:: Create store files  
type nul > src\store\gpsStore.js  
type nul > src\store\userStore.js  
type nul > src\store\settingsStore.js  

:: Create utility files  
type nul > src\utils\constants.js  
type nul > src\utils\helpers.js  
type nul > src\utils\validation.js  

:: Create root files  
type nul > src\App.jsx  
type nul > src\main.jsx  
type nul > src\index.css  

echo Project structure created successfully!  
pause  