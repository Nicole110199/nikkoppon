<!doctype html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>NIKKOPPON — Crea tu sticker</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&family=Quicksand:wght@400;500;600;700&family=VT323&display=swap" rel="stylesheet">
<link rel="stylesheet" href="style.css">
<link rel="icon" type="image/png" href="logo-nikkoppon.png">
</head>
<body>

<header class="site">
  <div class="brandmark">
    <img class="cat-logo" src="logo-nikkoppon.png" alt="Logo NIKKOPPON">
    <div class="brandtext"><div class="word">NIKKOPPON</div><div class="tag">stickers &amp; posters</div></div>
  </div>
  <div class="header-right">
    <div class="navlinks">
      <span onclick="document.getElementById('como-pedir').scrollIntoView({behavior:'smooth'})">Cómo pedir</span>
      <span onclick="document.getElementById('catalogo').scrollIntoView({behavior:'smooth'})">Catálogo</span>
      <span onclick="document.getElementById('faq').scrollIntoView({behavior:'smooth'})">Preguntas frecuentes</span>
    </div>
    <a href="https://instagram.com/nikkoppon" target="_blank" rel="noopener" class="ig-navlink">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="2" width="20" height="20" rx="6" stroke="currentColor" stroke-width="2"/>
        <circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="2"/>
        <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor"/>
      </svg>
      <span class="ig-navlink-text">Nosotros</span>
    </a>
    <button class="cart-btn" onclick="toggleCart(true)">
      Carrito
      <span class="cart-badge" id="cartBadge">0</span>
    </button>
  </div>
</header>

<div class="marquee">
  <div class="marquee-track">
    <span>✦ HECHO A MANO &nbsp; ✦ SOLO VALDIVIA &nbsp; ✦ PERSONALIZA TU PROPIO STICKER &nbsp; ✦ PIDE EL TUYO HOY &nbsp;</span>
    <span>✦ HECHO A MANO &nbsp; ✦ SOLO VALDIVIA &nbsp; ✦ PERSONALIZA TU PROPIO STICKER &nbsp; ✦ PIDE EL TUYO HOY &nbsp;</span>
  </div>
</div>

<section class="hero-banner" id="heroBanner">
  <div class="hero-banner-stars">
    <span class="spark s1">✦</span><span class="spark s2">✦</span><span class="spark s3">✦</span><span class="spark s4">✧</span>
  </div>
</section>
    </div>
  </div>
</section>

<section class="block" id="como-pedir">
  <div class="section-head">
    <h2>¿Cómo hacer tu pedido?</h2>
    <p>Cuatro pasos simples, de principio a fin.</p>
  </div>
  <div class="steps-grid">
    <div class="step-item">
      <div class="step-num">1</div>
      <h3>Elige y personaliza</h3>
      <p>Escoge Sticker o Poster, el acabado/tamaño y sube tu imagen.</p>
    </div>
    <div class="step-item">
      <div class="step-num">2</div>
      <h3>Agrégalo al carrito</h3>
      <p>Revisa tu pedido, la cantidad y el total antes de continuar.</p>
    </div>
    <div class="step-item">
      <div class="step-num">3</div>
      <h3>Completa tus datos</h3>
      <p>Nombre, retiro o envío, teléfono y tu Instagram para contactarte.</p>
    </div>
    <div class="step-item">
      <div class="step-num">4</div>
      <h3>Transfiere y confirma</h3>
      <p>Envía tu comprobante por Instagram dentro de los 30 minutos.</p>
    </div>
  </div>
</section>

<section class="block" id="catalogo">
  <div class="section-head">
    <h2>Elige tu producto</h2>
    <p>Personaliza cada uno con tu propia imagen.</p>
    <span class="min-order-badge">✦ Compra mínima: $2.000</span>
  </div>
  <div class="products-grid posters">

    <button class="product-card" onclick="openModal('sticker')">
      <div class="folder-tab" style="background:var(--lilac-deep)"></div>
      <div class="swatch-preview"><img src="sticker-cover.png" alt="Sticker"></div>
      <div class="eyebrow-label">Personalizable</div>
      <h3>Sticker</h3>
      <p class="desc">Elige acabado mate, tornasol o brillante, sube tu imagen y listo.</p>
      <div class="price-pill">
        <div class="price">desde $300<small>+ tamaño y cantidad</small></div>
      </div>
    </button>

    <button class="product-card" onclick="openModal('poster')">
      <div class="folder-tab" style="background:var(--amber-deep)"></div>
      <div class="swatch-preview"><img src="poster-cover.png" alt="Poster"></div>
      <div class="eyebrow-label">Personalizable</div>
      <h3>Poster</h3>
      <p class="desc">Disponible en A4 o 10 x 15 cm — sube tu imagen y listo.</p>
      <div class="price-pill">
        <div class="price">desde $700<small>+ cantidad</small></div>
      </div>
    </button>

  </div>
