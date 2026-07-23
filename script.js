/* ⚠️ Reemplaza esto por tu usuario real de Instagram (sin @) */
const IG_USERNAME = 'nikkoppon';

/* ⚠️ Pega aquí la URL de tu Google Apps Script publicado como "Aplicación web"
   (ver instrucciones en google-apps-script.gs). Déjalo vacío ('') si todavía
   no lo configuras — el resto del sitio funciona igual sin esto. */
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwKkTuXtlesP_SCjCmu7BYQlvaT2VqXkeaed5-pIz3RLq1U2aypAgqUyYErlC-60-rxoA/exec';

/* ⚠️ Cambia esto por cualquier texto largo y difícil de adivinar (por ejemplo,
   una mezcla de letras y números). Debe ser EXACTAMENTE el mismo valor que
   pongas en SHARED_SECRET dentro de google-apps-script.gs — así el script
   rechaza pedidos que no vengan de tu propia página. */
const SHARED_SECRET = 'cree-la-cuenta-fucionando-mi-nombre-con-Nippon';

const STICKER_MATERIALS = {
  mate:{ label:'Mate', desc:'Sin reflejos, textura suave al tacto. Ideal para un look minimalista.', basePrice:300, overlayClass:'overlay mate', swatchClass:'swatch-mate' },
  tornasol:{ label:'Tornasol', desc:'Cambia de color según la luz. El más llamativo para destacar tu diseño.', basePrice:500, overlayClass:'overlay tornasol', swatchClass:'swatch-tornasol' },
  brillante:{ label:'Brillante', desc:'Superficie vibrante que resalta los colores de tu imagen.', basePrice:400, overlayClass:'overlay brillante', swatchClass:'swatch-brillante' }
};

const STICKER_SIZES = [
  {id:'s', label:'5 cm', mult:1, cm:5},
  {id:'m', label:'8 cm', mult:1.4, cm:8},
  {id:'l', label:'12 cm', mult:1.9, cm:12}
];

const POSTER_SIZES = [
  {id:'a4', label:'A4 (21 x 29,7 cm)', price:1200, wCm:21, hCm:29.7},
  {id:'10x15', label:'10 x 15 cm', price:700, wCm:10, hCm:15}
];

const FRAME_LONG_PX = 220;   // tamaño del marco de recorte en pantalla
const CROP_EXPORT_LONG_PX = 1600; // resolución del recorte final exportado

let cart = [];

let modalState = {
  type:null, material:'mate', sizeId:null, qty:1, image:null, notes:'',
  orientation:'vertical',
  crop:{ rotation:0, zoom:1, offsetX:0, offsetY:0, natW:0, natH:0 }
};

// Para arrastrar la imagen dentro del marco de recorte (estado global,
// para no ir acumulando listeners cada vez que se reconstruye el marco)
let cropDrag = { active:false, startX:0, startY:0, baseOffsetX:0, baseOffsetY:0 };

function formatCLP(n){
  return '$' + Math.round(n).toLocaleString('es-CL');
}

function formatCm(n){
  return (Math.round(n * 10) / 10).toString().replace('.', ',');
}

/* ---------- modal ---------- */

let editingCartIndex = null;

function openModal(type, prefill){
  if(!prefill) editingCartIndex = null;

  modalState = {
    type,
    material: (prefill && prefill.materialId) || 'mate',
    sizeId: (prefill && prefill.sizeId) || (type==='sticker' ? 'm' : 'a4'),
    qty: (prefill && prefill.qty) || 1,
    image: (prefill && prefill.image) || null,
    notes: (prefill && prefill.notes) || '',
    orientation: (prefill && prefill.orientation) || 'vertical',
    crop:{ rotation:0, zoom:1, offsetX:0, offsetY:0, natW:0, natH:0 },
    uploadedNatW:0, uploadedNatH:0
  };
  document.getElementById('notesInput').value = modalState.notes;
  document.getElementById('cropZoom').value = 100;
  document.getElementById('resWarning').style.display = 'none';
  document.getElementById('termsCheck').checked = false;
  document.getElementById('qtyVal').textContent = modalState.qty;

  const isSticker = type === 'sticker';
  document.getElementById('materialField').style.display = isSticker ? '' : 'none';
  document.getElementById('orientationField').style.display = isSticker ? 'none' : '';
  document.getElementById('cropControlsField').style.display = 'none';
  document.getElementById('modalWindowTitle').textContent = isSticker ? 'STICKER.EXE' : 'POSTER.EXE';

  if(isSticker){
    const mat = STICKER_MATERIALS[modalState.material];
    document.getElementById('modalEyebrow').textContent = 'Personalizable';
    document.getElementById('modalTitle').textContent = 'Sticker';
    document.getElementById('modalDesc').textContent = mat.desc;
    document.querySelectorAll('#materialField .chip').forEach(c=>c.classList.toggle('active', c.dataset.material===modalState.material));
  } else {
    document.getElementById('modalEyebrow').textContent = 'Personalizable';
    document.getElementById('modalTitle').textContent = 'Poster';
    document.getElementById('modalDesc').textContent = 'Elige el tamaño y la orientación, sube tu imagen y acomódala dentro del marco.';
    document.querySelectorAll('#orientationField .chip').forEach(c=>c.classList.toggle('active', c.dataset.orient===modalState.orientation));
  }

  renderSizeRow();
  renumberSteps(isSticker);
  buildStage();
  updateModalTotals();

  const addBtn = document.querySelector('#modalBackdrop .add-btn');
  if(addBtn) addBtn.textContent = prefill ? 'Guardar cambios' : 'Agregar al carrito';

  document.getElementById('modalBackdrop').classList.remove('hidden');
}

