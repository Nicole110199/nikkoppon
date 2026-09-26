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

/* ---------- botón "volver" del celular/navegador ----------
   Cada vez que se abre el carrito o alguna ventana (modal), se guarda un
   "paso" en el historial del navegador. Así, si el cliente usa la flechita
   de volver del celular, en vez de salir de la página se cierra la ventana
   que tenía abierta (sin guardar cambios si estaba editando algo). */

let overlayHistoryOpen = false;
let isHandlingPopstate = false;

function anyOverlayVisible(){
  const cart = document.getElementById('cartDrawer');
  const modal = document.getElementById('modalBackdrop');
  const stockModal = document.getElementById('stockModalBackdrop');
  const postitModal = document.getElementById('postitModalBackdrop');
  const termsModal = document.getElementById('termsModalBackdrop');
  return (cart && cart.classList.contains('open')) ||
         (modal && !modal.classList.contains('hidden')) ||
         (stockModal && !stockModal.classList.contains('hidden')) ||
         (postitModal && !postitModal.classList.contains('hidden')) ||
         (termsModal && !termsModal.classList.contains('hidden'));
}

function pushOverlayHistory(){
  if(!overlayHistoryOpen){
    overlayHistoryOpen = true;
    history.pushState({ nikkopponOverlay: true }, '');
  }
}

// Se llama después de cerrar cualquier ventana; si ya no queda ninguna
// abierta, "gasta" el paso de historial que se había guardado.
function consumeOverlayHistory(){
  if(overlayHistoryOpen && !anyOverlayVisible() && !isHandlingPopstate){
    overlayHistoryOpen = false;
    history.back();
  }
}

function closeAllOverlaysSilently(){
  document.getElementById('cartDrawer').classList.remove('open');
  document.getElementById('cartBackdrop').classList.remove('open');
  document.getElementById('modalBackdrop').classList.add('hidden');
  document.getElementById('stockModalBackdrop').classList.add('hidden');
  document.getElementById('postitModalBackdrop').classList.add('hidden');
  document.getElementById('termsModalBackdrop').classList.add('hidden');
  updateFloatingCartBtn();
}

// Cierra el carrito SIN tocar el historial (a diferencia de toggleCart(false)).
// Se usa cuando se va a abrir otra ventana inmediatamente después (por
// ejemplo, al editar un producto), para no pisar el paso de "volver" que
// ya estaba guardado — eso evita que la ventana nueva se cierre sola.
function hideCartSilently(){
  document.getElementById('cartDrawer').classList.remove('open');
  document.getElementById('cartBackdrop').classList.remove('open');
  updateFloatingCartBtn();
}

// Igual que arriba, pero para cerrar un modal (personalización, stock o
// memo pad) sin tocar el historial, justo antes de abrir el carrito.
function hideOverlaySilently(id){
  document.getElementById(id).classList.add('hidden');
}

window.addEventListener('popstate', function(){
  isHandlingPopstate = true;
  closeAllOverlaysSilently();
  overlayHistoryOpen = false;
  isHandlingPopstate = false;
});

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

const BOOKMARK_MATERIALS = {
  normal:{ label:'Normal', desc:'Acabado clásico, resistente para el uso diario.', basePrice:1250, swatchClass:'swatch-mate' },
  tornasol:{ label:'Tornasol', desc:'Cambia de color según la luz. Un marcapáginas que destaca.', basePrice:1750, swatchClass:'swatch-tornasol' }
};
const BOOKMARK_SIZE = { wCm:5, hCm:20 }; // tamaño único, sin variación

const POLAROID_SIZES = [
  {id:'unidad', label:'Unidad', price:600},
  {id:'set5', label:'Set x5', price:2700}
];
// Polaroid: tamaño TOTAL con marco incluido = 7,5 cm ancho x 10,5 cm alto.
// Margen de 0,5 cm arriba, izquierda y derecha; el margen de abajo queda
// más grueso (como un polaroid real), con lo que sobra: 10,5 - 0,5 - 7,6 = 2,4 cm.
// Eso deja la ventana de la foto en 6,5 cm ancho x 7,6 cm alto.
const POLAROID_SIZE = { wCm:7.5, hCm:10.5 }; // tamaño total, con marco
const POLAROID_PHOTO_SIZE = { wCm:6.5, hCm:7.6 }; // ventana de la foto, dentro del marco
const POLAROID_MARGIN = { top:0.5, left:0.5, right:0.5 }; // el de abajo se calcula solo

const FRAME_LONG_PX = 220;   // tamaño del marco de recorte en pantalla
const CROP_EXPORT_LONG_PX = 1600; // resolución del recorte final exportado

let cart = [];

