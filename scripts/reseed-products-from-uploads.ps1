param(
    [string]$BackendBaseUrl = "http://localhost:8085",
    [string]$UploadRoot = "D:\Projects\Style-of-Simplicity\sosos\uploads",
    [string]$DetailImagePath = "D:\Projects\Style-of-Simplicity\sosos\uploads\test-Detailed-explanation.png",
    [long]$SellerId = 2,
    [int]$RandomSeed = 20260429
)

$ErrorActionPreference = "Stop"

function Assert-Condition([bool]$condition, [string]$message) {
    if (-not $condition) {
        throw $message
    }
}

function New-Options([string]$category) {
    switch ($category) {
        "SHOES" {
            return @(
                @{ sizeLabel = "255"; quantity = 2; displayOrder = 0 },
                @{ sizeLabel = "260"; quantity = 3; displayOrder = 1 },
                @{ sizeLabel = "265"; quantity = 3; displayOrder = 2 },
                @{ sizeLabel = "270"; quantity = 2; displayOrder = 3 }
            )
        }
        "BAG_ACC" {
            return @(
                @{ sizeLabel = "FREE"; quantity = 10; displayOrder = 0 }
            )
        }
        "BOTTOMS" {
            return @(
                @{ sizeLabel = "S"; quantity = 3; displayOrder = 0 },
                @{ sizeLabel = "M"; quantity = 4; displayOrder = 1 },
                @{ sizeLabel = "L"; quantity = 3; displayOrder = 2 }
            )
        }
        default {
            return @(
                @{ sizeLabel = "M"; quantity = 3; displayOrder = 0 },
                @{ sizeLabel = "L"; quantity = 4; displayOrder = 1 },
                @{ sizeLabel = "XL"; quantity = 3; displayOrder = 2 }
            )
        }
    }
}

function New-Meta(
    [string]$folder,
    [string]$category,
    [string]$file,
    [string]$name,
    [string]$keywords,
    [string]$tabs,
    [int]$price,
    [int]$originalPrice
) {
    return [pscustomobject]@{
        Folder = $folder
        Category = $category
        FileName = $file
        Name = $name
        Keywords = @($keywords.Split(",") | ForEach-Object { $_.Trim() } | Where-Object { $_ })
        Tabs = @($tabs.Split(",") | ForEach-Object { $_.Trim() } | Where-Object { $_ })
        Price = $price
        OriginalPrice = $originalPrice
    }
}

