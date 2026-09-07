import re

path = r'd:\APP_STEM\app.js'
with open(path, 'rb') as f:
    data = f.read()

text = data.decode('utf-8')

# Step 1: Add remove button after the "+" qty button in the cart line template
old_button = '<button type="button" data-cart-step="1" data-cart-id="${item.id}">+</button>'
new_button = old_button + '\r\n                <button type="button" class="cart-remove" data-cart-remove="${item.id}" aria-label="Xoa san pham">x</button>'

count = text.count(old_button)
if count != 1:
    print(f"ERROR: Found {count} occurrences of button template (expected 1)")
    exit(1)

text = text.replace(old_button, new_button, 1)

# Step 2: Add event listener for remove buttons after the cart-id listener block
old_listener = '  document.querySelectorAll("[data-cart-id]").forEach((button) => {\r\n    button.addEventListener("click", () => changeCartQty(button.dataset.cartId, Number(button.dataset.cartStep)));\r\n  });'
new_listener = old_listener + '\r\n  document.querySelectorAll("[data-cart-remove]").forEach((button) => {\r\n    button.addEventListener("click", () => removeFromCart(button.dataset.cartRemove));\r\n  });'

count2 = text.count(old_listener)
if count2 != 1:
    print(f"ERROR: Found {count2} occurrences of listener block (expected 1)")
    exit(2)

text = text.replace(old_listener, new_listener, 1)

with open(path, 'wb') as f:
    f.write(text.encode('utf-8'))

print("SUCCESS: Both edits applied.")
