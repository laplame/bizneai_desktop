# language: es
@clientes @pos @lista-espera @credito @cuenta-corriente
Característica: Módulo de clientes, cuenta corriente, venta a crédito y ciclo lista de espera
  Como cajero o administrador del POS
  Quiero gestionar clientes, adeudos, abonos y pedidos en lista de espera con inventario reservado
  Para cobrar correctamente y mantener coherencia de stock y cuenta corriente

  Antecedentes:
    Dado que la tienda tiene un shopId válido configurado
    Y que existen productos con stock suficiente en el catálogo local
    # Nota: la reserva valida stock por línea (unidades o peso según producto); si no alcanza, no se crea la entrada local

  # --- Registro y CRM local ---

  @clientes @ui
  Escenario: Consultar y filtrar clientes en gestión de clientes
    Dado que abro el modal "Gestión de Clientes"
    Entonces veo la lista de clientes cargada desde el registro local
    Cuando aplico filtros por nivel de membresía o estado CRM
    Entonces la tabla muestra solo los clientes que coinciden

  @clientes @mcp
  Escenario: Sincronizar listado de clientes con la nube (MCP) de forma manual
    Dado que el shopId no es provisional ni local-unconfigured
    Cuando pulso el botón de actualizar/sincronizar en "Gestión de Clientes"
    Entonces el cliente invoca GET de clientes vía proxy hacia bizneai.com
    Y fusiona los clientes remotos con el registro local
    Y persiste en la clave local "bizneai-customers-registry"
    Y opcionalmente refleja el snapshot en SQLite local según configuración

  @clientes @edicion
  Escenario: Marcar cliente con venta a crédito permitida y condiciones comerciales
    Dado un cliente existente en el registro
    Cuando edito el cliente y activo "allowCredit" / venta a crédito
    Y defino condiciones comerciales (por ejemplo límite de crédito)
    Entonces al guardar se persiste en el registro local
    Y si hay MCP configurado se intenta sincronizar alta o actualización remota

  # --- Cuenta corriente (ajustes de cuenta) ---

  @clientes @cuenta-corriente
  Escenario: Registrar un anticipo (abono a cuenta)
    Dado un cliente con saldo adeudado o sin movimientos previos
    Cuando abro "Ver detalles" del cliente
    Y en "Cuenta corriente" elijo concepto "anticipo"
    Y ingreso un monto válido mayor a cero
    Y confirmo "Registrar ajuste"
    Entonces se agrega un movimiento al libro "bizneai-customer-account-ledger"
    Y el saldo adeudado disminuye en el monto del anticipo
    Y se dispara el evento "customer-ledger-updated"

  @clientes @cuenta-corriente
  Escenario: Registrar una cobranza (cargo a cuenta)
    Dado un cliente seleccionado en detalle
    Cuando elijo concepto "cobranza" e ingreso monto y opcionalmente descripción
    Y confirmo el registro
    Entonces el saldo adeudado aumenta en el monto indicado

  @clientes @cuenta-corriente
  Escenario: Registrar cobro sobre nota (requiere ID de nota)
    Dado un cliente seleccionado en detalle
    Cuando elijo concepto "cobro_sobre_nota"
    Y no ingreso ID de nota
    Entonces el sistema rechaza el movimiento con mensaje de validación
    Cuando ingreso ID de nota, monto y confirmo
    Entonces el saldo adeudado disminuye y el movimiento queda asociado al "notaId"

  # --- POS: carrito, lista de espera, crédito ---

  @pos @lista-espera @inventario
  Escenario: Enviar carrito a lista de espera reserva inventario
    Dado un carrito con ítems y stock disponible
    Cuando elijo "Agregar a lista de espera"
    Entonces se crea una entrada en "bizneai-waitlist" con fulfillmentState "waitlist_reserved"
    Y se descuenta stock en "bizneai-products" según cantidades
    Y se guarda la reserva en "bizneai-waitlist-inventory-reservations"
    Y el carrito se vacía
    Y opcionalmente se intenta registrar la entrada en el servicio remoto de lista de espera; si falla la red, el pedido queda persistido solo en local

  @pos @lista-espera @inventario
  Escenario: Stock insuficiente impide agregar a lista de espera
    Dado un carrito cuya reserva excede el stock disponible en algún producto
    Cuando elijo "Agregar a lista de espera"
    Entonces el sistema no crea entrada local ni reserva
    Y muestra un mensaje de error indicando stock insuficiente

  @pos @lista-espera
  Escenario: Eliminar entrada de lista de espera libera inventario
    Dado una entrada en lista de espera con reserva activa
    Cuando elimino la entrada desde la tarjeta
    Entonces se restaura el stock reservado en el catálogo local
    Y se elimina el registro de reserva asociado al _id de la entrada

  @pos @lista-espera @checkout
  Escenario: Cargar pedido de lista de espera al carrito pasa a pendiente de cobro
    Dado una entrada con ítems y estado de cumplimiento "waitlist_reserved"
    Cuando pulso "Cargar al carrito"
    Entonces la entrada actualiza fulfillmentState a "pending_settlement"
    Y el POS guarda internamente la referencia al _id de la entrada para el próximo checkout

  @pos @credito @checkout
  Escenario: Checkout muestra "Diferir pago" cuando hay cliente del registro vinculado al carrito
    Dado un cliente vinculado al carrito (customerId del registro presente)
    Cuando abro el checkout
    Entonces veo la tarjeta de método "Diferir pago" orientada a historial de crédito / cuenta corriente

  @pos @credito @checkout
  Escenario: Diferir pago deshabilitado si el cliente no tiene venta a crédito activada
    Dado un cliente vinculado al carrito con allowCredit en false o indefinido
    Cuando abro el checkout
    Entonces la tarjeta "Diferir pago" aparece atenuada o no permite completar el flujo
    Cuando intento usar esa opción sin cumplir condiciones
    Entonces el sistema informa (p. ej. toast) que debe activarse venta a crédito en Gestión de clientes

  @pos @credito @checkout
  Escenario: Diferir pago completa venta a crédito cuando allowCredit está habilitado
    Dado un cliente vinculado al carrito con allowCredit en true
    Cuando abro el checkout
    Entonces la tarjeta "Diferir pago" está activa y puedo abrir el paso de confirmación
    Cuando confirmo el diferido (método interno de pago "credit")
    Entonces la venta se registra con método normalizado para API remota y nota de crédito
    Y se agrega al libro de cuenta una "cobranza" por el total de la venta
    Y se actualizan totales del cliente en registro local según la lógica existente

  @pos @lista-espera @checkout
  Escenario: Completar venta originada en lista de espera cierra el ciclo
    Dado que el carrito se cargó desde una entrada de lista de espera
    Cuando confirmo el checkout con cualquier método de pago válido (efectivo, tarjeta, otros o crédito si aplica)
    Entonces se consume la reserva lógica (sin volver a sumar stock)
    Y la entrada de lista de espera pasa a status "completed" y fulfillmentState "completed"
    Y el historial Merkle local incluye saleFulfillmentState "completed" cuando la venta estaba ligada a esa entrada

  @pos @checkout @regresion
  Escenario: Cerrar checkout sin pagar no debe cerrar una lista de espera ajena
    Dado que el usuario abrió checkout y lo cerró sin confirmar pago
    Cuando inicia un nuevo checkout con otro pedido
    Entonces no debe asociarse erróneamente a un _id de lista de espera previo abandonado
    # Comportamiento esperado: al cerrar el modal de checkout se limpia la referencia pendiente al _id de lista de espera
    # También se limpia esa referencia al vaciar el carrito; para cobrar el pedido hay que volver a "Cargar al carrito" desde la tarjeta