function Build-Catalog {
    $items = @()

    $items += New-Meta "outer" "OUTER" "1d8b0e92-1718-4a05-b2b5-a67ce213cede_79b51d81-a395-4fc5-9e23-4c9dc44be645_OVERSIZED-CASHMERE-BALMACAAN-COAT-BLACK.webp" "Cashmere Balmacaan Coat Black" "코트,발마칸,캐시미어,겨울" "gift,work" 199000 239000
    $items += New-Meta "outer" "OUTER" "2d61508a17244ac7b00e74d7051e0c9d.webp" "Charcoal Stand Zip Jacket" "자켓,집업,차콜,봄" "starter,basic" 109000 129000
    $items += New-Meta "outer" "OUTER" "4959964_17431474849237_big.webp" "Black Collarless Knit Jacket" "자켓,카라리스,니트,미니멀" "basic" 98000 119000
    $items += New-Meta "outer" "OUTER" "5290575_17687820726455_big.webp" "Black Leather Blouson" "블루종,가죽,블랙,가을" "gift,work" 169000 199000
    $items += New-Meta "outer" "OUTER" "5991805_17708088032620_big.webp" "Olive Harrington Jacket" "해링턴자켓,올리브,캐주얼,간절기" "basic,starter" 119000 139000
    $items += New-Meta "outer" "OUTER" "6028598_17714661432811_big.webp" "Black Cropped Rider Jacket" "라이더자켓,크롭,가죽,스트릿" "gift" 179000 219000
    $items += New-Meta "outer" "OUTER" "6219799_17748499355012_big.webp" "White Light Windbreaker" "바람막이,화이트,라이트,봄" "starter,new" 89000 105000
    $items += New-Meta "outer" "OUTER" "6246516_17754414069887_big.webp" "Charcoal City Zip Blouson" "블루종,집업,차콜,데일리" "work,new" 112000 132000
    $items += New-Meta "outer" "OUTER" "detail_2322837_17567968146126_big.webp" "Brown Wool Short Jacket" "울자켓,브라운,숏자켓,포멀" "work" 124000 149000
    $items += New-Meta "outer" "OUTER" "detail_5990760_17749189854194_big.webp" "Gray Hooded Windbreaker" "바람막이,후드,그레이,스포티" "starter,new" 97000 115000
    $items += New-Meta "outer" "OUTER" "ffc486ae-7678-4ee2-ba5f-a89451ecb1ad_89cef45a-f108-4aa2-a92e-ae2e89780d4b_MTR-----.png" "Brown Double Long Coat" "롱코트,브라운,더블코트,클래식" "gift,work" 189000 229000

    $items += New-Meta "top" "TOP" "5251491_17731899643671_big.webp" "White Graphic Oversize Tee" "반팔티,그래픽,오버핏,스트릿" "starter,new" 39000 49000
    $items += New-Meta "top" "TOP" "6109239_17767386997524_big.webp" "Charcoal Layered Half Tee" "반팔티,레이어드,차콜,데일리" "basic,work" 42000 52000
    $items += New-Meta "top" "TOP" "6186543_17773526880855_big.webp" "Navy Vintage Print Tee" "반팔티,네이비,빈티지프린트,캐주얼" "new,starter" 41000 51000
    $items += New-Meta "top" "TOP" "6202285_17754569284332_big.webp" "Navy Character Graphic Tee" "반팔티,그래픽,네이비,캐주얼" "starter" 45000 56000
    $items += New-Meta "top" "TOP" "6202326_17754567101268_big.webp" "Oatmeal Ringer Tee" "링거티,오트밀,반팔티,베이직" "basic,new" 43000 53000
    $items += New-Meta "top" "TOP" "6205180_17754395977340_big.webp" "Gray Logo Comfort Tee" "반팔티,로고,그레이,편안한" "basic,starter" 39000 49000
    $items += New-Meta "top" "TOP" "6230390_17763944078618_big.webp" "Gray Mesh Racing Jersey Tee" "메시티,레이싱저지,그레이,스포티" "new" 53000 65000
    $items += New-Meta "top" "TOP" "detail_6206145_17748542336573_big.webp" "Charcoal Stripe Half Tee" "반팔티,스트라이프,차콜,베이직" "basic" 37000 46000
    $items += New-Meta "top" "TOP" "detail_6291419_17757966041992_big.webp" "Black Waffle Henley Half Tee" "헨리넥,와플티,블랙,반팔" "basic,work" 47000 59000

    $items += New-Meta "bottoms" "BOTTOMS" "2380003_17115328899711_big.webp" "Stone Cargo Long Pants" "롱팬츠,카고팬츠,와이드핏,캐주얼" "starter" 59000 72000
    $items += New-Meta "bottoms" "BOTTOMS" "2921680_17177202380146_big.webp" "Navy Jogger Sweat Pants" "조거팬츠,스웨트팬츠,네이비,편안한" "basic,starter" 52000 64000
    $items += New-Meta "bottoms" "BOTTOMS" "3276580_17156469821652_big.webp" "Khaki Cargo Shorts" "반바지,카고쇼츠,카키,여름" "new" 48000 59000
    $items += New-Meta "bottoms" "BOTTOMS" "3825838_17151318616383_big.webp" "Navy Straight Slacks" "슬랙스,스트레이트핏,네이비,포멀" "work,gift" 61000 75000
    $items += New-Meta "bottoms" "BOTTOMS" "4150289_17663800565508_big.webp" "Washed Wide Denim Pants" "청바지,와이드데님,워시드,롱팬츠" "new" 67000 82000
    $items += New-Meta "bottoms" "BOTTOMS" "4702958_17754496380398_big.webp" "Black Wide Denim Pants" "청바지,와이드데님,블랙,롱팬츠" "basic" 66000 81000
    $items += New-Meta "bottoms" "BOTTOMS" "5947250_17696675394472_big.webp" "Gray Belted Slacks" "슬랙스,벨트디테일,그레이,출근룩" "work,gift" 69000 84000
    $items += New-Meta "bottoms" "BOTTOMS" "6265580_17763915552789_big.webp" "Deep Blue Wide Denim" "청바지,와이드데님,딥블루,롱팬츠" "basic" 68000 83000
    $items += New-Meta "bottoms" "BOTTOMS" "6266538_17755265046457_big.webp" "Vintage Denim Shorts" "반바지,데님쇼츠,빈티지,여름" "starter,new" 49000 60000
    $items += New-Meta "bottoms" "BOTTOMS" "6315981_17762408426271_big.webp" "Dark Utility Cargo Pants" "롱팬츠,카고팬츠,다크톤,유틸리티" "new" 62000 76000
    $items += New-Meta "bottoms" "BOTTOMS" "9b49fcef-298e-4a74-8efb-d9dd644b045f_7e1fd8b6-c3e7-46fb-a5b6-c58e7ab7f0cb_SOFT-OR-SOFT-BALLOON-SLACKS-DARK-BROWN.webp" "Dark Brown Balloon Slacks" "슬랙스,벌룬핏,다크브라운,롱팬츠" "work,gift" 73000 89000
    $items += New-Meta "bottoms" "BOTTOMS" "fa27093e-8727-47ca-93b0-bbe62ea57931_8fcc9097-3315-4a81-ae74-c08d8805b6e4_Card-Wallet-Wide-Denim-Pants---Deep-Blue.webp" "Classic Wide Denim Pants" "청바지,와이드데님,클래식,롱팬츠" "basic" 65000 79000

    $items += New-Meta "shoes" "SHOES" "3416013_17150596330106_big.webp" "All Black Chunky Sneakers" "스니커즈,청키솔,블랙,스트릿" "starter,new" 79000 99000
    $items += New-Meta "shoes" "SHOES" "3933001_17122159708710_big.webp" "White Running Sneakers" "스니커즈,러닝화,화이트,스포티" "starter" 85000 105000
    $items += New-Meta "shoes" "SHOES" "4306219_17337969213971_big.webp" "Black Glossy Derby Shoes" "더비슈즈,유광,블랙,포멀" "work,gift" 99000 119000
    $items += New-Meta "shoes" "SHOES" "4409448_17259301318908_big.webp" "Cream Classic Stripe Sneakers" "스니커즈,크림,스트라이프,빈티지" "basic" 93000 112000
    $items += New-Meta "shoes" "SHOES" "4732201_17375992199068_big.webp" "Silver Trail Sneakers" "스니커즈,실버,트레일,아웃도어" "new" 102000 122000
    $items += New-Meta "shoes" "SHOES" "5502508_17586904161782_big.webp" "Red Speedcat Sneakers" "스니커즈,레드,로우프로파일,스트릿" "gift,new" 98000 118000
    $items += New-Meta "shoes" "SHOES" "5679708_17623981083807_big.webp" "Brown Suede Low Sneakers" "스니커즈,브라운,스웨이드,캐주얼" "basic" 89000 108000
    $items += New-Meta "shoes" "SHOES" "5983246_17702111669757_big.webp" "Black Minimal Derby" "더비슈즈,블랙,미니멀,출근룩" "work" 94000 114000
    $items += New-Meta "shoes" "SHOES" "6228741_17749417305462_big.webp" "Gray Tech Hiking Sneakers" "스니커즈,그레이,테크웨어,아웃도어" "new,starter" 97000 117000
    $items += New-Meta "shoes" "SHOES" "6f47df34-3c84-4094-a93c-7580b8ab52db_50407753-ccaa-4202-9960-f500184ed16a_--in-leather-white.webp" "Vintage White Leather Sneakers" "스니커즈,화이트,가죽,베이직" "basic" 91000 109000
    $items += New-Meta "shoes" "SHOES" "f0ec6d13-7762-4832-8b51-8adc6c9eb4c4_417e8d3c-f05c-4406-b43b-bde36ac08b66_--6--.webp" "Wheat Outdoor Boots" "부츠,밀색,아웃도어,가을" "gift" 129000 149000

    $items += New-Meta "BAG_acc" "BAG_ACC" "0a6e61fe-a7f2-4fd2-af45-afe707387cf4_6a680790-8cd6-4037-b99d-2b78dc2807a5_--Grey.webp" "Gray Ribbed Muffler" "머플러,그레이,리브짜임,겨울" "gift" 29000 36000
    $items += New-Meta "BAG_acc" "BAG_ACC" "4623777_17350065740777_big.webp" "Olive Sling Shoulder Bag" "가방,숄더백,슬링백,올리브" "starter" 69000 85000
    $items += New-Meta "BAG_acc" "BAG_ACC" "5095686_17476450662677_big.webp" "Monotone Beads Necklace" "목걸이,비즈,모노톤,레이어드" "gift" 39000 48000
    $items += New-Meta "BAG_acc" "BAG_ACC" "5109480_17472175286174_big.webp" "Silver Minimal Ring" "반지,실버,미니멀,악세서리" "gift,basic" 32000 39000
    $items += New-Meta "BAG_acc" "BAG_ACC" "5359903_17561725974021_big.webp" "Black Cross Messenger Bag" "가방,메신저백,크로스백,블랙" "starter,new" 74000 92000
    $items += New-Meta "BAG_acc" "BAG_ACC" "5874364_17690554952456_big.webp" "Slim Chain Bracelet" "팔찌,체인팔찌,슬림,실버" "gift" 34000 42000
    $items += New-Meta "BAG_acc" "BAG_ACC" "6054634_17720006099852_big.webp" "Star Engraved Silver Ring" "반지,실버,각인,악세서리" "gift" 35000 43000
    $items += New-Meta "BAG_acc" "BAG_ACC" "6137440_17736384317311_big.webp" "Rimless Silver Eyewear" "안경,림리스,실버,모던" "gift,new" 79000 96000
    $items += New-Meta "BAG_acc" "BAG_ACC" "6276350_17756250756748_big.webp" "Black Tech Backpack" "가방,백팩,블랙,수납력" "starter,new" 119000 139000
    $items += New-Meta "BAG_acc" "BAG_ACC" "6284099_17757934006736_big.webp" "Skull Chain Bracelet" "팔찌,체인팔찌,해골포인트,스트릿" "gift" 43000 53000
    $items += New-Meta "BAG_acc" "BAG_ACC" "6316261_17762383721040_big.webp" "Silver Pendant Necklace" "목걸이,팬던트,실버,악세서리" "gift" 47000 57000
    $items += New-Meta "BAG_acc" "BAG_ACC" "80cebcc8-df53-4b33-9448-2f69c198347c_651d1923-d225-4161-8b02-f2c5e38ef35d_-__.webp" "Brown Bowling Tote Bag" "가방,토트백,브라운,볼링백" "new" 82000 99000
    $items += New-Meta "BAG_acc" "BAG_ACC" "966696_16790283247290_big.webp" "Twist Silver Ring" "반지,실버,트위스트,악세서리" "basic,gift" 31000 38000
    $items += New-Meta "BAG_acc" "BAG_ACC" "detail_6308329_17764091010470_big.webp" "Dark Gray Mini Shoulder Bag" "가방,미니숄더백,다크그레이,데일리" "starter" 67000 82000

    return $items
}

