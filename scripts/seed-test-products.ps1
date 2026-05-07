param(
    [string]$BackendBaseUrl = "http://localhost:8085",
    [string]$ImageDir = "D:\Projects\Style-of-Simplicity\images",
    [int]$Count = 20,
    [long]$SellerId = 0
)

$ErrorActionPreference = "Stop"

function Assert-Ok([bool]$condition, [string]$message) {
    if (-not $condition) {
        throw $message
    }
}

function Invoke-JsonGet([string]$url) {
    $response = Invoke-WebRequest -UseBasicParsing -Uri $url
    return $response.Content | ConvertFrom-Json
}

Assert-Ok (Test-Path $ImageDir) "Image directory not found: $ImageDir"

$productListApi = "$BackendBaseUrl/api/v1/products"
$productRegisterUrl = "$BackendBaseUrl/seller/products/product_register"
$currentProductsPayload = Invoke-JsonGet $productListApi
Assert-Ok ($currentProductsPayload.success -eq $true) "Failed to fetch product list."

$currentProducts = @($currentProductsPayload.data)
$initialCount = $currentProducts.Count

if ($SellerId -le 0) {
    $detectedSellerId = $null
    if ($initialCount -gt 0) {
        $detectedSellerId = $currentProducts[0].sellerId
    }
    Assert-Ok ($detectedSellerId -ne $null) "SellerId is required. No existing product to detect sellerId."
    $SellerId = [long]$detectedSellerId
}

$images = Get-ChildItem -LiteralPath $ImageDir -File |
    Where-Object { $_.Extension -match "^\.(png|jpg|jpeg|webp)$" }
Assert-Ok ($images.Count -gt 0) "No usable image file found in $ImageDir"

$categories = @("TOP", "BOTTOM", "OUTER", "SHOES", "BAG", "ACC")
$nameWords = @("Minimal", "Urban", "Daily", "Vintage", "Soft", "Classic", "Modern", "Calm", "Street", "Clean")
$itemWords = @("Shirt", "Knit", "Jacket", "Coat", "Pants", "Skirt", "Sneakers", "Loafer", "Bag", "Scarf")
$created = 0
$failed = 0

for ($i = 1; $i -le $Count; $i++) {
    $category = $categories[($i - 1) % $categories.Count]
    $name = "[TEST] {0} {1} {2:D2}" -f $nameWords[($i - 1) % $nameWords.Count], $itemWords[($i - 1) % $itemWords.Count], $i
    $price = 19000 + (3000 * $i)
    $quantity = 5 + ($i % 16)
    $situationScore = 55 + ($i % 40)
    $description = "Auto-seeded test product $i for local QA flow."
    $image = $images[($i - 1) % $images.Count]
    $curlArgs = @(
        "-sS",
        "-o", "NUL",
        "-w", "%{http_code}",
        "-X", "POST",
        $productRegisterUrl,
        "-F", ("name={0}" -f $name),
        "-F", ("category={0}" -f $category),
        "-F", ("price={0}" -f $price),
        "-F", ("quantity={0}" -f $quantity),
        "-F", ("description={0}" -f $description),
        "-F", ("situationScore={0}" -f $situationScore),
        "-F", ("sellerId={0}" -f $SellerId),
        "-F", ("image=@{0}" -f $image.FullName)
    )

    try {
        $statusCode = (& curl.exe @curlArgs).Trim()
        if ($statusCode -eq "302" -or $statusCode -eq "200") {
            $created++
            Write-Host ("[SEED] CREATED ({0}/{1}) status={2} name={3}" -f $created, $Count, $statusCode, $name)
        } else {
            $failed++
            Write-Host ("[SEED] FAILED ({0}/{1}) status={2} name={3}" -f $i, $Count, $statusCode, $name)
        }
    } catch {
        $failed++
        Write-Host ("[SEED] FAILED ({0}/{1}) name={2} error={3}" -f $i, $Count, $name, $_.Exception.Message)
    }
}

$updatedProductsPayload = Invoke-JsonGet $productListApi
Assert-Ok ($updatedProductsPayload.success -eq $true) "Failed to re-fetch product list."
$finalCount = @($updatedProductsPayload.data).Count

Write-Host ""
Write-Host ("[SEED] Initial count : {0}" -f $initialCount)
Write-Host ("[SEED] Created       : {0}" -f $created)
Write-Host ("[SEED] Failed        : {0}" -f $failed)
Write-Host ("[SEED] Final count   : {0}" -f $finalCount)
