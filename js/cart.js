// ===== CART SYSTEM =====
let cart = JSON.parse(localStorage.getItem('le_cart') || '[]');

function saveCart() {
  localStorage.setItem('le_cart', JSON.stringify(cart));
  updateCartBadge();
}

function updateCartBadge() {
  const badge = document.getElementById('cartBadge');
  if (!badge) return;
  badge.textContent = cart.length;
  badge.style.display = cart.length > 0 ? 'flex' : 'none';
}

// Add item to cart
function addToCart(item) {
  item.id = Date.now();
  cart.push(item);
  saveCart();
  showCartNotification(item.product);
  renderCart();
}

// Remove item
function removeFromCart(id) {
  cart = cart.filter(i => i.id !== id);
  saveCart();
  renderCart();
}

// Notification toast
function showCartNotification(productName) {
  const toast = document.getElementById('cartToast');
  toast.textContent = productName + ' added to cart';
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

// Toggle cart panel
function toggleCart() {
  const panel = document.getElementById('cartPanel');
  const overlay = document.getElementById('cartOverlay');
  panel.classList.toggle('open');
  overlay.classList.toggle('open');
  if (panel.classList.contains('open')) renderCart();
}

function closeCart() {
  document.getElementById('cartPanel').classList.remove('open');
  document.getElementById('cartOverlay').classList.remove('open');
}

// Render cart items
function renderCart() {
  const container = document.getElementById('cartItems');
  const totalEl = document.getElementById('cartTotal');
  const checkoutBtn = document.getElementById('cartCheckoutBtn');
  const emptyMsg = document.getElementById('cartEmpty');

  if (cart.length === 0) {
    container.innerHTML = '';
    emptyMsg.style.display = 'block';
    checkoutBtn.style.display = 'none';
    totalEl.textContent = '$0.00';
    return;
  }

  emptyMsg.style.display = 'none';
  checkoutBtn.style.display = 'block';

  let total = 0;
  container.innerHTML = cart.map(item => {
    total += item.price;
    return `
      <div class="cart-item">
        <div class="cart-item-color" style="background:${item.productColor || '#c8a882'};"></div>
        <div class="cart-item-details">
          <div class="cart-item-name">${item.product}${item.productColorName ? ', ' + item.productColorName : ''}</div>
          <div class="cart-item-meta">
            ${item.engravingText ? '<span>Text: "' + item.engravingText + '"</span>' : ''}
            ${item.font ? '<span>Font: ' + item.font + '</span>' : ''}
            ${item.hasImage ? '<span>Custom image attached</span>' : ''}
            ${item.quantity > 1 ? '<span>Qty: ' + item.quantity + '</span>' : ''}
          </div>
          <div class="cart-item-price">$${item.price.toFixed(2)}</div>
        </div>
        <button class="cart-item-remove" onclick="removeFromCart(${item.id})">&times;</button>
      </div>
    `;
  }).join('');

  totalEl.textContent = '$' + total.toFixed(2);
}

// Add from demo
function addDemoToCart() {
  const product = document.querySelector('.demo-product-btn.active')?.textContent.trim() || 'Custom Product';
  const text = document.getElementById('demoText')?.value || '';
  const fontBtn = document.querySelector('.demo-font-btn.active');
  const font = fontBtn?.querySelector('span')?.textContent || 'Elegant';
  const pcolorBtn = document.querySelector('.demo-pcolor-btn.active');
  const productColorName = pcolorBtn?.parentElement?.querySelector('.demo-pcolor-label')?.textContent || '';
  const productColor = pcolorBtn?.style.background || '';
  const hasImage = document.getElementById('demoEngraveImg')?.style.display !== 'none';

  const prices = { 'Journal': 18, 'Bottle': 15, 'Necklace': 15, 'Bracelet': 15, 'Keychain': 12 };
  const price = prices[product] || 15;

  addToCart({
    product,
    engravingText: text,
    font,
    productColorName,
    productColor,
    hasImage,
    price,
    quantity: 1
  });
}

// Checkout - go to checkout page
function cartCheckout() {
  window.location.href = 'checkout.html';
}

// Quick add from product card
function quickAddToCart(productName, price) {
  // Show customization modal
  const modal = document.getElementById('customizeModal');
  modal.dataset.product = productName;
  modal.dataset.price = price;
  document.getElementById('modalProductName').textContent = productName;
  document.getElementById('modalEngravingText').value = '';
  modal.classList.add('open');
  document.getElementById('cartOverlay').classList.add('open');
}

function closeCustomizeModal() {
  document.getElementById('customizeModal').classList.remove('open');
  document.getElementById('cartOverlay').classList.remove('open');
}

function submitCustomizeModal() {
  const modal = document.getElementById('customizeModal');
  const product = modal.dataset.product;
  const price = parseFloat(modal.dataset.price);
  const text = document.getElementById('modalEngravingText').value;
  const font = document.querySelector('.modal-font-btn.active')?.dataset.fontname || 'Elegant';
  addToCart({
    product,
    engravingText: text,
    font,
    price,
    quantity: 1
  });

  closeCustomizeModal();
}

// Init
document.addEventListener('DOMContentLoaded', () => {
  updateCartBadge();
});