function renumberSteps(isSticker){
  document.getElementById('sizeStepNum').textContent = isSticker ? '2' : '1';
  document.getElementById('uploadStepNum').textContent = isSticker ? '3' : '2';
  document.getElementById('notesStepNum').textContent = isSticker ? '4' : '3';
  document.getElementById('qtyStepNum').textContent = isSticker ? '5' : '4';
}

function hideModal(){
  document.getElementById('modalBackdrop').classList.add('hidden');
}

function closeModal(){
  if(modalState.image){
    const sure = confirm('Tienes una imagen subida sin agregar al carrito. ¿Seguro que quieres cerrar? Se va a perder.');
    if(!sure) return;
  }
  editingCartIndex = null;
  hideModal();
}

function renderSizeRow(){
  const row = document.getElementById('sizeRow');
  row.innerHTML = '';
  const list = modalState.type === 'sticker' ? STICKER_SIZES : POSTER_SIZES;
  const activeId = modalState.sizeId;
  list.forEach(s=>{
    const b = document.createElement('button');
    b.className = 'chip' + (s.id===activeId?' active':'');
    b.textContent = s.label;
    b.dataset.size = s.id;
    b.onclick = ()=>setSize(s.id);
    row.appendChild(b);
  });
}

function setMaterial(materialId){
  modalState.material = materialId;
  document.querySelectorAll('#materialField .chip').forEach(c=>c.classList.toggle('active', c.dataset.material===materialId));
  document.getElementById('modalDesc').textContent = STICKER_MATERIALS[materialId].desc;
  buildStage();
  updateModalTotals();
}

function setSize(id){
  modalState.sizeId = id;
  document.querySelectorAll('#sizeRow .chip').forEach(c=>c.classList.toggle('active', c.dataset.size===id));
  if(modalState.type === 'poster'){
    modalState.crop.offsetX = 0;
    modalState.crop.offsetY = 0;
    buildStage();
  }
  updateModalTotals();
  reevaluateResolutionWarning();
}

function setOrientation(mode){
  modalState.orientation = mode;
  document.querySelectorAll('#orientationField .chip').forEach(c=>c.classList.toggle('active', c.dataset.orient===mode));
  modalState.crop.offsetX = 0;
  modalState.crop.offsetY = 0;
  buildStage();
  updateModalTotals();
  reevaluateResolutionWarning();
}

function changeQty(delta){
  modalState.qty = Math.max(1, modalState.qty + delta);
  document.getElementById('qtyVal').textContent = modalState.qty;
  updateModalTotals();
}

/* ---------- marco de recorte del poster (tamaño real en cm y px en pantalla) ---------- */

function computeFrameDims(){
  const size = POSTER_SIZES.find(s=>s.id===modalState.sizeId) || POSTER_SIZES[0];
  const longSide = Math.max(size.wCm, size.hCm);
  const shortSide = Math.min(size.wCm, size.hCm);
  const wCm = modalState.orientation === 'horizontal' ? longSide : shortSide;
  const hCm = modalState.orientation === 'horizontal' ? shortSide : longSide;

  let wPx, hPx;
  if(wCm >= hCm){ wPx = FRAME_LONG_PX; hPx = FRAME_LONG_PX * hCm / wCm; }
  else { hPx = FRAME_LONG_PX; wPx = FRAME_LONG_PX * wCm / hCm; }

  return { wCm, hCm, wPx, hPx };
}

function buildStage(){
  const stage = document.getElementById('stage');
  stage.innerHTML = '';

  if(modalState.type === 'sticker'){
    const wrap = document.createElement('div');
    wrap.className = 'sticker-stage';
    wrap.innerHTML = renderStageInner();
    stage.appendChild(wrap);
  } else {
    const frameDims = computeFrameDims();
    const frame = document.createElement('div');
    frame.className = 'crop-frame';
    frame.id = 'cropFrame';
    frame.style.width = frameDims.wPx + 'px';
    frame.style.height = frameDims.hPx + 'px';
    frame.style.borderRadius = '6px';
    frame.innerHTML =
      '<div class="placeholder" id="placeholder"><div class="txt">Sube tu imagen</div></div>' +
      '<img class="crop-image" id="artworkImg" style="display:none">';
    stage.appendChild(frame);
    frame.addEventListener('mousedown', startCropDrag);
    frame.addEventListener('touchstart', startCropDrag, {passive:false});
  }
  refreshStageContent();
}

function renderStageInner(){
  const overlay = STICKER_MATERIALS[modalState.material].overlayClass;
  return '<div class="placeholder" id="placeholder"><div class="txt">Sube tu imagen</div></div>' +
         '<img class="artwork" id="artworkImg" style="display:none">' +
         '<div class="' + overlay + '" id="stageOverlay"></div>';
}

