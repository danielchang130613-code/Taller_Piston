/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  // 1. Clientes
  const clientes = new Collection({
    type: "base", name: "clientes",
    fields: [
      { name: "nombre", type: "text", required: true },
      { name: "telefono", type: "text", required: true },
      { name: "direccion", type: "text" },
    ],
    listRule: "", viewRule: "", createRule: "", updateRule: "", deleteRule: ""
  });
  app.save(clientes);

  // 2. Vehículos
  const vehiculos = new Collection({
    type: "base", name: "vehiculos",
    fields: [
      { name: "placa", type: "text", required: true },
      { name: "marca", type: "text", required: true },
      { name: "modelo", type: "text" },
      { name: "cliente_id", type: "relation", required: true, collectionId: clientes.id, maxSelect: 1, cascadeDelete: true },
    ],
    listRule: "", viewRule: "", createRule: "", updateRule: "", deleteRule: ""
  });
  app.save(vehiculos);

  // 3. Repuestos (Inventario)
  const repuestos = new Collection({
    type: "base", name: "repuestos",
    fields: [
      { name: "nombre", type: "text", required: true },
      { name: "codigo", type: "text", required: true },
      { name: "precio", type: "number", required: true },
      { name: "stock", type: "number", required: true },
    ],
    listRule: "", viewRule: "", createRule: "", updateRule: "", deleteRule: ""
  });
  app.save(repuestos);

  // 4. Órdenes
  const ordenes = new Collection({
    type: "base", name: "ordenes",
    fields: [
      { name: "falla", type: "text", required: true },
      { name: "estado", type: "select", values: ["Recibido", "Diagnóstico", "Reparación", "Listo", "Entregado"], maxSelect: 1 },
      { name: "mecanico", type: "text" },
      { name: "fecha", type: "date" },
      { name: "vehiculo_id", type: "relation", required: true, collectionId: vehiculos.id, maxSelect: 1, cascadeDelete: true },
    ],
    listRule: "", viewRule: "", createRule: "", updateRule: "", deleteRule: ""
  });
  app.save(ordenes);

  // 5. Trabajos (Mano de obra)
  const trabajos = new Collection({
    type: "base", name: "trabajos",
    fields: [
      { name: "descripcion", type: "text", required: true },
      { name: "costo", type: "number", required: true },
      { name: "orden_id", type: "relation", required: true, collectionId: ordenes.id, maxSelect: 1, cascadeDelete: true },
    ],
    listRule: "", viewRule: "", createRule: "", updateRule: "", deleteRule: ""
  });
  app.save(trabajos);

  // 6. Repuestos Usados
  const repuestos_usados = new Collection({
    type: "base", name: "repuestos_usados",
    fields: [
      { name: "cantidad", type: "number", required: true },
      { name: "orden_id", type: "relation", required: true, collectionId: ordenes.id, maxSelect: 1, cascadeDelete: true },
      { name: "repuesto_id", type: "relation", required: true, collectionId: repuestos.id, maxSelect: 1, cascadeDelete: true },
    ],
    listRule: "", viewRule: "", createRule: "", updateRule: "", deleteRule: ""
  });
  app.save(repuestos_usados);

  // 7. Pagos
  const pagos = new Collection({
    type: "base", name: "pagos",
    fields: [
      { name: "monto", type: "number", required: true },
      { name: "orden_id", type: "relation", required: true, collectionId: ordenes.id, maxSelect: 1, cascadeDelete: true },
    ],
    listRule: "", viewRule: "", createRule: "", updateRule: "", deleteRule: ""
  });
  app.save(pagos);

}, (app) => {
  app.delete(app.findCollectionByNameOrId("pagos"));
  app.delete(app.findCollectionByNameOrId("repuestos_usados"));
  app.delete(app.findCollectionByNameOrId("trabajos"));
  app.delete(app.findCollectionByNameOrId("ordenes"));
  app.delete(app.findCollectionByNameOrId("repuestos"));
  app.delete(app.findCollectionByNameOrId("vehiculos"));
  app.delete(app.findCollectionByNameOrId("clientes"));
});