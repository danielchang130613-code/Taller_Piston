const pb = new PocketBase('http://127.0.0.1:8090');
let ordenActual = null;

// --- TEMA ---
const btnTema = document.getElementById('btn-tema');
function aplicarTema() {
    const t = localStorage.getItem('tema') || 'light';
    if (t === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        btnTema.textContent = 'Modo Claro';
    } else {
        document.documentElement.removeAttribute('data-theme');
        btnTema.textContent = 'Modo Oscuro';
    }
}
btnTema.addEventListener('click', () => {
    const esDark = document.documentElement.getAttribute('data-theme') === 'dark';
    localStorage.setItem('tema', esDark ? 'light' : 'dark');
    aplicarTema();
});
aplicarTema();

// --- NAVEGACIÓN ---
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.vista').forEach(v => v.classList.remove('activa'));
        e.target.classList.add('active');
        document.getElementById(`vista-${e.target.dataset.view}`).classList.add('activa');

        if (e.target.dataset.view === 'ordenes') cargarOrdenes();
        if (e.target.dataset.view === 'inventario') cargarInventario();
        if (e.target.dataset.view === 'reportes') cargarReportes();
    });
});

// --- CARGAR ÓRDENES ---
async function cargarOrdenes() {
    const cont = document.getElementById('lista-ordenes');
    cont.innerHTML = '<p>Cargando...</p>';
    try {
        const ordenes = await pb.collection('ordenes').getFullList();
        cont.innerHTML = '';
        if (ordenes.length === 0) cont.innerHTML = '<p>No hay órdenes.</p>';

        for (const o of ordenes) {
            let veh = 'Sin vehículo';
            let cli = 'Desconocido';
            if (o.vehiculo_id) {
                const v = await pb.collection('vehiculos').getOne(o.vehiculo_id);
                veh = `${v.marca} ${v.modelo} (${v.placa})`;
                if (v.cliente_id) {
                    const c = await pb.collection('clientes').getOne(v.cliente_id);
                    cli = c.nombre;
                }
            }

            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <h3>${o.falla}</h3>
                <p><strong>Cliente:</strong> ${cli}</p>
                <p><strong>Vehículo:</strong> ${veh}</p>
                <p><strong>Mecánico:</strong> ${o.mecanico || 'Sin asignar'}</p>
                <p><strong>Estado:</strong> ${o.estado}</p>
                <button class="btn btn-detalle" data-id="${o.id}">Ver Detalle</button>
            `;
            cont.appendChild(card);
        }
        document.querySelectorAll('.btn-detalle').forEach(b => b.addEventListener('click', () => abrirModal(b.dataset.id)));
    } catch (e) { cont.innerHTML = '<p>Error al cargar órdenes.</p>'; console.error(e); }
}

// --- CARGAR INVENTARIO ---
async function cargarInventario() {
    const cont = document.getElementById('lista-repuestos');
    cont.innerHTML = '<p>Cargando...</p>';
    try {
        const reps = await pb.collection('repuestos').getFullList();
        cont.innerHTML = '';
        reps.forEach(r => {
            const alerta = r.stock <= 5 ? '<p class="alerta">⚠️ ¡Bajo stock!</p>' : '';
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <h3>${r.nombre}</h3>
                <p><strong>Código:</strong> ${r.codigo}</p>
                <p><strong>Precio:</strong> $${r.precio}</p>
                <p><strong>Stock:</strong> ${r.stock}</p>
                ${alerta}
            `;
            cont.appendChild(card);
        });
    } catch (e) { cont.innerHTML = '<p>Error al cargar inventario.</p>'; console.error(e); }
}

// --- NUEVO INGRESO ---
document.getElementById('form-ingreso').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.querySelector('#form-ingreso .btn');
    const msj = document.getElementById('msj-form');
    btn.disabled = true;
    msj.textContent = 'Guardando...';

    try {
        const cliente = await pb.collection('clientes').create({
            nombre: document.getElementById('cli-nombre').value,
            telefono: document.getElementById('cli-tel').value,
            direccion: document.getElementById('cli-dir').value
        });
        const vehiculo = await pb.collection('vehiculos').create({
            placa: document.getElementById('veh-placa').value,
            marca: document.getElementById('veh-marca').value,
            modelo: document.getElementById('veh-modelo').value,
            cliente_id: cliente.id
        });
        await pb.collection('ordenes').create({
            falla: document.getElementById('ord-falla').value,
            estado: 'Recibido',
            mecanico: document.getElementById('ord-mecanico').value,
            fecha: new Date().toISOString(),
            vehiculo_id: vehiculo.id
        });

        msj.textContent = '✅ Ingreso registrado con éxito.';
        msj.style.color = 'var(--success)';
        document.getElementById('form-ingreso').reset();
        cargarOrdenes();
    } catch (error) {
        msj.textContent = 'Error al guardar. Revisa la consola.';
        msj.style.color = 'var(--danger)';
        console.error(error);
    } finally {
        btn.disabled = false;
    }
});