function refreshStageContent(){
  const placeholder = document.getElementById('placeholder');
  const img = document.getElementById('artworkImg');
  if(!placeholder || !img) return;

  if(modalState.type === 'sticker'){
    const stickerWrap = document.querySelector('.sticker-stage');
    if(modalState.image){
      img.src = modalState.image;
      img.style.display = 'block';
      placeholder.style.display = 'none';
      if(stickerWrap) stickerWrap.classList.add('has-image');
    } else {
      img.style.display = 'none';
      placeholder.style.display = 'flex';
      if(stickerWrap) stickerWrap.classList.remove('has-image');
    }
    return;
  }

  // poster: recortador interactivo
  document.getElementById('cropControlsField').style.display = modalState.image ? '' : 'none';

  if(!modalState.image){
    placeholder.style.display = 'flex';
    img.style.display = 'none';
    return;
  }

  placeholder.style.display = 'none';
  img.style.display = 'block';

  if(img.src !== modalState.image || !modalState.crop.natW){
    img.onload = () => {
      modalState.crop.natW = img.naturalWidth;
      modalState.crop.natH = img.naturalHeight;
      renderCropTransform();
    };
    img.src = modalState.image;
  } else {
    renderCropTransform();
  }
}

function renderCropTransform(){
  const img = document.getElementById('artworkImg');
  if(!img || modalState.type !== 'poster' || !modalState.crop.natW) return;

  const frameDims = computeFrameDims();
  const rot = modalState.crop.rotation;
  const swapped = (rot === 90 || rot === 270);
  const effW = swapped ? modalState.crop.natH : modalState.crop.natW;
  const effH = swapped ? modalState.crop.natW : modalState.crop.natH;

  const baseScale = Math.max(frameDims.wPx / effW, frameDims.hPx / effH);
  const zoomFactor = modalState.crop.zoom;
  const displayW = modalState.crop.natW * baseScale * zoomFactor;
  const displayH = modalState.crop.natH * baseScale * zoomFactor;

  // no dejar espacios vacíos dentro del marco al arrastrar
  const rotDisplayW = swapped ? displayH : displayW;
  const rotDisplayH = swapped ? displayW : displayH;
  const maxOffsetX = Math.max(0, (rotDisplayW - frameDims.wPx) / 2);
  const maxOffsetY = Math.max(0, (rotDisplayH - frameDims.hPx) / 2);
  modalState.crop.offsetX = Math.min(maxOffsetX, Math.max(-maxOffsetX, modalState.crop.offsetX));
  modalState.crop.offsetY = Math.min(maxOffsetY, Math.max(-maxOffsetY, modalState.crop.offsetY));

  img.style.width = displayW + 'px';
  img.style.height = displayH + 'px';
  img.style.transform =
    'translate(-50%, -50%) translate(' + modalState.crop.offsetX + 'px, ' + modalState.crop.offsetY + 'px) rotate(' + rot + 'deg)';
}

function rotateCropImage(){
  modalState.crop.rotation = (modalState.crop.rotation + 90) % 360;
  renderCropTransform();
}

function onZoomChange(val){
  modalState.crop.zoom = Number(val) / 100;
  renderCropTransform();
}

function startCropDrag(e){
  cropDrag.active = true;
  const frame = document.getElementById('cropFrame');
  if(frame) frame.classList.add('dragging');
  const p = e.touches ? e.touches[0] : e;
  cropDrag.startX = p.clientX;
  cropDrag.startY = p.clientY;
  cropDrag.baseOffsetX = modalState.crop.offsetX;
  cropDrag.baseOffsetY = modalState.crop.offsetY;
  e.preventDefault();
}

function moveCropDrag(e){
  if(!cropDrag.active) return;
  const p = e.touches ? e.touches[0] : e;
  modalState.crop.offsetX = cropDrag.baseOffsetX + (p.clientX - cropDrag.startX);
  modalState.crop.offsetY = cropDrag.baseOffsetY + (p.clientY - cropDrag.startY);
  renderCropTransform();
}

function endCropDrag(){
  if(!cropDrag.active) return;
  cropDrag.active = false;
  const frame = document.getElementById('cropFrame');
  if(frame) frame.classList.remove('dragging');
}

// Genera la imagen final tal como se ve en el marco (con el recorte, zoom
// y rotación aplicados), lista para enviar al pedido.
function exportCroppedImage(){
  const img = document.getElementById('artworkImg');
  if(!img || !modalState.crop.natW) return modalState.image;

  const frameDims = computeFrameDims();
  const rot = modalState.crop.rotation;
  const swapped = (rot === 90 || rot === 270);
  const effW = swapped ? modalState.crop.natH : modalState.crop.natW;
  const effH = swapped ? modalState.crop.natW : modalState.crop.natH;
  const baseScale = Math.max(frameDims.wPx / effW, frameDims.hPx / effH);
  const zoomFactor = modalState.crop.zoom;
  const displayW = modalState.crop.natW * baseScale * zoomFactor;
  const displayH = modalState.crop.natH * baseScale * zoomFactor;

  let outW, outH;
  if(frameDims.wCm >= frameDims.hCm){
    outW = CROP_EXPORT_LONG_PX;
    outH = Math.round(CROP_EXPORT_LONG_PX * frameDims.hCm / frameDims.wCm);
  } else {
    outH = CROP_EXPORT_LONG_PX;
    outW = Math.round(CROP_EXPORT_LONG_PX * frameDims.wCm / frameDims.hCm);
  }

  const scaleFactor = outW / frameDims.wPx;

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');

  ctx.save();
  ctx.translate(outW / 2 + modalState.crop.offsetX * scaleFactor, outH / 2 + modalState.crop.offsetY * scaleFactor);
  ctx.rotate(rot * Math.PI / 180);
  ctx.drawImage(img, -(displayW * scaleFactor) / 2, -(displayH * scaleFactor) / 2, displayW * scaleFactor, displayH * scaleFactor);
  ctx.restore();

  return canvas.toDataURL('image/jpeg', 0.92);
}