function Get-BestPickSet([object[]]$catalog, [int]$seed) {
    $null = Get-Random -SetSeed $seed
    $set = New-Object System.Collections.Generic.HashSet[string]
    foreach ($folder in @("outer", "top", "bottoms", "shoes", "BAG_acc")) {
        $bucket = @($catalog | Where-Object { $_.Folder -eq $folder })
        if ($bucket.Count -eq 0) {
            continue
        }
        $pickCount = [Math]::Min(3, $bucket.Count)
        $picked = $bucket | Get-Random -Count $pickCount
        foreach ($item in $picked) {
            [void]$set.Add("$($item.Folder)/$($item.FileName)")
        }
    }
    return $set
}

function Delete-AllProducts([string]$apiUrl) {
    $payload = Invoke-RestMethod -Uri $apiUrl -Method GET
    Assert-Condition ($payload.success -eq $true) "Failed to fetch product list before delete."

    foreach ($product in @($payload.data)) {
        Invoke-RestMethod -Uri "$apiUrl/$($product.id)" -Method DELETE | Out-Null
        Write-Host ("[DELETE] id={0} name={1}" -f $product.id, $product.name)
    }

    return @($payload.data).Count
}

function Add-OneProduct(
    [string]$apiUrl,
    [object]$meta,
    [long]$sellerId,
    [string]$uploadRoot,
    [string]$detailImagePath,
    [System.Collections.Generic.HashSet[string]]$bestPickSet
) {
    $imagePath = Join-Path (Join-Path $uploadRoot $meta.Folder) $meta.FileName
    Assert-Condition (Test-Path $imagePath) "Image not found: $imagePath"

    $tabs = @($meta.Tabs)
    if ($bestPickSet.Contains("$($meta.Folder)/$($meta.FileName)")) {
        $tabs += "best"
    }
    if (-not ($tabs -contains "new")) {
        $tabs += "new"
    }
    $tabs = @($tabs | Select-Object -Unique)

    $options = @()
    $optionsCsv = $null
    if ($meta.Category -ne "BAG_ACC") {
        $options = New-Options $meta.Category
        $quantity = ($options | ForEach-Object { [int]$_.quantity } | Measure-Object -Sum).Sum
        $optionsCsv = ($options | ForEach-Object { "{0}:{1}" -f $_.sizeLabel, $_.quantity }) -join ","
    } else {
        $quantity = 10
    }
    if ($null -eq $quantity) {
        $quantity = 10
    }

    $keywordsCsv = ($meta.Keywords -join ",")
    $discoveryCsv = ($tabs -join ",")

    $description = "{0} ({1}) curated from folder-based upload set." -f $meta.Name, $meta.Category

    $curlArgs = @(
        "-sS",
        "-X", "POST",
        $apiUrl,
        "-F", ("sellerId={0}" -f $sellerId),
        "-F", ("name={0}" -f $meta.Name),
        "-F", ("category={0}" -f $meta.Category),
        "-F", ("price={0}" -f $meta.Price),
        "-F", ("originalPrice={0}" -f $meta.OriginalPrice),
        "-F", ("quantity={0}" -f $quantity),
        "-F", ("description={0}" -f $description),
        "-F", "situationScore=75",
        "--form-string", ("keywords={0}" -f $keywordsCsv),
        "--form-string", ("discoveryTabKeysJson={0}" -f $discoveryCsv),
        "-F", ("image=@{0}" -f $imagePath),
        "-F", ("descriptionImage=@{0}" -f $detailImagePath)
    )
    if (-not [string]::IsNullOrWhiteSpace($optionsCsv)) {
        $curlArgs += @("--form-string", ("optionsJson={0}" -f $optionsCsv))
    }

    $responseRaw = (& curl.exe @curlArgs)
    Assert-Condition (-not [string]::IsNullOrWhiteSpace($responseRaw)) "Create API returned empty body: $($meta.Name)"

    $response = $responseRaw | ConvertFrom-Json
    Assert-Condition ($response.success -eq $true) ("Create failed for {0}: {1}" -f $meta.Name, $response.message)

    Write-Host ("[CREATE] id={0} category={1} best={2} name={3}" -f $response.data.id, $response.data.category, ($tabs -contains "best"), $response.data.name)
}