</section>

<section class="block" id="faq">
  <div class="section-head">
    <h2>Preguntas frecuentes</h2>
    <p>Lo que más nos preguntan.</p>
  </div>
  <div class="faq-list">
    <details class="faq-item">
      <summary>¿Cuánto demora mi pedido?</summary>
      <p>Una vez confirmado el pago, tu pedido se prepara en 2 a 3 días hábiles. Te avisamos por Instagram cuando esté listo para retiro o envío.</p>
    </details>
    <details class="faq-item">
      <summary>¿Cómo cuido mi sticker o poster?</summary>
      <p>Evita el contacto prolongado con agua y la exposición directa al sol por muchas horas para que los colores no se destiñan con el tiempo.</p>
    </details>
    <details class="faq-item">
      <summary>¿Hacen cambios o devoluciones?</summary>
      <p>Como cada producto es personalizado con tu propia imagen, no se aceptan cambios ni devoluciones salvo error de fabricación de nuestra parte.</p>
    </details>
    <details class="faq-item">
      <summary>¿A qué zonas hacen envío?</summary>
      <p>Por ahora el envío a domicilio es solo dentro de Valdivia con un valor adicional de $1500 dependiendo de la zona.</p>
    </details>
    <details class="faq-item">
      <summary>¿Qué pasa si no envío el comprobante a tiempo?</summary>
      <p>Tienes 30 minutos desde que confirmas el pedido para enviar el comprobante de transferencia por Instagram. Pasado ese tiempo, el pedido queda sin confirmar.</p>
    </details>
  </div>
</section>

<footer class="site">
  <div class="word">NIKKOPPON</div>
  <div style="margin-top:6px">Stickers y posters hechos a tu manera.</div>
</footer>

<!-- ---------- modal de personalización ---------- -->
<div class="modal-backdrop hidden" id="modalBackdrop">
  <div class="modal">
    <div class="modal-titlebar">
      <span class="modal-titlebar-title" id="modalWindowTitle">STICKER.EXE</span>
      <div class="titlebar-controls">
        <button type="button" class="win-btn win-close" onclick="closeModal()">×</button>
      </div>
    </div>

    <div class="modal-body">
      <div class="modal-eyebrow" id="modalEyebrow">Brillo holográfico</div>
      <h2 id="modalTitle">Tornasol</h2>
      <p class="modal-desc" id="modalDesc">Cambia de color según la luz.</p>

      <div class="modal-grid">
        <div class="controls">

          <div class="field" id="materialField">
            <div class="field-label"><span class="num">1</span>Acabado</div>
            <div class="chip-row">
              <button class="chip active" data-material="mate" onclick="setMaterial('mate')">Mate</button>
              <button class="chip" data-material="brillante" onclick="setMaterial('brillante')">Brillante</button>
              <button class="chip" data-material="tornasol" onclick="setMaterial('tornasol')">Tornasol</button>
            </div>
          </div>

          <div class="field" id="sizeField">
            <div class="field-label"><span class="num" id="sizeStepNum">2</span>Tamaño</div>
            <div class="chip-row" id="sizeRow"></div>
          </div>

          <div class="field" id="orientationField" style="display:none">
            <div class="field-label"><span class="num">·</span>Orientación</div>
            <div class="chip-row">
              <button class="chip active" data-orient="vertical" onclick="setOrientation('vertical')">Vertical</button>
              <button class="chip" data-orient="horizontal" onclick="setOrientation('horizontal')">Horizontal</button>
            </div>
          </div>

          <div class="field">
            <div class="field-label"><span class="num" id="uploadStepNum">3</span>Sube tu imagen</div>
            <div class="dropzone" id="dropzone">
              <input type="file" id="fileInput" accept="image/*" hidden>
              <div class="dz-icon">✦</div>
              <div class="dz-main">Arrastra tu imagen aquí</div>
              <div class="dz-sub">PNG o JPG</div>
              <button type="button" onclick="document.getElementById('fileInput').click()">Elegir archivo</button>
            </div>
            <div class="res-warning" id="resWarning" style="display:none">⚠ Esta imagen es de baja resolución para el tamaño elegido — podría verse borrosa al imprimir. Si tienes una versión más grande, te recomendamos usarla.</div>
          </div>

          <div class="field" id="cropControlsField" style="display:none">
            <div class="field-label">Ajustar recorte</div>
            <div class="crop-controls">
              <button type="button" class="crop-btn" onclick="rotateCropImage()">⟳ Rotar</button>
              <input type="range" id="cropZoom" min="100" max="300" value="100" oninput="onZoomChange(this.value)">
            </div>
            <div class="hint">Arrastra la imagen dentro del marco para acomodarla.</div>
          </div>

          <div class="field">
            <div class="field-label"><span class="num" id="notesStepNum">4</span>Observaciones <span style="font-weight:400;color:var(--ink-soft)">(opcional)</span></div>
            <textarea class="notes" id="notesInput" placeholder="Ej: recortar dejando un borde blanco, centrar el logo, etc."></textarea>
          </div>

          <div class="field" style="margin-bottom:0">
            <div class="field-label"><span class="num" id="qtyStepNum">5</span>Cantidad</div>
            <div class="qty-row">
              <button class="qty-btn" onclick="changeQty(-1)">−</button>
              <div class="qty-val" id="qtyVal">1</div>
              <button class="qty-btn" onclick="changeQty(1)">+</button>
            </div>
          </div>

          <div class="price-row">
            <div>
              <div style="font-size:12px;color:var(--ink-soft)">Total</div>
              <div class="price-val" id="priceVal">$2.500</div>
            </div>
            <button class="add-btn" onclick="addToCart()">Agregar al carrito</button>
          </div>
        </div>

        <div class="preview-col">
          <div class="stage" id="stage"></div>
          <div class="preview-tag" id="previewTag"></div>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- ---------- carrito (boleta) ---------- -->