function updateModalTotals(){
  let price, sizeLabel;
  if(modalState.type === 'sticker'){
    const size = STICKER_SIZES.find(s=>s.id===modalState.sizeId) || STICKER_SIZES[1];
    price = STICKER_MATERIALS[modalState.material].basePrice * size.mult * modalState.qty;
    sizeLabel = size.label;
  } else {
    const size = POSTER_SIZES.find(s=>s.id===modalState.sizeId) || POSTER_SIZES[0];
    const frameDims = computeFrameDims();
    price = size.price * modalState.qty;
    sizeLabel = formatCm(frameDims.wCm) + ' x ' + formatCm(frameDims.hCm) + ' cm';
  }
  document.getElementById('priceVal').textContent = formatCLP(price);

  const tag = modalState.type === 'sticker'
    ? 'Sticker · ' + STICKER_MATERIALS[modalState.material].label + ' · ' + sizeLabel
    : 'Poster · ' + sizeLabel + ' · ' + (modalState.orientation === 'horizontal' ? 'Horizontal' : 'Vertical');
  document.getElementById('previewTag').textContent = tag;
}

function handleFile(file){
  if(!file || !file.type.startsWith('image/')) return;
  const reader = new FileReader();
  reader.onload = (e)=>{
    modalState.image = e.target.result;
    if(modalState.type === 'poster'){
      modalState.crop = { rotation:0, zoom:1, offsetX:0, offsetY:0, natW:0, natH:0 };
      document.getElementById('cropZoom').value = 100;
    }
    checkImageResolution(e.target.result);
    refreshStageContent();
  };
  reader.readAsDataURL(file);
}

/* ---------- aviso de baja resolución ---------- */
const MIN_PRINT_DPI = 150;

function checkImageResolution(dataUrl){
  const img = new Image();
  img.onload = () => {
    modalState.uploadedNatW = img.naturalWidth;
    modalState.uploadedNatH = img.naturalHeight;
    reevaluateResolutionWarning();
  };
  img.src = dataUrl;
}

function reevaluateResolutionWarning(){
  const warningEl = document.getElementById('resWarning');
  if(!warningEl) return;
  if(!modalState.uploadedNatW){
    warningEl.style.display = 'none';
    return;
  }

  let targetCm;
  if(modalState.type === 'sticker'){
    const size = STICKER_SIZES.find(s=>s.id===modalState.sizeId) || STICKER_SIZES[1];
    targetCm = size.cm;
  } else {
    const frameDims = computeFrameDims();
    targetCm = Math.max(frameDims.wCm, frameDims.hCm);
  }

  const minPx = Math.round((targetCm / 2.54) * MIN_PRINT_DPI);
  const longSide = Math.max(modalState.uploadedNatW, modalState.uploadedNatH);
  warningEl.style.display = longSide < minPx ? '' : 'none';
}

function addToCart(){
  if(!modalState.image){
    alert('Sube una imagen antes de agregar el producto al carrito.');
    return;
  }
  if(!document.getElementById('termsCheck').checked){
    alert('Debes aceptar los Términos y Condiciones antes de agregar el producto al carrito.');
    return;
  }
  modalState.notes = document.getElementById('notesInput').value.trim();

  let price, meta, name, swatchClass, boxWcm, boxHcm, materialLabel, finalImage, materialId, sizeId;
  if(modalState.type === 'sticker'){
    const size = STICKER_SIZES.find(s=>s.id===modalState.sizeId) || STICKER_SIZES[1];
    const mat = STICKER_MATERIALS[modalState.material];
    price = mat.basePrice * size.mult * modalState.qty;
    meta = mat.label + ' · ' + size.label;
    name = 'Sticker';
    swatchClass = mat.swatchClass;
    boxWcm = size.cm;
    boxHcm = size.cm;
    materialLabel = mat.label;
    materialId = modalState.material;
    sizeId = size.id;
    finalImage = modalState.image;
  } else {
    const size = POSTER_SIZES.find(s=>s.id===modalState.sizeId) || POSTER_SIZES[0];
    const frameDims = computeFrameDims();
    price = size.price * modalState.qty;
    meta = formatCm(frameDims.wCm) + ' x ' + formatCm(frameDims.hCm) + ' cm · ' + (modalState.orientation === 'horizontal' ? 'Horizontal' : 'Vertical');
    name = 'Poster';
    swatchClass = 'swatch-posterA';
    boxWcm = frameDims.wCm;
    boxHcm = frameDims.hCm;
    materialLabel = '';
    materialId = null;
    sizeId = size.id;
    finalImage = modalState.image ? exportCroppedImage() : null;
  }

  const cartItem = {
    type: modalState.type,
    material: materialLabel,
    materialId, sizeId,
    orientation: modalState.orientation,
    name, meta,
    notes: modalState.notes,
    qty: modalState.qty,
    price,
    image: finalImage,
    swatchClass,
    boxWcm, boxHcm
  };

  if(editingCartIndex !== null){
    cart[editingCartIndex] = cartItem;
    editingCartIndex = null;
  } else {
    cart.push(cartItem);
  }

  renderCart();
  hideModal();
  toggleCart(true);
}

