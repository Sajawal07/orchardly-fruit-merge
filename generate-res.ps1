Add-Type -AssemblyName System.Drawing

function Resize-Image($srcPath, $destPath, $w, $h) {
    $src = [System.Drawing.Image]::FromFile($srcPath)
    $dest = New-Object System.Drawing.Bitmap($w, $h)
    $g = [System.Drawing.Graphics]::FromImage($dest)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.DrawImage($src, 0, 0, $w, $h)
    $g.Dispose()
    $src.Dispose()
    $dest.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $dest.Dispose()
    Write-Host "Created: $destPath"
}

$iconSrc = (Resolve-Path "images\app_icon.png").Path
$splashSrc = (Resolve-Path "images\splash_img.png").Path
$resDir = (Resolve-Path "android\app\src\main\res").Path

$iconSizes = @{
    "mipmap-mdpi" = 48
    "mipmap-hdpi" = 72
    "mipmap-xhdpi" = 96
    "mipmap-xxhdpi" = 144
    "mipmap-xxxhdpi" = 192
}

$fgSizes = @{
    "mipmap-mdpi" = 108
    "mipmap-hdpi" = 162
    "mipmap-xhdpi" = 216
    "mipmap-xxhdpi" = 324
    "mipmap-xxxhdpi" = 432
}

$splashSizes = @{
    "drawable-port-mdpi" = @(320, 480)
    "drawable-port-hdpi" = @(480, 800)
    "drawable-port-xhdpi" = @(720, 1280)
    "drawable-port-xxhdpi" = @(960, 1600)
    "drawable-port-xxxhdpi" = @(1080, 1920)
    "drawable-land-mdpi" = @(480, 320)
    "drawable-land-hdpi" = @(800, 480)
    "drawable-land-xhdpi" = @(1280, 720)
    "drawable-land-xxhdpi" = @(1600, 960)
    "drawable-land-xxxhdpi" = @(1920, 1080)
}

foreach ($k in $iconSizes.Keys) {
    $dir = Join-Path $resDir $k
    Resize-Image $iconSrc (Join-Path $dir "ic_launcher.png") $iconSizes[$k] $iconSizes[$k]
    Resize-Image $iconSrc (Join-Path $dir "ic_launcher_round.png") $iconSizes[$k] $iconSizes[$k]
}

foreach ($k in $fgSizes.Keys) {
    $dir = Join-Path $resDir $k
    Resize-Image $iconSrc (Join-Path $dir "ic_launcher_foreground.png") $fgSizes[$k] $fgSizes[$k]
}

foreach ($k in $splashSizes.Keys) {
    $dir = Join-Path $resDir $k
    Resize-Image $splashSrc (Join-Path $dir "splash.png") $splashSizes[$k][0] $splashSizes[$k][1]
}

Resize-Image $splashSrc (Join-Path (Join-Path $resDir "drawable") "splash.png") 480 800
Write-Host "All icons and splash screens generated successfully!"