Assert-Condition (Test-Path $UploadRoot) "Upload root missing: $UploadRoot"
Assert-Condition (Test-Path $DetailImagePath) "Detail image missing: $DetailImagePath"

$apiUrl = "$BackendBaseUrl/api/v1/products"
$catalog = Build-Catalog
Assert-Condition ($catalog.Count -gt 0) "Catalog is empty."

$bestPickSet = Get-BestPickSet -catalog $catalog -seed $RandomSeed

Write-Host "[STEP] Delete all existing products"
$deletedCount = Delete-AllProducts -apiUrl $apiUrl
Write-Host ("[DONE] Deleted products: {0}" -f $deletedCount)

Write-Host "[STEP] Create catalog products"
$createdCount = 0
foreach ($item in $catalog) {
    Add-OneProduct -apiUrl $apiUrl -meta $item -sellerId $SellerId -uploadRoot $UploadRoot -detailImagePath $DetailImagePath -bestPickSet $bestPickSet
    $createdCount++
}

$finalPayload = Invoke-RestMethod -Uri $apiUrl -Method GET
Assert-Condition ($finalPayload.success -eq $true) "Failed to fetch final products."

$finalList = @($finalPayload.data)
$bestCount = @($finalList | Where-Object { @($_.discoveryTabKeys) -contains "best" }).Count

Write-Host ""
Write-Host ("[RESULT] Catalog entries: {0}" -f $catalog.Count)
Write-Host ("[RESULT] Created entries: {0}" -f $createdCount)
Write-Host ("[RESULT] Final product count: {0}" -f $finalList.Count)
Write-Host ("[RESULT] BEST-tagged count: {0}" -f $bestCount)