/* ---------- carrito ---------- */

function showView(name){
  document.getElementById('cartView').style.display = name === 'cart' ? 'flex' : 'none';
  document.getElementById('checkoutView').style.display = name === 'checkout' ? 'flex' : 'none';
  document.getElementById('confirmationView').style.display = name === 'confirmation' ? 'flex' : 'none';
}

function toggleCart(open){
  document.getElementById('cartDrawer').classList.toggle('open', open);
  document.getElementById('cartBackdrop').classList.toggle('open', open);
  if(open) showView('cart');
  updateFloatingCartBtn();
}

let lastRemoved = null;
let undoTimeout = null;

function removeCartItem(index){
  lastRemoved = { item: cart[index], index };
  cart.splice(index, 1);
  renderCart();
  showUndoToast();
}

function editCartItem(index){
  const item = cart[index];
  if(!item) return;
  editingCartIndex = index;
  toggleCart(false);
  openModal(item.type, item);
}

function showUndoToast(){
  document.getElementById('undoToast').classList.add('show');
  clearTimeout(undoTimeout);
  undoTimeout = setTimeout(()=>{
    document.getElementById('undoToast').classList.remove('show');
    lastRemoved = null;
  }, 5000);
}

function undoRemoveItem(){
  if(!lastRemoved) return;
  cart.splice(lastRemoved.index, 0, lastRemoved.item);
  lastRemoved = null;
  clearTimeout(undoTimeout);
  document.getElementById('undoToast').classList.remove('show');
  renderCart();
}

function updateFloatingCartBtn(){
  const btn = document.getElementById('floatingCartBtn');
  if(!btn) return;
  const drawer = document.getElementById('cartDrawer');
  const isDrawerOpen = drawer && drawer.classList.contains('open');

  if(cart.length === 0 || isDrawerOpen){
    btn.style.display = 'none';
    return;
  }
  document.getElementById('floatingCartCount').textContent = cart.length;
  btn.style.display = 'flex';
}

function renderCart(){
  const wrap = document.getElementById('cartItems');
  document.getElementById('cartBadge').textContent = cart.length;

  if(cart.length === 0){
    wrap.innerHTML = '<div class="cart-empty">Todavía no agregaste ningún producto.</div>';
    document.getElementById('cartTotal').textContent = '$0';
    updateFloatingCartBtn();
    return;
  }

  wrap.innerHTML = '';
  let total = 0;
  cart.forEach((item, i)=>{
    total += item.price;
    const row = document.createElement('div');
    row.className = 'cart-item';

    const thumb = document.createElement('div');
    thumb.className = 'thumb';
    if(item.image){
      const img = document.createElement('img');
      img.src = item.image;
      thumb.appendChild(img);
    } else {
      const sw = document.createElement('div');
      sw.className = item.swatchClass;
      sw.style.position='absolute'; sw.style.inset='0';
      thumb.appendChild(sw);
    }

    const canEdit = item.type === 'sticker' || item.type === 'poster';
    const info = document.createElement('div');
    info.className = 'info';
    info.innerHTML =
      '<div class="name">' + item.name + ' x' + item.qty + '</div>' +
      '<div class="meta">' + item.meta + '</div>' +
      (item.notes ? '<div class="notes">"' + escapeHtml(item.notes) + '"</div>' : '') +
      '<div class="row-bottom"><span class="price">' + formatCLP(item.price) + '</span>' +
      '<span>' + (canEdit ? '<button class="remove-btn" onclick="editCartItem(' + i + ')">Editar</button> · ' : '') +
      '<button class="remove-btn" onclick="removeCartItem(' + i + ')">Quitar</button></span></div>';

    row.appendChild(thumb);
    row.appendChild(info);
    wrap.appendChild(row);
  });

  document.getElementById('cartTotal').textContent = formatCLP(total);
  updateFloatingCartBtn();
}

