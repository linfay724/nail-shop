param(
    [string]$OutDir = "src\static"
)
# 粉蓝系 tabBar 图标： inactive = 蓝灰，active = 樱花粉
Add-Type -AssemblyName System.Drawing

$inactive = [System.Drawing.Color]::FromArgb(0xC9, 0xC4, 0xDA)
$active = [System.Drawing.Color]::FromArgb(0xFF, 0x8F, 0xB1)

function New-Icon {
    param([string]$Name, [System.Drawing.Color]$Color, [bool]$Filled)

    $size = 96
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $pen = New-Object System.Drawing.Pen($Color, 6)
    $brush = New-Object System.Drawing.SolidBrush($Color)

    switch ($Name) {
        'home' {
            # 圆顶小房子
            $path = New-Object System.Drawing.Drawing2D.GraphicsPath
            $path.AddArc(18, 30, 60, 40, 180, 180)
            $path.AddLine(78, 50, 78, 76)
            $path.AddLine(78, 76, 18, 76)
            $path.AddLine(18, 76, 18, 50)
            if ($Filled) { $g.FillPath($brush, $path) } else { $g.DrawPath($pen, $path) }
            $g.FillEllipse($brush, 40, 58, 16, 16)
        }
        'product' {
            # 圆角菱形（美甲片）
            $path = New-Object System.Drawing.Drawing2D.GraphicsPath
            $path.AddArc(30, 14, 36, 36, 180, 90)
            $path.AddArc(30, 14, 36, 36, 270, 90)
            $path.AddLine(66, 50, 48, 84)
            $path.AddLine(48, 84, 30, 50)
            $path.CloseFigure()
            if ($Filled) { $g.FillPath($brush, $path) } else { $g.DrawPath($pen, $path) }
            $g.FillEllipse([System.Drawing.Brushes]::White, 42, 34, 12, 12)
        }
        'cart' {
            # 圆润购物袋
            $path = New-Object System.Drawing.Drawing2D.GraphicsPath
            $path.AddArc(20, 34, 56, 56, 180, 180)
            $path.AddLine(76, 62, 76, 34)
            $path.AddLine(76, 34, 20, 34)
            $path.CloseFigure()
            if ($Filled) { $g.FillPath($brush, $path) } else { $g.DrawPath($pen, $path) }
            $g.DrawArc($pen, 34, 20, 28, 28, 180, 180)
        }
        'order' {
            # 圆角单据
            $path = New-Object System.Drawing.Drawing2D.GraphicsPath
            $path.AddArc(22, 16, 52, 20, 180, 180)
            $path.AddLine(74, 26, 74, 74)
            $path.AddArc(22, 64, 52, 20, 0, 180)
            $path.AddLine(22, 74, 22, 26)
            $path.CloseFigure()
            if ($Filled) { $g.FillPath($brush, $path) } else { $g.DrawPath($pen, $path) }
            $dot = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
            $g.FillEllipse($dot, 34, 36, 8, 8)
            $g.FillEllipse($dot, 34, 52, 8, 8)
            $g.DrawLine($pen, 50, 40, 64, 40)
            $g.DrawLine($pen, 50, 56, 64, 56)
        }
        'profile' {
            # 圆脸娃娃头
            $g.DrawArc($pen, 24, 14, 48, 48, 180, 180)
            $g.FillEllipse($brush, 24, 38, 48, 44)
            $g.FillEllipse([System.Drawing.Brushes]::White, 38, 30, 8, 8)
            $g.FillEllipse([System.Drawing.Brushes]::White, 52, 30, 8, 8)
            $g.FillEllipse([System.Drawing.Brushes]::White, 44, 44, 10, 6)
        }
    }

    $g.Dispose()
    $suffix = if ($Filled) { '-active' } else { '' }
    $bmp.Save("$OutDir\tab-$Name$suffix.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
}

foreach ($name in @('home', 'product', 'cart', 'order', 'profile')) {
    New-Icon -Name $name -Color $inactive -Filled $false
    New-Icon -Name $name -Color $active -Filled $true
}
Write-Host 'tabBar icons regenerated (pink/blue).'
