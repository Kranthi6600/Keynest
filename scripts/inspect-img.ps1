Add-Type -AssemblyName System.Drawing
$b = [System.Drawing.Bitmap]::new("F:\OWN PROJECTS\Keynest\public\imgs\keynest.png")
$w = $b.Width; $h = $b.Height
# Sample a grid of points and print alpha + color for each
$points = @(
  @(0,0), @([int]($w*0.05), [int]($h*0.05)), @([int]($w*0.1), [int]($h*0.1)),
  @([int]($w*0.2), [int]($h*0.05)), @([int]($w*0.05), [int]($h*0.2)),
  @([int]($w*0.5), [int]($h*0.05)), @([int]($w*0.05), [int]($h*0.5)),
  @([int]($w*0.5), [int]($h*0.12)), @([int]($w*0.12), [int]($h*0.5)),
  @([int]($w*0.5), [int]($h*0.5)), @([int]($w*0.85), [int]($h*0.15)),
  @([int]($w*0.95), [int]($h*0.95))
)
foreach ($pt in $points) {
  $p = $b.GetPixel($pt[0], $pt[1])
  Write-Output ("({0},{1}) rgba({2},{3},{4},{5})" -f $pt[0], $pt[1], $p.R, $p.G, $p.B, $p.A)
}
# Count opaque-ish pixels to see coverage
$semi = 0; $opaque = 0; $clear = 0
for ($y = 0; $y -lt $h; $y += 20) {
  for ($x = 0; $x -lt $w; $x += 20) {
    $a = $b.GetPixel($x, $y).A
    if ($a -eq 0) { $clear++ } elseif ($a -lt 200) { $semi++ } else { $opaque++ }
  }
}
Write-Output ("sampled: clear={0} semi={1} opaque={2}" -f $clear, $semi, $opaque)
$b.Dispose()