function escapeHtml(str){
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/* ---------- checkout: datos del cliente + pago ---------- */

/* ⚠️ Ajusta este valor al costo real de tu envío a domicilio dentro de Valdivia */
const DELIVERY_FEE = 1500;

/* ⚠️ Monto mínimo de compra (sin contar el envío) */
const MIN_ORDER_TOTAL = 2000;

let checkoutState = { delivery: 'retiro' };
let countdownInterval = null;

function getCartSubtotal(){
  return cart.reduce((sum, item) => sum + item.price, 0);
}

function updateCheckoutTotal(){
  const subtotal = getCartSubtotal();
  const fee = checkoutState.delivery === 'envio' ? DELIVERY_FEE : 0;
  const feeRow = document.getElementById('deliveryFeeRow');

  if(fee > 0){
    feeRow.style.display = '';
    document.getElementById('deliveryFeeVal').textContent = formatCLP(fee);
  } else {
    feeRow.style.display = 'none';
  }

  document.getElementById('checkoutTotal').textContent = formatCLP(subtotal + fee);
}

function goToCheckout(){
  if(cart.length === 0){
    alert('Tu carrito está vacío. Agrega al menos un producto antes de continuar.');
    return;
  }
  const subtotal = getCartSubtotal();
  if(subtotal < MIN_ORDER_TOTAL){
    alert('La compra mínima es de ' + formatCLP(MIN_ORDER_TOTAL) + '. Te faltan ' + formatCLP(MIN_ORDER_TOTAL - subtotal) + ' para poder continuar.');
    return;
  }
  updateCheckoutTotal();
  showView('checkout');
}

function backToCart(){
  showView('cart');
}

function setDelivery(mode){
  checkoutState.delivery = mode;
  document.querySelectorAll('#checkoutView .chip[data-delivery]').forEach(c=>c.classList.toggle('active', c.dataset.delivery === mode));
  const addressField = document.getElementById('addressField');
  const hint = document.getElementById('deliveryHint');
  if(mode === 'envio'){
    addressField.style.display = '';
    hint.textContent = 'Coordinamos el envío dentro de Valdivia una vez confirmado el pago. Tiene un costo adicional de ' + formatCLP(DELIVERY_FEE) + '.';
  } else {
    addressField.style.display = 'none';
    hint.textContent = 'Coordinamos el punto y horario de retiro por Instagram.';
  }
  updateCheckoutTotal();
}

async function buildOrderPayload(){
  if(cart.length === 0) return null;
  let total = 0;
  const items = [];

  for(const item of cart){
    total += item.price;
    items.push({
      type: item.type,
      stockId: item.stockId,
      name: item.name,
      material: item.material,
      materialId: item.materialId,
      sizeId: item.sizeId,
      meta: item.meta,
      notes: item.notes,
      qty: item.qty,
      price: item.price,
      image: item.image,
      boxWcm: item.boxWcm,
      boxHcm: item.boxHcm
    });
  }

  return {
    secret: SHARED_SECRET,
    orderNumber: (document.getElementById('receiptNumber') || {}).textContent || '',
    date: (document.getElementById('receiptDate') || {}).textContent || '',
    items,
    subtotal: total,
    deliveryFee: 0,
    total: formatCLP(total)
  };
}

function sendOrderToGoogleDoc(payload){
  if(!APPS_SCRIPT_URL) return Promise.resolve({skipped:true});
  return fetch(APPS_SCRIPT_URL, {
    method:'POST',
    headers:{'Content-Type':'text/plain;charset=utf-8'},
    body: JSON.stringify(payload)
  })
    .then(res=>res.json())
    .catch(err=>{ console.error('Error enviando el pedido al documento de Google:', err); return {ok:false, error:err}; });
}

// Vuelve a consultar el stock real (no el que se cargó cuando abriste la
// página) justo antes de confirmar, para reducir el riesgo de que dos
// personas compren el mismo último producto casi al mismo tiempo.
// Devuelve null si todo está bien, o un mensaje de error si algo ya no alcanza.
async function checkLiveStockAvailability(){
  const stockCartItems = cart.filter(item => item.type === 'stock');
  if(stockCartItems.length === 0 || !APPS_SCRIPT_URL) return null;

  try {
    const res = await fetch(APPS_SCRIPT_URL + '?action=stock');
    const data = await res.json();
    const liveItems = (data && data.items) || [];

    for(const cartItem of stockCartItems){
      const live = liveItems.find(s => s.id === cartItem.stockId);
      const liveQty = live ? (Number(live.qty) || 0) : 0;
      if(cartItem.qty > liveQty){
        return liveQty > 0
          ? 'Ya no queda suficiente stock de "' + cartItem.name + '" (quedan ' + liveQty + '). Ajusta la cantidad en tu carrito antes de continuar.'
          : '"' + cartItem.name + '" se agotó justo ahora. Quítalo de tu carrito para poder continuar.';
      }
    }
    return null;
  } catch(err){
    console.error('No se pudo revisar el stock en vivo:', err);
    return null; // si falla la revisión por un problema de red, no bloqueamos al cliente por eso
  }
}

async function confirmOrder(){
  if(getCartSubtotal() < MIN_ORDER_TOTAL){
    alert('La compra mínima es de ' + formatCLP(MIN_ORDER_TOTAL) + '.');
    showView('cart');
    return;
  }

  const name = document.getElementById('custName').value.trim();
  const phoneRaw = document.getElementById('custPhone').value.trim();
  const instagramRaw = document.getElementById('custInstagram').value.trim();
  const phone = phoneRaw ? '+56 ' + phoneRaw : '';
  const instagram = instagramRaw ? '@' + instagramRaw.replace(/^@/, '') : '';
  const address = document.getElementById('custAddress').value.trim();
  const email = document.getElementById('custEmail').value.trim();

  if(!name || !phone || !instagram || !email){
    alert('Completa tu nombre, teléfono, Instagram y email antes de continuar.');
    return;
  }
  if(checkoutState.delivery === 'envio' && !address){
    alert('Ingresa tu dirección en Valdivia para coordinar el envío.');
    return;
  }

  const btn = document.getElementById('confirmOrderBtn');
  btn.disabled = true;
  btn.textContent = 'Revisando stock...';

  const stockError = await checkLiveStockAvailability();
  if(stockError){
    btn.disabled = false;
    btn.textContent = 'Confirmar pedido';
    alert(stockError);
    showView('cart');
    return;
  }

  btn.textContent = 'Enviando...';

  const payload = await buildOrderPayload();
  if(!payload){
    btn.disabled = false;
    btn.textContent = 'Confirmar pedido';
    return;
  }

  const fee = checkoutState.delivery === 'envio' ? DELIVERY_FEE : 0;
  payload.deliveryFee = fee;
  payload.total = formatCLP(payload.subtotal + fee);

  payload.customer = {
    name, phone, instagram, email,
    delivery: checkoutState.delivery === 'envio' ? 'Envío a domicilio (Valdivia)' : 'Retiro en Valdivia',
    address: checkoutState.delivery === 'envio' ? address : ''
  };

  sendOrderToGoogleDoc(payload).finally(()=>{
    btn.disabled = false;
    btn.textContent = 'Confirmar pedido';
    document.getElementById('confirmOrderNumber').textContent = (document.getElementById('receiptNumber') || {}).textContent || '';
    showView('confirmation');
    startCountdown(30 * 60);
    cart = [];
    renderCart();
  });
}

function startCountdown(seconds){
  clearInterval(countdownInterval);
  const el = document.getElementById('countdownTimer');
  el.classList.remove('expired');
  let remaining = seconds;

  function render(){
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    el.textContent = String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
    if(remaining <= 0){
      el.classList.add('expired');
      clearInterval(countdownInterval);
    }
  }

  render();
  countdownInterval = setInterval(()=>{
    remaining--;
    render();
  }, 1000);
}

function openInstagramForProof(){
  window.open('https://ig.me/m/' + IG_USERNAME, '_blank');
}

function closeConfirmation(){
  clearInterval(countdownInterval);
  toggleCart(false);
}

/* ---------- upload dropzone (compartido por el modal) ---------- */

function initUploader(){
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('fileInput');

  dropzone.addEventListener('click', (e)=>{
    if(e.target.tagName !== 'BUTTON') fileInput.click();
  });
  dropzone.addEventListener('dragover', (e)=>{
    e.preventDefault();
    dropzone.classList.add('dragging');
  });
  dropzone.addEventListener('dragleave', ()=>{
    dropzone.classList.remove('dragging');
  });
  dropzone.addEventListener('drop', (e)=>{
    e.preventDefault();
    dropzone.classList.remove('dragging');
    const file = e.dataTransfer.files[0];
    handleFile(file);
  });
  fileInput.addEventListener('change', (e)=>{
    handleFile(e.target.files[0]);
  });
}

/* ---------- estrellas siguiendo el mouse en toda la página ---------- */

function initGlobalSparkles(){
  const layer = document.getElementById('sparkleLayer');
  if(!layer) return;
  const colors = ['#FF5DA8', '#5FD6FF', '#FFE066', '#B15CFF'];
  const glyphs = ['✦', '✧', '⋆'];
  let lastTime = 0;

  function spawnSparkle(x, y){
    const s = document.createElement('span');
    s.className = 'cursor-sparkle';
    s.textContent = glyphs[Math.floor(Math.random()*glyphs.length)];
    s.style.left = x + 'px';
    s.style.top = y + 'px';
    s.style.color = colors[Math.floor(Math.random()*colors.length)];
    s.style.fontSize = (12 + Math.random()*10) + 'px';
    layer.appendChild(s);
    setTimeout(()=> s.remove(), 700);
  }

  document.addEventListener('mousemove', (e)=>{
    const now = Date.now();
    if(now - lastTime < 70) return;
    lastTime = now;
    spawnSparkle(e.clientX, e.clientY);
  });
}

/* ---------- datos de la boleta (número y fecha) ---------- */

function initReceiptMeta(){
  const numEl = document.getElementById('receiptNumber');
  const dateEl = document.getElementById('receiptDate');
  if(!numEl || !dateEl) return;
  const num = String(Math.floor(1000 + Math.random()*9000));
  numEl.textContent = 'N° ' + num;
  const today = new Date();
  const dd = String(today.getDate()).padStart(2,'0');
  const mm = String(today.getMonth()+1).padStart(2,'0');
  dateEl.textContent = dd + '/' + mm + '/' + today.getFullYear();
}

/* ---------- stock disponible (sincronizado con Google Sheets) ---------- */

let stockItems = [];
let stockModalState = { item: null, qty: 1, galleryIndex: 0 };

function loadStock(){
  const grid = document.getElementById('stockGrid');
  if(!APPS_SCRIPT_URL){
    grid.innerHTML = '<div class="stock-empty">El stock todavía no está conectado.</div>';
    return;
  }

  fetch(APPS_SCRIPT_URL + '?action=stock')
    .then(res => res.json())
    .then(data => {
      if(data && data.error){
        console.error('Error del Apps Script al leer el stock:', data.error);
        grid.innerHTML = '<div class="stock-empty">Error leyendo el stock: ' + escapeHtml(data.error) + '</div>';
        return;
      }
      stockItems = (data && data.items) || [];
      renderStockGrid();
    })
    .catch(err => {
      console.error('Error cargando el stock:', err);
      grid.innerHTML = '<div class="stock-empty">No se pudo cargar el stock. Intenta recargar la página.</div>';
    });
}

function renderStockGrid(){
  const grid = document.getElementById('stockGrid');
  if(stockItems.length === 0){
    grid.innerHTML = '<div class="stock-empty">Por ahora no hay stock disponible — mira el catálogo personalizable arriba.</div>';
    return;
  }

  grid.innerHTML = '';
  stockItems.forEach(item=>{
    const qty = Number(item.qty) || 0;
    const card = document.createElement('button');
    card.className = 'stock-card' + (qty <= 0 ? ' is-out' : '');
    card.onclick = () => openStockModal(item.id);

    const tagClass = qty <= 0 ? 'out-stock' : (qty <= 2 ? 'low-stock' : 'in-stock');
    const tagText = qty <= 0 ? 'Agotado' : ('Disponibles: ' + qty);

    card.innerHTML =
      '<div class="stock-thumb"><img src="' + (item.image1 || '') + '" alt="' + escapeHtml(item.name || '') + '"></div>' +
      '<h3>' + escapeHtml(item.name || '') + '</h3>' +
      '<span class="stock-qty-tag ' + tagClass + '">' + tagText + '</span>' +
      '<span class="stock-price">' + formatCLP(Number(item.price) || 0) + '</span>';

    grid.appendChild(card);
  });
}

function openStockModal(id){
  const item = stockItems.find(s => s.id === id);
  if(!item) return;

  stockModalState = { item, qty: 1, galleryIndex: 0 };

  document.getElementById('stockName').textContent = item.name || '';
  document.getElementById('stockFinish').textContent = item.finish || '—';
  document.getElementById('stockSize').textContent = item.size || '—';
  document.getElementById('stockQtyVal').textContent = 1;

  const qtyAvail = Number(item.qty) || 0;
  document.getElementById('stockAvailability').textContent =
    qtyAvail > 0 ? 'Disponibles: ' + qtyAvail : 'Agotado';

  const addBtn = document.getElementById('stockAddBtn');
  addBtn.disabled = qtyAvail <= 0;
  addBtn.textContent = qtyAvail <= 0 ? 'Agotado' : 'Agregar al carrito';

  renderStockGallery();
  updateStockTotals();

  document.getElementById('stockModalBackdrop').classList.remove('hidden');
}

function closeStockModal(){
  document.getElementById('stockModalBackdrop').classList.add('hidden');
}

/* ---------- modal de términos y condiciones ---------- */

function openTermsModal(){
  document.getElementById('termsModalBackdrop').classList.remove('hidden');
}

function closeTermsModal(){
  document.getElementById('termsModalBackdrop').classList.add('hidden');
}

function renderStockGallery(){
  const item = stockModalState.item;
  const images = [item.image1, item.image2].filter(Boolean);
  if(images.length === 0) images.push('');

  const idx = stockModalState.galleryIndex % images.length;
  document.getElementById('stockGalleryImg').src = images[idx];
  document.getElementById('stockGalleryImg').alt = item.name || '';

  const dots = document.getElementById('stockGalleryDots');
  dots.innerHTML = '';
  if(images.length > 1){
    images.forEach((img, i)=>{
      const dot = document.createElement('button');
      dot.className = 'dot' + (i === idx ? ' active' : '');
      dot.onclick = () => { stockModalState.galleryIndex = i; renderStockGallery(); };
      dots.appendChild(dot);
    });
  }
}

function changeStockQty(delta){
  const maxQty = Number(stockModalState.item.qty) || 0;
  stockModalState.qty = Math.max(1, Math.min(maxQty, stockModalState.qty + delta));
  document.getElementById('stockQtyVal').textContent = stockModalState.qty;
  updateStockTotals();
}

function updateStockTotals(){
  const price = (Number(stockModalState.item.price) || 0) * stockModalState.qty;
  document.getElementById('stockPriceVal').textContent = formatCLP(price);
}

function addStockToCart(){
  const item = stockModalState.item;
  const qtyAvail = Number(item.qty) || 0;
  if(qtyAvail <= 0) return;

  const images = [item.image1, item.image2].filter(Boolean);

  cart.push({
    type: 'stock',
    stockId: item.id,
    material: item.finish || '',
    name: item.name,
    meta: (item.finish || '') + (item.finish && item.size ? ' · ' : '') + (item.size || ''),
    notes: '',
    qty: stockModalState.qty,
    price: (Number(item.price) || 0) * stockModalState.qty,
    image: images[0] || null,
    swatchClass: 'swatch-mate'
  });

  renderCart();
  closeStockModal();
  toggleCart(true);
}



document.addEventListener('DOMContentLoaded', ()=>{
  initUploader();
  renderCart();
  initGlobalSparkles();
  initReceiptMeta();
  loadStock();

  // Listeners globales del recortador de poster (se agregan una sola vez;
  // cropDrag.active controla si realmente hay que mover algo)
  window.addEventListener('mousemove', moveCropDrag);
  window.addEventListener('mouseup', endCropDrag);
  window.addEventListener('touchmove', moveCropDrag, {passive:false});
  window.addEventListener('touchend', endCropDrag);
});
