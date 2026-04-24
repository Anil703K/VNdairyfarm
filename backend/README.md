Dairy-backend setup

This backend supports two ways to provide MongoDB credentials:

1) Provide a full MONGO_URI in `.env`:
   MONGO_URI=mongodb+srv://user:password@cluster0.xyz.mongodb.net/dbname?retryWrites=true&w=majority

2) Or provide parts (recommended to avoid manual URL encoding of the password):
   MONGO_USER=your_db_user
   MONGO_PASS=your_db_password
   MONGO_HOST=cluster0.lrzqv77.mongodb.net
   MONGO_DB=vn_dairy

The code will build the MONGO_URI automatically if `MONGO_URI` is not present.

PowerShell example to create `.env` safely (prompts for password):

```powershell
cd 'C:\Users\USER\Desktop\Project\react-project\src\dairy-backend'
$secure = Read-Host -AsSecureString "Enter Atlas DB password (hidden)"
$bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
$plain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
# password will be automatically URL-encoded when writing MONGO_PASS
$envContent = @"
PORT=5000
MONGO_USER=karingulaanil
MONGO_PASS=$plain
MONGO_HOST=cluster0.lrzqv77.mongodb.net
MONGO_DB=vn_dairy
JWT_SECRET=your_jwt_secret_here
TOKEN_EXPIRES_IN=7d
"@
$envContent | Out-File -FilePath .env -Encoding utf8 -Force
Write-Host ".env created in $(Get-Location). Edit values if needed."
```

Start server:
```powershell
npm install
npm start
```

If the server logs "MongoDB connected to ..." the connection is successful.
If you still see authentication errors, check Atlas Database Access (user/password) and Network Access (whitelist your IP).