$path = 'd:\APP_STEM\app.js'
$c = [IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)

$oldText = '                <button type="button" data-cart-step="1" data-cart-id="${item.id}">+</button>'

if ($c.IndexOf($oldText) -lt 0) {
    Write-Output "OLD TEXT NOT FOUND"
    exit 1
}

$newButton = "`r`n                <button type=`"button`" class=`"cart-remove`" data-cart-remove=`" `${item.id} `" aria-label=`"✕` ">✕</button>"

# Build replacement with literal concatenation to avoid variable expansion issues
$replace = '<button type="button" data-cart-step="1" data-cart-id="${item.id}">+</button>' + "`r`n                <button type=`"button`" class=`"cart-remove`" data-cart-remove=`"`${item.id}`"" aria-label=`"Xóa sản phẩm`">✕</button>"

$c = $c -replace [regex]::Escape($oldText), $replace

# Also add the event listener for remove buttons
$oldListener = '  });`r`n}'
# Find the renderCart closing and add remove listener
$oldListenerBlock = '  document.querySelectorAll("[data-cart-id]").forEach((button) => {`r`n    button.addEventListener("click", () => changeCartQty(button.dataset.cartId, Number(button.dataset.cartStep)));`r`n  });`r`n}'

$newListenerBlock = '  document.querySelectorAll("[data-cart-id]").forEach((button) => {`r`n    button.addEventListener("click", () => changeCartQty(button.dataset.cartId, Number(button.dataset.cartStep)));`r`n  });`r`n  document.querySelectorAll("[data-cart-remove]").forEach((button) => {`r`n    button.addEventListener("click", () => removeFromCart(button.dataset.cartRemove));`r`n  });`r`n}'

if ($c.IndexOf($oldListenerBlock) -lt 0) {
    Write-Output "LISTENER BLOCK NOT FOUND"
    exit 2
}

$c = $c -replace [regex]::Escape($oldListenerBlock), $newListenerBlock

[IO.File]::WriteAllText($path, $c, [System.Text.Encoding]::UTF8)
Write-Output "SUCCESS"