<div class="cart-backdrop" id="cartBackdrop" onclick="toggleCart(false)"></div>
<div class="cart-drawer" id="cartDrawer">
  <div class="cart-head">
    <button class="win-btn win-close cart-close" onclick="toggleCart(false)">×</button>
    <div class="receipt-brand">✦ NIKKOPPON ✦</div>
    <div class="receipt-sub">BOLETA DE PEDIDO</div>
    <div class="receipt-meta">
      <span id="receiptNumber">N° 0001</span>
      <span id="receiptDate">--/--/----</span>
    </div>
  </div>
  <div class="tear-line"></div>

  <!-- Vista 1: carrito -->
  <div id="cartView" class="cart-view">
    <div class="cart-items" id="cartItems">
      <div class="cart-empty">Todavía no agregaste ningún producto.</div>
    </div>
    <div class="tear-line"></div>
    <div class="cart-foot">
      <div class="barcode"></div>
      <div class="cart-total-row">
        <span class="label">TOTAL</span>
        <span class="val" id="cartTotal">$0</span>
      </div>
      <button class="add-btn" style="width:100%" onclick="goToCheckout()">Continuar con el pago</button>
      <p class="min-order-note">Compra mínima: $2.000</p>
    </div>
  </div>

  <!-- Vista 2: datos del cliente + pago -->
  <div id="checkoutView" class="cart-view" style="display:none">
    <div class="cart-items">
      <div class="field">
        <div class="field-label"><span class="num">1</span>Nombre y apellido</div>
        <input type="text" id="custName" class="text-input" placeholder="¿A nombre de quién va el pedido?">
      </div>

      <div class="field">
        <div class="field-label"><span class="num">2</span>Retiro o envío</div>
        <div class="chip-row">
          <button class="chip active" data-delivery="retiro" onclick="setDelivery('retiro')">Retiro en Valdivia</button>
          <button class="chip" data-delivery="envio" onclick="setDelivery('envio')">Envío a domicilio</button>
        </div>
        <div class="hint" id="deliveryHint">Coordinamos el punto y horario de retiro por Instagram.</div>
      </div>

      <div class="field" id="addressField" style="display:none">
        <div class="field-label"><span class="num">·</span>Dirección en Valdivia</div>
        <input type="text" id="custAddress" class="text-input" placeholder="Calle, número, sector">
        <div class="hint">Por ahora solo hacemos envíos dentro de Valdivia.</div>
      </div>

      <div class="field">
        <div class="field-label"><span class="num">3</span>Teléfono de contacto</div>
        <div class="prefixed-input">
          <span class="input-prefix">+56</span>
          <input type="tel" id="custPhone" class="text-input" placeholder="9 1234 5678">
        </div>
      </div>

      <div class="field">
        <div class="field-label"><span class="num">4</span>Tu Instagram</div>
        <div class="prefixed-input">
          <span class="input-prefix">@</span>
          <input type="text" id="custInstagram" class="text-input" placeholder="tu_usuario">
        </div>
        <div class="hint">Para contactarte y confirmar el pago.</div>
      </div>

      <div class="field" style="margin-bottom:0">
        <div class="field-label"><span class="num">5</span>Tu email</div>
        <input type="email" id="custEmail" class="text-input" placeholder="Para confirmar tu pedido" required>
      </div>
      <p class="privacy-note">Tus datos se usan solo para preparar y coordinar este pedido — no se comparten con terceros.</p>
    </div>
    <div class="tear-line"></div>
    <div class="cart-foot">
      <div class="cart-total-row" id="deliveryFeeRow" style="display:none">
        <span class="label">Envío a domicilio</span>
        <span class="val small" id="deliveryFeeVal">$0</span>
      </div>
      <div class="cart-total-row">
        <span class="label">TOTAL A TRANSFERIR</span>
        <span class="val" id="checkoutTotal">$0</span>
      </div>
      <label class="terms-check">
        <input type="checkbox" id="termsCheck">
        <span>Confirmo que la imagen que subí es mía o tengo permiso para usarla, y que no contiene contenido ofensivo, ilegal o que infrinja derechos de autor.</span>
      </label>
      <button class="add-btn" style="width:100%;margin-bottom:10px" id="confirmOrderBtn" onclick="confirmOrder()">Confirmar pedido</button>
      <button class="transfer-toggle" onclick="backToCart()">Volver al carrito</button>
    </div>
  </div>

  <!-- Vista 3: confirmación -->
  <div id="confirmationView" class="cart-view" style="display:none">
    <div class="cart-items">
      <div class="confirmation-box">
        <div class="confirmation-emoji">✦</div>
        <h3>¡Pedido enviado!</h3>
        <p>Ya registramos tu pedido <b id="confirmOrderNumber">N° 0000</b>. Ahora transfiere el total y envía tu comprobante por Instagram para confirmarlo.</p>
        <div class="countdown-box">
          <div class="countdown-label">Tienes 30 minutos para enviar tu comprobante</div>
          <div class="countdown-timer" id="countdownTimer">30:00</div>
          <div class="countdown-note">Pasado ese tiempo, el pedido se cancela automáticamente.</div>
        </div>
        <div class="transfer-box open" style="text-align:left">
          <div class="note">Datos para la transferencia. Recuerda realizar el pago para Confirmar tu pedido. Envia el comprobante con tu numero de Pedido! ╰(´︶`)╯♡.</div>
          <div class="row"><span>Titular</span><span>Nicole Navarro Amaro</span></div>
          <div class="row"><span>RUT</span><span>20119863-1</span></div>
          <div class="row"><span>Banco</span><span>Banco Estado</span></div>
          <div class="row"><span>Tipo de cuenta</span><span>CuentaRUT</span></div>
          <div class="row"><span>N° de cuenta</span><span>20119863</span></div>
          <div class="row"><span>Email</span><span>consuelon00@gmail.com</span></div>
        </div>
        <button class="add-btn" style="width:100%;margin-bottom:10px" onclick="openInstagramForProof()">Enviar comprobante por Instagram</button>
        <button class="transfer-toggle" onclick="closeConfirmation()">Cerrar</button>
      </div>
    </div>
  </div>
</div>

<div id="sparkleLayer"></div>

<button class="floating-cart-btn" id="floatingCartBtn" onclick="toggleCart(true)" style="display:none">
  🛒
  <span class="floating-cart-count" id="floatingCartCount">0</span>
</button>

<div class="undo-toast" id="undoToast">
  <span id="undoToastText">Producto quitado</span>
  <button onclick="undoRemoveItem()">Deshacer</button>
</div>

<script src="script.js"></script>
</body>
</html>