// --- REPORTES ---
async function cargarReportes() {
    const ordenes = await pb.collection('ordenes').getFullList();
    const abiertas = ordenes.filter(o => o.estado !== 'Entregado');
    
    const mecanicos = {};
    abiertas.forEach(o => { const m = o.mecanico || 'Sin asignar'; mecanicos[m] = (mecanicos[m] || 0) + 1; });
    const divMec = document.getElementById('rep-mecanicos'); divMec.innerHTML = '';
    for (const [m, c] of Object.entries(mecanicos)) divMec.innerHTML += `<p><strong>${m}:</strong> ${c} órdenes</p>`;

    const clientes = await pb.collection('clientes').getFullList();
    const vehiculos = await pb.collection('vehiculos').getFullList();
    const trabajos = await pb.collection('trabajos').getFullList();
    const repUsados = await pb.collection('repuestos_usados').getFullList();
    const repuestos = await pb.collection('repuestos').getFullList();
    const pagos = await pb.collection('pagos').getFullList();

    const deudas = {};
    clientes.forEach(c => deudas[c.id] = { nombre: c.nombre, total: 0 });
    
    ordenes.forEach(o => {
        let totalOrden = 0;
        trabajos.filter(t => t.orden_id === o.id).forEach(t => totalOrden += t.costo);
        repUsados.filter(r => r.orden_id === o.id).forEach(r => {
            const rep = repuestos.find(x => x.id === r.repuesto_id);
            if (rep) totalOrden += rep.precio * r.cantidad;
        });
        const pagado = pagos.filter(p => p.orden_id === o.id).reduce((s, p) => s + p.monto, 0);
        const saldo = totalOrden - pagado;
        if (saldo > 0) {
            const v = vehiculos.find(v => v.id === o.vehiculo_id);
            if (v && deudas[v.cliente_id]) deudas[v.cliente_id].total += saldo;
        }
    });

    const divDeudas = document.getElementById('rep-deudas'); divDeudas.innerHTML = '';
    Object.values(deudas).filter(d => d.total > 0).forEach(d => {
        divDeudas.innerHTML += `<p><strong>${d.nombre}:</strong> $${d.total.toFixed(2)}</p>`;
    });

    const divStock = document.getElementById('rep-stock'); divStock.innerHTML = '';
    repuestos.filter(r => r.stock <= 5).forEach(r => {
        divStock.innerHTML += `<p class="alerta"><strong>${r.nombre}:</strong> ${r.stock} und.</p>`;
    });

    let facturaTotal = 0;
    trabajos.forEach(t => facturaTotal += t.costo);
    repUsados.forEach(r => {
        const rep = repuestos.find(x => x.id === r.repuesto_id);
        if (rep) facturaTotal += rep.precio * r.cantidad;
    });
    document.getElementById('rep-facturacion').innerHTML = `<p style="font-size:1.5rem;font-weight:bold;color:var(--primary)">$${facturaTotal.toFixed(2)}</p>`;
}

// --- MODAL DETALLE ---
async function abrirModal(id) {
    ordenActual = id;
    document.getElementById('modal-detalle').classList.remove('oculto');
    
    const o = await pb.collection('ordenes').getOne(id);
    let veh = 'Sin vehículo'; let cli = 'Desconocido';
    if (o.vehiculo_id) {
        const v = await pb.collection('vehiculos').getOne(o.vehiculo_id);
        veh = `${v.marca} ${v.modelo} (${v.placa})`;
        if (v.cliente_id) { const c = await pb.collection('clientes').getOne(v.cliente_id); cli = c.nombre; }
    }

    document.getElementById('modal-titulo').textContent = `Orden: ${o.falla}`;
    document.getElementById('modal-info').innerHTML = `
        <p><strong>Cliente:</strong> ${cli}</p>
        <p><strong>Vehículo:</strong> ${veh}</p>
        <p><strong>Mecánico:</strong> ${o.mecanico || 'Sin asignar'}</p>
        <p><strong>Estado:</strong> ${o.estado}</p>
    `;

    // Llenar select repuestos
    const reps = await pb.collection('repuestos').getFullList();
    const sel = document.getElementById('select-repuesto');
    sel.innerHTML = '<option value="">Selecciona repuesto</option>';
    reps.forEach(r => sel.innerHTML += `<option value="${r.id}">${r.nombre} (Stock: ${r.stock})</option>`);

    cargarListasModal();
}

