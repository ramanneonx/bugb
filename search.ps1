$ErrorActionPreference = "SilentlyContinue"
$shell = New-Object -ComObject Shell.Application
$recycleBin = $shell.Namespace(10)
foreach ($item in $recycleBin.Items()) {
    if ($item.Name -match "MyApplication|app-debug\.apk|\.apk") {
        Write-Output "Found in Recycle Bin: $($item.Name) -> $($item.Path)"
    }
}
