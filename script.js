/* ⚠️ Reemplaza esto por tu usuario real de Instagram (sin @) */
const IG_USERNAME = 'nikkoppon';

const STICKER_MATERIALS = {
  mate:{ label:'Mate', desc:'Sin reflejos, textura suave al tacto. Ideal para un look minimalista.', basePrice:2000, overlayClass:'overlay mate', swatchClass:'swatch-mate' },
  tornasol:{ label:'Tornasol', desc:'Cambia de color según la luz. El más llamativo para destacar tu diseño.', basePrice:2500, overlayClass:'overlay tornasol', swatchClass:'swatch-tornasol' },
  brillante:{ label:'Brillante', desc:'Superficie vibrante que resalta los colores de tu imagen.', basePrice:2200, overlayClass:'overlay brillante', swatchClass:'swatch-brillante' }
};

const STICKER_SIZES = [
  {id:'s', label:'5 cm', mult:1},
  {id:'m', label:'8 cm', mult:1.4},
  {id:'l', label:'12 cm', mult:1.9}
];

const POSTER_SIZES = [
  {id:'a4', label:'A4 (21 x 29,7 cm)', price:6000, ratio:'210/297'},
  {id:'10x15', label:'10 x 15 cm', price:3500, ratio:'100/150'}
];

let cart = [];

let modalState = {
  type:null, material:'mate', sizeId:null, qty:1, image:null, notes:''
};

function formatCLP(n){
  return '$' + Math.round(n).toLocaleString('es-CL');
}

/* ---------- modal ---------- */

function openModal(type){
  modalState = { type, material:'mate', sizeId: type==='sticker' ? 'm' : 'a4', qty:1, image:null, notes:'' };
  document.getElementById('notesInput').value = '';

  const isSticker = type === 'sticker';
  document.getElementById('materialField').style.display = isSticker ? '' : 'none';
  document.getElementById('modalWindowTitle').textContent = isSticker ? 'STICKER.EXE' : 'POSTER.EXE';

  if(isSticker){
    const mat = STICKER_MATERIALS[modalState.material];
    document.getElementById('modalEyebrow').textContent = 'Personalizable';
    document.getElementById('modalTitle').textContent = 'Sticker';
    document.getElementById('modalDesc').textContent = mat.desc;
    document.querySelectorAll('#materialField .chip').forEach(c=>c.classList.toggle('active', c.dataset.material==='mate'));
  } else {
    document.getElementById('modalEyebrow').textContent = 'Personalizable';
    document.getElementById('modalTitle').textContent = 'Poster';
    document.getElementById('modalDesc').textContent = 'Disponible en A4 o 10 x 15 cm. Sube tu imagen y listo.';
  }

  renderSizeRow();
  renumberSteps(isSticker);
  buildStage();
  updateModalTotals();

  document.getElementById('modalBackdrop').classList.remove('hidden');
}

function renumberSteps(isSticker){
  document.getElementById('sizeStepNum').textContent = isSticker ? '2' : '1';
  document.getElementById('uploadStepNum').textContent = isSticker ? '3' : '2';
  document.getElementById('notesStepNum').textContent = isSticker ? '4' : '3';
  document.getElementById('qtyStepNum').textContent = isSticker ? '5' : '4';
}

function closeModal(){
  document.getElementById('modalBackdrop').classList.add('hidden');
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
    buildStage();
  }
  updateModalTotals();
}

function changeQty(delta){
  modalState.qty = Math.max(1, modalState.qty + delta);
  document.getElementById('qtyVal').textContent = modalState.qty;
  updateModalTotals();
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
    const size = POSTER_SIZES.find(s=>s.id===modalState.sizeId) || POSTER_SIZES[0];
    const frame = document.createElement('div');
    frame.className = 'poster-die';
    frame.style.aspectRatio = size.ratio;
    const inner = document.createElement('div');
    inner.className = 'poster-inner';
    inner.innerHTML = renderStageInner();
    frame.appendChild(inner);
    stage.appendChild(frame);
  }
  refreshStageContent();
}

function renderStageInner(){
  const overlay = modalState.type === 'sticker' ? STICKER_MATERIALS[modalState.material].overlayClass : null;
  return '<div class="placeholder" id="placeholder"><div class="txt">Sube tu imagen</div></div>' +
         '<img class="artwork" id="artworkImg" style="display:none">' +
         (overlay ? '<div class="' + overlay + '" id="stageOverlay"></div>' : '');
}

function refreshStageContent(){
  const placeholder = document.getElementById('placeholder');
  const img = document.getElementById('artworkImg');
  if(!placeholder || !img) return;
  const stickerWrap = modalState.type === 'sticker' ? document.querySelector('.sticker-stage') : null;
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
}

function updateModalTotals(){
  let price, sizeLabel;
  if(modalState.type === 'sticker'){
    const size = STICKER_SIZES.find(s=>s.id===modalState.sizeId) || STICKER_SIZES[1];
    price = STICKER_MATERIALS[modalState.material].basePrice * size.mult * modalState.qty;
    sizeLabel = size.label;
  } else {
    const size = POSTER_SIZES.find(s=>s.id===modalState.sizeId) || POSTER_SIZES[0];
    price = size.price * modalState.qty;
    sizeLabel = size.label;
  }
  document.getElementById('priceVal').textContent = formatCLP(price);

  const tag = modalState.type === 'sticker'
    ? 'Sticker · ' + STICKER_MATERIALS[modalState.material].label + ' · ' + sizeLabel
    : 'Poster · ' + sizeLabel;
  document.getElementById('previewTag').textContent = tag;
}