async function cargarListasModal() {
    const id = ordenActual;
    const div = document.getElementById('modal-listas');
    div.innerHTML = '<p>Cargando...</p>';

    const trabajos = await pb.collection('trabajos').getFullList({ filter: `orden_id="${id}"` });
    const usados = await pb.collection('repuestos_usados').getFullList({ filter: `orden_id="${id}"` });
    const pagos = await pb.collection('pagos').getFullList({ filter: `orden_id="${id}"` });
    const repuestos = await pb.collection('repuestos').getFullList();

    let total = 0;
    let html = '';

    html += '<div class="seccion"><h4>Trabajos</h4><ul>';
    trabajos.forEach(t => { html += `<li><span>${t.descripcion}</span><span>$${t.costo}</span></li>`; total += t.costo; });
    html += '</ul></div>';

    html += '<div class="seccion"><h4>Repuestos</h4><ul>';
    usados.forEach(u => {
        const rep = repuestos.find(r => r.id === u.repuesto_id);
        const sub = rep ? rep.precio * u.cantidad : 0;
        html += `<li><span>${rep ? rep.nombre : '?'} x${u.cantidad}</span><span>$${sub.toFixed(2)}</span></li>`;
        total += sub;
    });
    html += '</ul></div>';

    let pagado = 0;
    html += '<div class="seccion"><h4>Pagos</h4><ul>';
    pagos.forEach(p => { html += `<li><span>Pago</span><span>$${p.monto}</span></li>`; pagado += p.monto; });
    html += '</ul></div>';

    const saldo = total - pagado;
    html += `
        <div class="total-box"><span>Total:</span><span>$${total.toFixed(2)}</span></div>
        <div class="total-box" style="background:var(--success)"><span>Pagado:</span><span>$${pagado.toFixed(2)}</span></div>
        <div class="total-box" style="background:${saldo > 0 ? 'var(--danger)' : 'var(--success)'}"><span>Saldo:</span><span>$${saldo.toFixed(2)}</span></div>
    `;

    div.innerHTML = html;
}

document.getElementById('btn-cerrar-modal').addEventListener('click', () => {
    document.getElementById('modal-detalle').classList.add('oculto');
    ordenActual = null;
});

// --- BOTONES MODAL ---
document.getElementById('btn-add-trabajo').addEventListener('click', async () => {
    const desc = document.getElementById('trabajo-desc').value;
    const costo = parseFloat(document.getElementById('trabajo-costo').value);
    if (!desc || isNaN(costo)) return alert('Llena los campos');
    await pb.collection('trabajos').create({ descripcion: desc, costo: costo, orden_id: ordenActual });
    document.getElementById('trabajo-desc').value = '';
    document.getElementById('trabajo-costo').value = '';
    cargarListasModal();
});

document.getElementById('btn-add-repuesto').addEventListener('click', async () => {
    const repId = document.getElementById('select-repuesto').value;
    const cant = parseInt(document.getElementById('rep-cantidad').value);
    if (!repId || isNaN(cant) || cant <= 0) return alert('Selecciona repuesto y cantidad');
    try {
        await pb.collection('repuestos_usados').create({ cantidad: cant, orden_id: ordenActual, repuesto_id: repId });
        document.getElementById('select-repuesto').value = '';
        document.getElementById('rep-cantidad').value = 1;
        cargarListasModal();
    } catch (e) { alert('Error: stock insuficiente.'); }
});

document.getElementById('btn-add-pago').addEventListener('click', async () => {
    const monto = parseFloat(document.getElementById('pago-monto').value);
    if (isNaN(monto) || monto <= 0) return alert('Monto inválido');
    await pb.collection('pagos').create({ monto: monto, orden_id: ordenActual });
    document.getElementById('pago-monto').value = '';
    cargarListasModal();
});

// Inicio
cargarOrdenes();