let modalState = {
  type:null, material:'mate', sizeId:null, qty:1, image:null, notes:'',
  orientation:'vertical',
  crop:{ rotation:0, zoom:1, offsetX:0, offsetY:0, natW:0, natH:0 },
  polaroidSlots:[null,null,null,null,null], activeSlot:0
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

  const isSticker = type === 'sticker';
  const isPoster = type === 'poster';
  const isBookmark = type === 'bookmark';
  const isPolaroid = type === 'polaroid';

  modalState = {
    type,
    material: (prefill && prefill.materialId) || (isBookmark ? 'normal' : 'mate'),
    sizeId: (prefill && prefill.sizeId) || (isSticker ? 'm' : (isPoster ? 'a4' : (isPolaroid ? 'unidad' : null))),
    qty: (prefill && prefill.qty) || 1,
    image: (prefill && prefill.images) ? null : ((prefill && prefill.image) || null),
    notes: (prefill && prefill.notes) || '',
    orientation: (prefill && prefill.orientation) || 'vertical',
    crop:{ rotation:0, zoom:1, offsetX:0, offsetY:0, natW:0, natH:0 },
    uploadedNatW:0, uploadedNatH:0,
    polaroidSlots: (prefill && prefill.images)
      ? prefill.images.map(img => img ? { image: img, crop:{ rotation:0, zoom:1, offsetX:0, offsetY:0, natW:0, natH:0 } } : null)
      : [null,null,null,null,null],
    activeSlot: 0
  };
  document.getElementById('notesInput').value = modalState.notes;
  document.getElementById('cropZoom').value = 100;
  document.getElementById('resWarning').style.display = 'none';
  document.getElementById('qtyVal').textContent = modalState.qty;

  document.getElementById('materialField').style.display = (isSticker || isBookmark) ? '' : 'none';
  document.getElementById('sizeField').style.display = isBookmark ? 'none' : '';
  document.getElementById('orientationField').style.display = isPoster ? '' : 'none';
  document.getElementById('cropControlsField').style.display = 'none';
  document.getElementById('polaroidSlots').style.display = 'none';
  document.getElementById('modalWindowTitle').textContent =
    isSticker ? 'STICKER.EXE' : (isPoster ? 'POSTER.EXE' : (isPolaroid ? 'POLAROID.EXE' : 'MARCAPAGINAS.EXE'));

  if(isSticker){
    const mat = STICKER_MATERIALS[modalState.material];
    document.getElementById('modalEyebrow').textContent = 'Personalizable';
    document.getElementById('modalTitle').textContent = 'Sticker';
    document.getElementById('modalDesc').textContent = mat.desc;
  } else if(isBookmark){
    const mat = BOOKMARK_MATERIALS[modalState.material];
    document.getElementById('modalEyebrow').textContent = 'Personalizable';
    document.getElementById('modalTitle').textContent = 'Marcapáginas';
    document.getElementById('modalDesc').textContent = mat.desc + ' Tamaño único: 5 x 20 cm.';
  } else if(isPolaroid){
    document.getElementById('modalEyebrow').textContent = 'Personalizable';
    document.getElementById('modalTitle').textContent = 'Polaroid';
    document.getElementById('modalDesc').textContent = 'Elige unidad (1 foto) o set x5 (5 fotos distintas), sube tu imagen y acomódala dentro del marco.';
  } else {
    document.getElementById('modalEyebrow').textContent = 'Personalizable';
    document.getElementById('modalTitle').textContent = 'Poster';
    document.getElementById('modalDesc').textContent = 'Elige el tamaño y la orientación, sube tu imagen y acomódala dentro del marco.';
    document.querySelectorAll('#orientationField .chip').forEach(c=>c.classList.toggle('active', c.dataset.orient===modalState.orientation));
  }

  renderMaterialRow();
  renderSizeRow();
  if(isPolaroid) updatePolaroidModeVisibility();
  buildStage();
  updateModalTotals();

  const addBtn = document.querySelector('#modalBackdrop .add-btn');
  if(addBtn) addBtn.textContent = prefill ? 'Guardar cambios' : 'Agregar al carrito';

  document.getElementById('modalBackdrop').classList.remove('hidden');
  pushOverlayHistory();
}

function hideModal(){
  document.getElementById('modalBackdrop').classList.add('hidden');
  consumeOverlayHistory();
}

function closeModal(){
  if(modalState.image){
    const sure = confirm('Tienes una imagen subida sin agregar al carrito. ¿Seguro que quieres cerrar? Se va a perder.');
    if(!sure) return;
  }
  editingCartIndex = null;
  hideModal();
}

function getMaterialsForType(){
  return modalState.type === 'bookmark' ? BOOKMARK_MATERIALS : STICKER_MATERIALS;
}

function renderMaterialRow(){
  const row = document.getElementById('materialRow');
  if(!row) return;
  row.innerHTML = '';
  const materials = getMaterialsForType();
  const activeId = modalState.material;
  Object.keys(materials).forEach(id=>{
    const b = document.createElement('button');
    b.className = 'chip' + (id===activeId ? ' active' : '');
    b.textContent = materials[id].label;
    b.dataset.material = id;
    b.onclick = ()=>setMaterial(id);
    row.appendChild(b);
  });
}

function renderSizeRow(){
  const row = document.getElementById('sizeRow');
  row.innerHTML = '';
  const list = modalState.type === 'sticker' ? STICKER_SIZES
    : modalState.type === 'polaroid' ? POLAROID_SIZES
    : POSTER_SIZES;
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
  document.getElementById('modalDesc').textContent = getMaterialsForType()[materialId].desc;
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
  if(modalState.type === 'polaroid'){
    updatePolaroidModeVisibility();
  }
  updateModalTotals();
  reevaluateResolutionWarning();
}

/* ---------- set de 5 fotos distintas para Polaroid ---------- */

function isPolaroidSet(){
  return modalState.type === 'polaroid' && modalState.sizeId === 'set5';
}

// Guarda la imagen/recorte que se está viendo en ese momento dentro del
// slot activo, antes de cambiar a otro slot o de cerrar el modal.
function saveCurrentSlotState(){
  if(!isPolaroidSet()) return;
  modalState.polaroidSlots[modalState.activeSlot] = modalState.image
    ? { image: modalState.image, crop: { ...modalState.crop } }
    : null;
}

// Carga en la vista principal lo que haya guardado en el slot activo
// (o la deja vacía si ese slot todavía no tiene foto).
function loadActiveSlotIntoView(){
  const slot = modalState.polaroidSlots[modalState.activeSlot];
  if(slot){
    modalState.image = slot.image;
    modalState.crop = { ...slot.crop };
  } else {
    modalState.image = null;
    modalState.crop = { rotation:0, zoom:1, offsetX:0, offsetY:0, natW:0, natH:0 };
  }
}

function selectPolaroidSlot(n){
  saveCurrentSlotState();
  modalState.activeSlot = n;
  loadActiveSlotIntoView();
  renderPolaroidSlots();
  buildStage();
  reevaluateResolutionWarning();
}

function renderPolaroidSlots(){
  const wrap = document.getElementById('polaroidSlots');
  if(!wrap) return;
  wrap.innerHTML = '';
  modalState.polaroidSlots.forEach((slot, i)=>{
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'polaroid-slot' + (slot ? ' filled' : '') + (i === modalState.activeSlot ? ' active' : '');
    btn.onclick = () => selectPolaroidSlot(i);
    btn.innerHTML = slot
      ? '<img src="' + slot.image + '" alt="Foto ' + (i+1) + '"><span class="check">✓</span>'
      : String(i + 1);
    wrap.appendChild(btn);
  });
}