function handleFile(file){
  if(!file || !file.type.startsWith('image/')) return;
  const reader = new FileReader();
  reader.onload = (e)=>{
    modalState.image = e.target.result;
    refreshStageContent();
  };
  reader.readAsDataURL(file);
}

function addToCart(){
  modalState.notes = document.getElementById('notesInput').value.trim();

  let price, meta, name, swatchClass;
  if(modalState.type === 'sticker'){
    const size = STICKER_SIZES.find(s=>s.id===modalState.sizeId) || STICKER_SIZES[1];
    const mat = STICKER_MATERIALS[modalState.material];
    price = mat.basePrice * size.mult * modalState.qty;
    meta = mat.label + ' · ' + size.label;
    name = 'Sticker';
    swatchClass = mat.swatchClass;
  } else {
    const size = POSTER_SIZES.find(s=>s.id===modalState.sizeId) || POSTER_SIZES[0];
    price = size.price * modalState.qty;
    meta = size.label;
    name = 'Poster';
    swatchClass = 'swatch-posterA';
  }

  cart.push({
    name, meta,
    notes: modalState.notes,
    qty: modalState.qty,
    price,
    image: modalState.image,
    swatchClass
  });

  renderCart();
  closeModal();
  toggleCart(true);
}

/* ---------- carrito ---------- */

function toggleCart(open){
  document.getElementById('cartDrawer').classList.toggle('open', open);
  document.getElementById('cartBackdrop').classList.toggle('open', open);
}

function removeCartItem(index){
  cart.splice(index, 1);
  renderCart();
}

function renderCart(){
  const wrap = document.getElementById('cartItems');
  document.getElementById('cartBadge').textContent = cart.length;

  if(cart.length === 0){
    wrap.innerHTML = '<div class="cart-empty">Todavía no agregaste ningún producto.</div>';
    document.getElementById('cartTotal').textContent = '$0';
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

    const info = document.createElement('div');
    info.className = 'info';
    info.innerHTML =
      '<div class="name">' + item.name + ' x' + item.qty + '</div>' +
      '<div class="meta">' + item.meta + '</div>' +
      (item.notes ? '<div class="notes">"' + escapeHtml(item.notes) + '"</div>' : '') +
      '<div class="row-bottom"><span class="price">' + formatCLP(item.price) + '</span>' +
      '<button class="remove-btn" onclick="removeCartItem(' + i + ')">Quitar</button></div>';

    row.appendChild(thumb);
    row.appendChild(info);
    wrap.appendChild(row);
  });

  document.getElementById('cartTotal').textContent = formatCLP(total);
}

function escapeHtml(str){
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function toggleTransfer(){
  document.getElementById('transferBox').classList.toggle('open');
}

/* ---------- enviar pedido por instagram ---------- */

function buildOrderSummary(){
  if(cart.length === 0) return null;
  let lines = ['Hola! Quiero hacer este pedido:', ''];
  let total = 0;
  cart.forEach((item, i)=>{
    total += item.price;
    lines.push((i+1) + '. ' + item.name + ' x' + item.qty + ' — ' + item.meta + ' — ' + formatCLP(item.price));
    if(item.notes) lines.push('   Observación: ' + item.notes);
    if(item.image) lines.push('   (imagen adjunta: pedido-' + (i+1) + '-' + item.name.toLowerCase() + '.jpg)');
  });
  lines.push('', 'Total: ' + formatCLP(total));
  return lines.join('\n');
}

function downloadCartImages(){
  cart.forEach((item, i)=>{
    if(!item.image) return;
    setTimeout(()=>{
      const a = document.createElement('a');
      a.href = item.image;
      a.download = 'pedido-' + (i+1) + '-' + item.name.toLowerCase() + '.jpg';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }, i * 400);
  });
}

function sendOrderToInstagram(){
  const summary = buildOrderSummary();
  if(!summary){
    alert('Tu carrito está vacío. Agrega al menos un producto antes de enviar el pedido.');
    return;
  }

  const hasImages = cart.some(item => item.image);

  const finish = ()=>{
    downloadCartImages();
    window.open('https://ig.me/m/' + IG_USERNAME, '_blank');
    alert(
      'Copiamos el resumen de tu pedido y ' + (hasImages ? 'descargamos las imágenes que subiste. ' : '') +
      'Se abrió el chat de Instagram — pega el texto (Ctrl+V) ' +
      (hasImages ? 'y adjunta las imágenes descargadas ' : '') +
      'y envíalos.'
    );
  };

  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(summary).then(finish).catch(finish);
  } else {
    finish();
  }
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

document.addEventListener('DOMContentLoaded', ()=>{
  initUploader();
  renderCart();
  initGlobalSparkles();
  initReceiptMeta();
});