// Muestra u oculta los slots según si el tipo/tamaño actual es el set de
// Polaroid, y sincroniza la vista con lo que haya en el slot activo.
function updatePolaroidModeVisibility(){
  const wrap = document.getElementById('polaroidSlots');
  const isSet = isPolaroidSet();
  wrap.style.display = isSet ? 'flex' : 'none';

  if(isSet){
    loadActiveSlotIntoView();
    renderPolaroidSlots();
  }
  buildStage();
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
  let wCm, hCm;

  if(modalState.type === 'bookmark'){
    wCm = BOOKMARK_SIZE.wCm;
    hCm = BOOKMARK_SIZE.hCm;
  } else if(modalState.type === 'polaroid'){
    wCm = POLAROID_PHOTO_SIZE.wCm;
    hCm = POLAROID_PHOTO_SIZE.hCm;
  } else {
    const size = POSTER_SIZES.find(s=>s.id===modalState.sizeId) || POSTER_SIZES[0];
    const longSide = Math.max(size.wCm, size.hCm);
    const shortSide = Math.min(size.wCm, size.hCm);
    wCm = modalState.orientation === 'horizontal' ? longSide : shortSide;
    hCm = modalState.orientation === 'horizontal' ? shortSide : longSide;
  }

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
    initStagePreviewDropzone(wrap);
  } else if(!modalState.image){
    // Todavía no hay imagen: se muestra un recuadro amplio y cuadrado,
    // igual que en Sticker — así el primer contacto no se ve apretado en
    // productos alargados (Marcapáginas, Polaroid, Poster vertical, etc).
    // Recién cuando se sube la foto se cambia a la forma real del producto.
    const wrap = document.createElement('div');
    wrap.className = 'sticker-stage generic-upload';
    wrap.innerHTML =
      '<div class="placeholder upload-placeholder" id="placeholder">' +
        '<div class="dz-icon">✦</div>' +
        '<div class="dz-main">Sube o arrastra tu imagen aquí</div>' +
        '<div class="dz-sub">PNG, JPG o WEBP</div>' +
        '<button type="button" class="dz-btn" id="dzButton">Elegir archivo</button>' +
      '</div>' +
      '<img class="artwork" id="artworkImg" style="display:none">';
    stage.appendChild(wrap);
    initStagePreviewDropzone(wrap);
  } else {
    const frameDims = computeFrameDims();
    const frame = document.createElement('div');
    frame.className = 'crop-frame';
    frame.id = 'cropFrame';
    frame.style.width = frameDims.wPx + 'px';
    frame.style.height = frameDims.hPx + 'px';
    frame.style.borderRadius = '6px';
    frame.innerHTML =
      '<div class="placeholder upload-placeholder" id="placeholder">' +
        '<div class="dz-icon">✦</div>' +
        '<div class="dz-main">Sube o arrastra tu imagen aquí</div>' +
        '<div class="dz-sub">PNG, JPG o WEBP</div>' +
        '<button type="button" class="dz-btn" id="dzButton">Elegir archivo</button>' +
      '</div>' +
      '<img class="crop-image" id="artworkImg" style="display:none">';

    if(modalState.type === 'polaroid'){
      // Marco blanco alrededor, con las proporciones reales del polaroid
      // (0,5 cm arriba/izquierda/derecha, y el resto abajo), solo decorativo
      // — el recorte en sí sigue funcionando sobre la ventana de la foto.
      // Se usa la misma escala (píxeles por cm) que ya tiene el marco de
      // la foto, para que las proporciones queden exactas.
      const pxPerCm = frameDims.wPx / POLAROID_PHOTO_SIZE.wCm;
      const outer = document.createElement('div');
      outer.className = 'polaroid-outer';
      outer.style.width = (pxPerCm * POLAROID_SIZE.wCm) + 'px';
      outer.style.height = (pxPerCm * POLAROID_SIZE.hCm) + 'px';
      outer.style.paddingLeft = (pxPerCm * POLAROID_MARGIN.left) + 'px';
      outer.style.paddingRight = (pxPerCm * POLAROID_MARGIN.right) + 'px';
      outer.style.paddingTop = (pxPerCm * POLAROID_MARGIN.top) + 'px';
      outer.appendChild(frame);
      stage.appendChild(outer);
    } else {
      stage.appendChild(frame);
    }

    frame.addEventListener('mousedown', startCropDrag);
    frame.addEventListener('touchstart', startCropDrag, {passive:false});
    initStagePreviewDropzone(frame);
  }
  refreshStageContent();
}

// Hace que la vista previa misma (sticker o poster) sea la zona donde se
// puede hacer clic o arrastrar una imagen — así el cliente sube la imagen
// justo donde va a ver el resultado, en vez de un recuadro aparte.
function initStagePreviewDropzone(el){
  const fileInput = document.getElementById('fileInput');

  el.addEventListener('click', (e)=>{
    if(modalState.image) return; // ya hay imagen: se cambia con el botón "Cambiar imagen"
    fileInput.click();
  });
  el.addEventListener('dragover', (e)=>{
    e.preventDefault();
    if(!modalState.image) el.classList.add('dragging');
  });
  el.addEventListener('dragleave', ()=>{
    el.classList.remove('dragging');
  });
  el.addEventListener('drop', (e)=>{
    e.preventDefault();
    el.classList.remove('dragging');
    const file = e.dataTransfer.files[0];
    handleFile(file);
  });

  const dzButton = el.querySelector('#dzButton');
  if(dzButton){
    dzButton.addEventListener('click', (e)=>{
      e.stopPropagation();
      fileInput.click();
    });
  }
}

function renderStageInner(){
  const overlay = STICKER_MATERIALS[modalState.material].overlayClass;
  return '<div class="placeholder upload-placeholder" id="placeholder">' +
           '<div class="dz-icon">✦</div>' +
           '<div class="dz-main">Sube o arrastra tu imagen aquí</div>' +
           '<div class="dz-sub">PNG, JPG o WEBP</div>' +
           '<button type="button" class="dz-btn" id="dzButton">Elegir archivo</button>' +
         '</div>' +
         '<img class="artwork" id="artworkImg" style="display:none">' +
         '<div class="' + overlay + '" id="stageOverlay"></div>';
}

function refreshStageContent(){
  const placeholder = document.getElementById('placeholder');
  const img = document.getElementById('artworkImg');
  if(!placeholder || !img) return;

  const changeBtn = document.getElementById('changeImageBtn');
  if(changeBtn) changeBtn.style.display = modalState.image ? 'inline-flex' : 'none';

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
  const cropFrame = document.getElementById('cropFrame');

  if(!modalState.image){
    placeholder.style.display = 'flex';
    img.style.display = 'none';
    if(cropFrame) cropFrame.classList.add('is-empty');
    return;
  }

  placeholder.style.display = 'none';
  img.style.display = 'block';
  if(cropFrame) cropFrame.classList.remove('is-empty');

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
  const isCropType = modalState.type === 'poster' || modalState.type === 'bookmark' || modalState.type === 'polaroid';
  if(!img || !isCropType || !modalState.crop.natW) return;

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

function stepZoom(delta){
  const slider = document.getElementById('cropZoom');
  const newVal = Math.max(100, Math.min(300, Number(slider.value) + delta));
  slider.value = newVal;
  onZoomChange(newVal);
}

function startCropDrag(e){
  if(!modalState.image) return; // sin imagen todavía no hay nada que recortar/mover
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
  return renderCropToCanvas(img, modalState.crop, modalState.type).toDataURL('image/jpeg', 0.92);
}

// Dibuja el recorte (rotación/zoom/posición) de una imagen ya cargada en
// un <img> o Image(), y devuelve el canvas final. Para Polaroid, en vez de
// llenar todo el lienzo con la foto, la compone dentro de la ventana de
// foto real (6,5 x 7,6 cm), dejando el resto como marco blanco — así la
// imagen que se exporta ya incluye el marco, lista para imprimir/enviar.
function renderCropToCanvas(img, crop, type){
  const frameDims = computeFrameDims(); // ventana de recorte (= la foto en polaroid)
  const rot = crop.rotation;
  const swapped = (rot === 90 || rot === 270);
  const effW = swapped ? crop.natH : crop.natW;
  const effH = swapped ? crop.natW : crop.natH;
  const baseScale = Math.max(frameDims.wPx / effW, frameDims.hPx / effH);
  const zoomFactor = crop.zoom;
  const displayW = crop.natW * baseScale * zoomFactor;
  const displayH = crop.natH * baseScale * zoomFactor;

  const isPolaroid = type === 'polaroid';
  const outerCm = isPolaroid ? POLAROID_SIZE : frameDims;

  let outW, outH;
  if(outerCm.wCm >= outerCm.hCm){
    outW = CROP_EXPORT_LONG_PX;
    outH = Math.round(CROP_EXPORT_LONG_PX * outerCm.hCm / outerCm.wCm);
  } else {
    outH = CROP_EXPORT_LONG_PX;
    outW = Math.round(CROP_EXPORT_LONG_PX * outerCm.wCm / outerCm.hCm);
  }

  const pxPerCmExport = outW / outerCm.wCm;
  const photoLeftPx = isPolaroid ? pxPerCmExport * POLAROID_MARGIN.left : 0;
  const photoTopPx = isPolaroid ? pxPerCmExport * POLAROID_MARGIN.top : 0;
  const photoWpx = isPolaroid ? pxPerCmExport * POLAROID_PHOTO_SIZE.wCm : outW;
  const photoHpx = isPolaroid ? pxPerCmExport * POLAROID_PHOTO_SIZE.hCm : outH;
  const scaleFactor = photoWpx / frameDims.wPx;
  const centerX = photoLeftPx + photoWpx / 2;
  const centerY = photoTopPx + photoHpx / 2;

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, outW, outH);

  ctx.save();
  if(isPolaroid){
    ctx.beginPath();
    ctx.rect(photoLeftPx, photoTopPx, photoWpx, photoHpx);
    ctx.clip();
  }
  ctx.translate(centerX + crop.offsetX * scaleFactor, centerY + crop.offsetY * scaleFactor);
  ctx.rotate(rot * Math.PI / 180);
  ctx.drawImage(img, -(displayW * scaleFactor) / 2, -(displayH * scaleFactor) / 2, displayW * scaleFactor, displayH * scaleFactor);
  ctx.restore();

  return canvas;
}

// Exporta el recorte de UN slot específico (usada para el set de 5 fotos
// de Polaroid, donde cada foto tiene su propia imagen y su propio recorte,
// sin depender de lo que esté cargado en la vista previa en ese momento).
function exportSlotImage(slot){
  return new Promise((resolve)=>{
    if(!slot || !slot.image){ resolve(null); return; }
    const img = new Image();
    img.onload = () => {
      resolve(renderCropToCanvas(img, slot.crop, modalState.type).toDataURL('image/jpeg', 0.92));
    };
    img.src = slot.image;
  });
}

function updateModalTotals(){
  let price, sizeLabel;
  if(modalState.type === 'sticker'){
    const size = STICKER_SIZES.find(s=>s.id===modalState.sizeId) || STICKER_SIZES[1];
    price = STICKER_MATERIALS[modalState.material].basePrice * size.mult * modalState.qty;
    sizeLabel = size.label;
  } else if(modalState.type === 'bookmark'){
    price = BOOKMARK_MATERIALS[modalState.material].basePrice * modalState.qty;
    sizeLabel = '5 x 20 cm';
  } else if(modalState.type === 'polaroid'){
    const size = POLAROID_SIZES.find(s=>s.id===modalState.sizeId) || POLAROID_SIZES[0];
    price = size.price * modalState.qty;
    sizeLabel = size.label;
  } else {
    const size = POSTER_SIZES.find(s=>s.id===modalState.sizeId) || POSTER_SIZES[0];
    const frameDims = computeFrameDims();
    price = size.price * modalState.qty;
    sizeLabel = formatCm(frameDims.wCm) + ' x ' + formatCm(frameDims.hCm) + ' cm';
  }
  document.getElementById('priceVal').textContent = formatCLP(price);

  let tag;
  if(modalState.type === 'sticker'){
    tag = 'Sticker · ' + STICKER_MATERIALS[modalState.material].label + ' · ' + sizeLabel;
  } else if(modalState.type === 'bookmark'){
    tag = 'Marcapáginas · ' + BOOKMARK_MATERIALS[modalState.material].label + ' · ' + sizeLabel;
  } else if(modalState.type === 'polaroid'){
    tag = 'Polaroid · ' + sizeLabel + ' · 7,5 x 10,5 cm';
  } else {
    tag = 'Poster · ' + sizeLabel + ' · ' + (modalState.orientation === 'horizontal' ? 'Horizontal' : 'Vertical');
  }
  document.getElementById('previewTag').textContent = tag;
}

function handleFile(file){
  if(!file || !file.type.startsWith('image/')) return;
  const reader = new FileReader();
  reader.onload = (e)=>{
    modalState.image = e.target.result;
    if(modalState.type === 'poster' || modalState.type === 'bookmark' || modalState.type === 'polaroid'){
      modalState.crop = { rotation:0, zoom:1, offsetX:0, offsetY:0, natW:0, natH:0 };
      document.getElementById('cropZoom').value = 100;
    }
    checkImageResolution(e.target.result);
    if(modalState.type === 'sticker'){
      refreshStageContent();
    } else {
      buildStage(); // pasa del recuadro genérico de subida al marco real del producto
    }
    if(isPolaroidSet()){
      saveCurrentSlotState();
      renderPolaroidSlots();
    }
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

async function addToCart(){
  const isSet = isPolaroidSet();

  if(isSet){
    saveCurrentSlotState();
    const filledCount = modalState.polaroidSlots.filter(Boolean).length;
    if(filledCount < 5){
      alert('Sube las 5 fotos del set antes de agregar al carrito (llevas ' + filledCount + ' de 5).');
      return;
    }
  } else if(!modalState.image){
    alert('Sube una imagen antes de agregar el producto al carrito.');
    return;
  }
  modalState.notes = document.getElementById('notesInput').value.trim();

  let price, meta, name, swatchClass, boxWcm, boxHcm, materialLabel, finalImage, finalImages, materialId, sizeId;
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
  } else if(modalState.type === 'bookmark'){
    const mat = BOOKMARK_MATERIALS[modalState.material];
    price = mat.basePrice * modalState.qty;
    meta = mat.label + ' · 5 x 20 cm';
    name = 'Marcapáginas';
    swatchClass = mat.swatchClass;
    boxWcm = BOOKMARK_SIZE.wCm;
    boxHcm = BOOKMARK_SIZE.hCm;
    materialLabel = mat.label;
    materialId = modalState.material;
    sizeId = null;
    finalImage = modalState.image ? exportCroppedImage() : null;
  } else if(modalState.type === 'polaroid'){
    const size = POLAROID_SIZES.find(s=>s.id===modalState.sizeId) || POLAROID_SIZES[0];
    price = size.price * modalState.qty;
    name = 'Polaroid';
    swatchClass = 'swatch-posterA';
    materialLabel = '';
    materialId = null;
    sizeId = size.id;

    if(isSet){
      meta = size.label + ' (5 fotos distintas) · 8 x 10 cm';
      finalImages = await Promise.all(modalState.polaroidSlots.map(slot => exportSlotImage(slot)));
      finalImage = finalImages[0];
    } else {
      meta = size.label + ' · 8 x 10 cm';
      finalImage = modalState.image ? exportCroppedImage() : null;
    }
    boxWcm = POLAROID_SIZE.wCm;
    boxHcm = POLAROID_SIZE.hCm;
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
  if(finalImages) cartItem.images = finalImages;

  if(editingCartIndex !== null){
    cart[editingCartIndex] = cartItem;
    editingCartIndex = null;
  } else {
    cart.push(cartItem);
  }

  renderCart();
  hideOverlaySilently('modalBackdrop');
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
  if(open){
    showView(activeConfirmation ? 'confirmation' : 'cart');
    pushOverlayHistory();
  } else {
    consumeOverlayHistory();
  }
  updateFloatingCartBtn();
}

function removeCartItem(index){
  cart.splice(index, 1);
  renderCart();
}

function editCartItem(index){
  const item = cart[index];
  if(!item) return;
  editingCartIndex = index;
  hideCartSilently();
  openModal(item.type, item);
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

// Guarda el carrito en el navegador para que sobreviva si el cliente
// recarga la página o cierra el navegador por accidente. Si el carrito
// pesa demasiado (imágenes muy grandes), simplemente no lo guarda —
// el carrito sigue funcionando normal en esa sesión, solo no persiste.
function saveCartToStorage(){
  try {
    localStorage.setItem('nikkoppon_cart', JSON.stringify(cart));
  } catch (err) {
    console.warn('No se pudo guardar el carrito localmente (probablemente pesa demasiado):', err);
  }
}

function loadCartFromStorage(){
  try {
    const saved = localStorage.getItem('nikkoppon_cart');
    if(saved){
      const parsed = JSON.parse(saved);
      if(Array.isArray(parsed)) cart = parsed;
    }
  } catch (err) {
    console.warn('No se pudo recuperar el carrito guardado:', err);
  }
}

function renderCart(){
  saveCartToStorage();
  const wrap = document.getElementById('cartItems');
  document.getElementById('cartBadge').textContent = cart.length;

  if(cart.length === 0){
    wrap.innerHTML = '<div class="cart-empty">Todavía no agregaste ningún producto.</div>';
    appliedDiscount = null;
    document.getElementById('discountApplied').style.display = 'none';
    document.getElementById('discountForm').style.display = '';
    document.getElementById('discountTotalRow').style.display = 'none';
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

    const canEdit = item.type === 'sticker' || item.type === 'poster' || item.type === 'bookmark' || item.type === 'polaroid';
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

  revalidateAppliedDiscount();

  const promoResult = computePromotions();
  const promoAmount = promoResult.discount;
  document.getElementById('promoApplied').style.display = promoAmount > 0 ? '' : 'none';
  document.getElementById('promoApplied').innerHTML = promoAmount > 0
    ? '🎉 ' + promoResult.applied.map(escapeHtml).join(' · ') + ' aplicado'
    : '';
  document.getElementById('promoTotalRow').style.display = promoAmount > 0 ? '' : 'none';
  document.getElementById('promoAmountVal').textContent = '-' + formatCLP(promoAmount);

  const discountAmount = getDiscountAmount(total - promoAmount);
  document.getElementById('discountForm').style.display = appliedDiscount ? 'none' : '';
  document.getElementById('discountApplied').style.display = appliedDiscount ? '' : 'none';
  if(appliedDiscount){
    document.getElementById('discountAppliedCode').textContent = appliedDiscount.code;
    document.getElementById('discountAppliedPercent').textContent = appliedDiscount.percent;
  }
  document.getElementById('discountTotalRow').style.display = discountAmount > 0 ? '' : 'none';
  document.getElementById('discountAmountVal').textContent = '-' + formatCLP(discountAmount);

  document.getElementById('cartTotal').textContent = formatCLP(total - promoAmount - discountAmount);
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
const MIN_ORDER_TOTAL = 1000;

let checkoutState = { delivery: 'retiro' };
let countdownInterval = null;

function getCartSubtotal(){
  return cart.reduce((sum, item) => sum + item.price, 0);
}

// Solo cuenta lo personalizado (sticker/poster) — el stock y los memo pad
// no tienen compra mínima, ya que no se fabrican especialmente por pedido.
function getPersonalizedSubtotal(){
  return cart
    .filter(item => item.type === 'sticker' || item.type === 'poster' || item.type === 'bookmark' || item.type === 'polaroid')
    .reduce((sum, item) => sum + item.price, 0);
}

/* ---------- códigos de descuento ---------- */

let discountCodes = [];
let appliedDiscount = null; // { code, percent, minimum }

function loadDiscounts(){
  if(!APPS_SCRIPT_URL) return;
  fetch(APPS_SCRIPT_URL + '?action=discounts')
    .then(res => res.json())
    .then(data => {
      if(data && data.error){
        console.error('Error cargando los códigos de descuento:', data.error);
        return;
      }
      discountCodes = (data && data.items) || [];
    })
    .catch(err => console.error('Error cargando los códigos de descuento:', err));
}

/* ---------- promociones automáticas (2x1, % en producto específico, etc.) ---------- */

let promotions = [];

function loadPromotions(){
  if(!APPS_SCRIPT_URL) return;
  fetch(APPS_SCRIPT_URL + '?action=promos')
    .then(res => res.json())
    .then(data => {
      if(data && data.error){
        console.error('Error cargando las promociones:', data.error);
        return;
      }
      promotions = (data && data.items) || [];
      renderCart(); // por si ya había productos en el carrito antes de que cargaran
    })
    .catch(err => console.error('Error cargando las promociones:', err));
}

// Calcula cuánto se descuenta en total por promociones activas, y devuelve
// también los nombres de las que efectivamente se aplicaron (para mostrar
// en el carrito y mandar en el pedido).
function computePromotions(){
  let discount = 0;
  const applied = [];

  promotions.forEach(promo => {
    const matching = cart.filter(item => promo.producto === 'todos' || item.type === promo.producto);
    if(matching.length === 0) return;

    if(promo.tipo === 'porcentaje'){
      const subtotal = matching.reduce((s,i)=>s+i.price, 0);
      const amount = Math.round(subtotal * (promo.porcentaje / 100));
      if(amount > 0){
        discount += amount;
        applied.push(promo.nombre);
      }
    } else if(promo.tipo === 'cantidad' && promo.compra > 0){
      // Se arma una lista con el precio de CADA unidad individual (no por
      // línea del carrito), para que si hay variantes con precios
      // distintos, las que salgan "gratis" sean siempre las más baratas
      // — lo más justo para el cliente.
      const units = [];
      matching.forEach(item => {
        const unitPrice = item.qty > 0 ? item.price / item.qty : 0;
        for(let i=0; i<item.qty; i++) units.push(unitPrice);
      });
      units.sort((a,b)=>a-b);

      const bundles = Math.floor(units.length / promo.compra);
      const freeCount = bundles * (promo.compra - promo.paga);
      if(freeCount > 0){
        for(let i=0; i<freeCount; i++) discount += units[i];
        applied.push(promo.nombre);
      }
    }
  });

  return { discount: Math.round(discount), applied };
}

function applyDiscountCode(){
  const input = document.getElementById('discountInput');
  const code = input.value.trim().toUpperCase();
  const errorEl = document.getElementById('discountError');

  if(!code){
    showDiscountError('Escribe un código antes de aplicar.');
    return;
  }

  const match = discountCodes.find(d => d.code === code);
  if(!match){
    showDiscountError('Ese código no es válido.');
    return;
  }

  const subtotal = getCartSubtotal();
  if(match.minimum > 0 && subtotal < match.minimum){
    showDiscountError('Este código necesita una compra mínima de ' + formatCLP(match.minimum) + ' (te faltan ' + formatCLP(match.minimum - subtotal) + ').');
    return;
  }

  appliedDiscount = match;
  errorEl.style.display = 'none';
  input.value = '';
  renderCart();
}

function removeDiscountCode(){
  appliedDiscount = null;
  document.getElementById('discountError').style.display = 'none';
  renderCart();
}

function showDiscountError(msg){
  const errorEl = document.getElementById('discountError');
  errorEl.textContent = '⚠ ' + msg;
  errorEl.style.display = '';
}

// Si el carrito cambió (se quitó un producto, se editó, etc.) y el
// descuento aplicado ya no alcanza su mínimo, se quita solo y se avisa.
function revalidateAppliedDiscount(){
  if(!appliedDiscount) return;
  if(appliedDiscount.minimum > 0 && getCartSubtotal() < appliedDiscount.minimum){
    appliedDiscount = null;
    showDiscountError('Tu código se quitó porque el carrito ya no alcanza el mínimo requerido.');
  }
}

function getDiscountAmount(subtotal){
  if(!appliedDiscount) return 0;
  return Math.round(subtotal * (appliedDiscount.percent / 100));
}

function updateCheckoutTotal(){
  const subtotal = getCartSubtotal();
  const promoAmount = computePromotions().discount;
  const discountAmount = getDiscountAmount(subtotal - promoAmount);
  const fee = checkoutState.delivery === 'envio' ? DELIVERY_FEE : 0;
  const feeRow = document.getElementById('deliveryFeeRow');

  if(fee > 0){
    feeRow.style.display = '';
    document.getElementById('deliveryFeeVal').textContent = formatCLP(fee);
  } else {
    feeRow.style.display = 'none';
  }

  document.getElementById('checkoutTotal').textContent = formatCLP(subtotal - promoAmount - discountAmount + fee);
}

function goToCheckout(){
  if(cart.length === 0){
    alert('Tu carrito está vacío. Agrega al menos un producto antes de continuar.');
    return;
  }
  const personalizedSubtotal = getPersonalizedSubtotal();
  if(personalizedSubtotal > 0 && personalizedSubtotal < MIN_ORDER_TOTAL){
    alert('La compra mínima para stickers/posters personalizados es de ' + formatCLP(MIN_ORDER_TOTAL) + '. Te faltan ' + formatCLP(MIN_ORDER_TOTAL - personalizedSubtotal) + ' en productos personalizados para poder continuar.');
    return;
  }
  if(!document.getElementById('termsCheck').checked){
    alert('Debes aceptar los Términos y Condiciones antes de continuar.');
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
      images: item.images,
      boxWcm: item.boxWcm,
      boxHcm: item.boxHcm
    });
  }

  const promoResult = computePromotions();
  const discountAmount = getDiscountAmount(total - promoResult.discount);
  const discountedSubtotal = total - promoResult.discount - discountAmount;

  return {
    secret: SHARED_SECRET,
    orderNumber: (document.getElementById('receiptNumber') || {}).textContent || '',
    date: (document.getElementById('receiptDate') || {}).textContent || '',
    items,
    subtotal: discountedSubtotal,
    discountCode: appliedDiscount ? appliedDiscount.code : null,
    appliedPromos: promoResult.applied,
    deliveryFee: 0,
    total: formatCLP(discountedSubtotal)
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
  const personalizedSubtotal = getPersonalizedSubtotal();
  if(personalizedSubtotal > 0 && personalizedSubtotal < MIN_ORDER_TOTAL){
    alert('La compra mínima para stickers/posters personalizados es de ' + formatCLP(MIN_ORDER_TOTAL) + '.');
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
    const orderNumber = (document.getElementById('receiptNumber') || {}).textContent || '';
    document.getElementById('confirmOrderNumber').textContent = orderNumber;

    const expiresAt = Date.now() + 30 * 60 * 1000;
    activeConfirmation = { orderNumber, expiresAt };
    saveConfirmationToStorage();

    showView('confirmation');
    startCountdown(30 * 60);
    cart = [];
    renderCart();
  });
}

/* ---------- persistencia de la pantalla de confirmación ----------
   Si el cliente cierra el carrito sin querer (clic afuera, bot\u00f3n de
   volver del celular, etc.) mientras está viendo los datos de
   transferencia, al volver a abrir el carrito debe seguir viendo esa
   misma pantalla — no un carrito vacío. Esto también sobrevive a una
   recarga de página, mientras los 30 minutos no se hayan cumplido. */

let activeConfirmation = null; // { orderNumber, expiresAt }

function saveConfirmationToStorage(){
  try {
    if(activeConfirmation){
      localStorage.setItem('nikkoppon_confirmation', JSON.stringify(activeConfirmation));
    } else {
      localStorage.removeItem('nikkoppon_confirmation');
    }
  } catch(err){
    console.warn('No se pudo guardar el estado de la confirmación:', err);
  }
}

function loadConfirmationFromStorage(){
  try {
    const saved = localStorage.getItem('nikkoppon_confirmation');
    if(!saved) return;
    const parsed = JSON.parse(saved);
    if(!parsed || !parsed.expiresAt) return;

    const remainingSeconds = Math.round((parsed.expiresAt - Date.now()) / 1000);
    if(remainingSeconds <= 0){
      localStorage.removeItem('nikkoppon_confirmation');
      return;
    }

    activeConfirmation = parsed;
    document.getElementById('confirmOrderNumber').textContent = parsed.orderNumber || '';
    startCountdown(remainingSeconds);
  } catch(err){
    console.warn('No se pudo recuperar el estado de la confirmación:', err);
  }
}

// El botón "Hacer una nueva compra" de la pantalla de confirmación —
// recién ahí se suelta la confirmación anterior y el carrito vuelve a
// abrirse vacío, listo para un pedido nuevo.
function startNewPurchase(){
  activeConfirmation = null;
  saveConfirmationToStorage();
  clearInterval(countdownInterval);
  toggleCart(false);
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
      if(activeConfirmation){
        activeConfirmation = null;
        saveConfirmationToStorage();
      }
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

// "Cerrar" solo esconde el carrito — el cronómetro sigue corriendo por
// detrás, así el cliente puede volver a abrir el carrito más tarde y
// seguir viendo los datos de transferencia, en vez de encontrarse con
// un carrito vacío.
function closeConfirmation(){
  toggleCart(false);
}

/* ---------- upload dropzone (compartido por el modal) ---------- */

function initUploader(){
  const fileInput = document.getElementById('fileInput');
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
let stockFinishFilter = 'Mate'; // qué acabado se muestra primero por defecto

function setStockFinishFilter(finish){
  stockFinishFilter = finish;
  document.querySelectorAll('#stockFinishFilter .chip').forEach(c=>c.classList.toggle('active', c.dataset.finish===finish));
  renderStockGrid();
}

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

  const filtered = stockItems.filter(item =>
    (item.finish || '').trim().toLowerCase() === stockFinishFilter.toLowerCase()
  );

  if(filtered.length === 0){
    grid.innerHTML = '<div class="stock-empty">Por ahora no hay stickers ' + escapeHtml(stockFinishFilter) + ' en stock — prueba otro acabado arriba.</div>';
    return;
  }

  grid.innerHTML = '';
  filtered.forEach(item=>{
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
  pushOverlayHistory();
}

function closeStockModal(){
  document.getElementById('stockModalBackdrop').classList.add('hidden');
  consumeOverlayHistory();
}

/* ---------- modal de términos y condiciones ---------- */

function openTermsModal(){
  document.getElementById('termsModalBackdrop').classList.remove('hidden');
  pushOverlayHistory();
}

function closeTermsModal(){
  document.getElementById('termsModalBackdrop').classList.add('hidden');
  consumeOverlayHistory();
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
  hideOverlaySilently('stockModalBackdrop');
  toggleCart(true);
}

/* ---------- memo pad (mismo sistema que stock, otra pestaña del Sheet llamada "Postits") ---------- */

let postitItems = [];
let postitModalState = { item: null, qty: 1, galleryIndex: 0 };

function loadPostits(){
  const grid = document.getElementById('postitGrid');
  if(!APPS_SCRIPT_URL){
    grid.innerHTML = '<div class="stock-empty">Los memo pad todavía no están conectados.</div>';
    return;
  }

  fetch(APPS_SCRIPT_URL + '?action=postits')
    .then(res => res.json())
    .then(data => {
      if(data && data.error){
        console.error('Error del Apps Script al leer los memo pad:', data.error);
        grid.innerHTML = '<div class="stock-empty">Error leyendo los memo pad: ' + escapeHtml(data.error) + '</div>';
        return;
      }
      postitItems = (data && data.items) || [];
      renderPostitGrid();
    })
    .catch(err => {
      console.error('Error cargando los memo pad:', err);
      grid.innerHTML = '<div class="stock-empty">No se pudo cargar los memo pad. Intenta recargar la página.</div>';
    });
}

function renderPostitGrid(){
  const grid = document.getElementById('postitGrid');
  if(postitItems.length === 0){
    grid.innerHTML = '<div class="stock-empty">Por ahora no hay memo pad disponibles.</div>';
    return;
  }

  grid.innerHTML = '';
  postitItems.forEach(item=>{
    const card = document.createElement('button');
    card.className = 'stock-card';
    card.onclick = () => openPostitModal(item.id);

    card.innerHTML =
      '<div class="stock-thumb"><img src="' + (item.image1 || '') + '" alt="' + escapeHtml(item.name || '') + '"></div>' +
      '<h3>' + escapeHtml(item.name || '') + '</h3>' +
      '<span class="stock-qty-tag in-stock">Bajo pedido</span>' +
      '<span class="stock-price">' + formatCLP(Number(item.price) || 0) + '</span>';

    grid.appendChild(card);
  });
}

function openPostitModal(id){
  const item = postitItems.find(s => s.id === id);
  if(!item) return;

  postitModalState = { item, qty: 1, galleryIndex: 0 };

  document.getElementById('postitName').textContent = item.name || '';
  document.getElementById('postitSize').textContent = item.size || '8 cm² · 30 hojas';
  document.getElementById('postitQtyVal').textContent = 1;
  document.getElementById('postitAvailability').textContent = 'Se hace bajo pedido';

  const addBtn = document.getElementById('postitAddBtn');
  addBtn.disabled = false;
  addBtn.textContent = 'Agregar al carrito';

  renderPostitGallery();
  updatePostitTotals();

  document.getElementById('postitModalBackdrop').classList.remove('hidden');
  pushOverlayHistory();
}

function closePostitModal(){
  document.getElementById('postitModalBackdrop').classList.add('hidden');
  consumeOverlayHistory();
}

function renderPostitGallery(){
  const item = postitModalState.item;
  const images = [item.image1, item.image2].filter(Boolean);
  if(images.length === 0) images.push('');

  const idx = postitModalState.galleryIndex % images.length;
  document.getElementById('postitGalleryImg').src = images[idx];
  document.getElementById('postitGalleryImg').alt = item.name || '';

  const dots = document.getElementById('postitGalleryDots');
  dots.innerHTML = '';
  if(images.length > 1){
    images.forEach((img, i)=>{
      const dot = document.createElement('button');
      dot.className = 'dot' + (i === idx ? ' active' : '');
      dot.onclick = () => { postitModalState.galleryIndex = i; renderPostitGallery(); };
      dots.appendChild(dot);
    });
  }
}

function changePostitQty(delta){
  postitModalState.qty = Math.max(1, Math.min(50, postitModalState.qty + delta));
  document.getElementById('postitQtyVal').textContent = postitModalState.qty;
  updatePostitTotals();
}

function updatePostitTotals(){
  const price = (Number(postitModalState.item.price) || 0) * postitModalState.qty;
  document.getElementById('postitPriceVal').textContent = formatCLP(price);
}

function addPostitToCart(){
  const item = postitModalState.item;
  const images = [item.image1, item.image2].filter(Boolean);

  cart.push({
    type: 'postit',
    stockId: item.id,
    material: '',
    name: 'Memo Pad ' + item.name,
    meta: item.size || '8 cm² · 30 hojas',
    notes: '',
    qty: postitModalState.qty,
    price: (Number(item.price) || 0) * postitModalState.qty,
    image: images[0] || null,
    swatchClass: 'swatch-mate'
  });

  renderCart();
  hideOverlaySilently('postitModalBackdrop');
  toggleCart(true);
}



document.addEventListener('DOMContentLoaded', ()=>{
  initUploader();
  loadCartFromStorage();
  loadConfirmationFromStorage();
  renderCart();
  initGlobalSparkles();
  initReceiptMeta();
  loadStock();
  loadPostits();
  loadDiscounts();
  loadPromotions();

  // Listeners globales del recortador de poster (se agregan una sola vez;
  // cropDrag.active controla si realmente hay que mover algo)
  window.addEventListener('mousemove', moveCropDrag);
  window.addEventListener('mouseup', endCropDrag);
  window.addEventListener('touchmove', moveCropDrag, {passive:false});
  window.addEventListener('touchend', endCropDrag);
});
