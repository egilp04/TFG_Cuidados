describe('Ver mensaje: Empresa', () => {
  const msgSubject = 'Consulta de Servicio TFG';
  const nombreCliente = 'Cliente Prueba';
  const nombreEmpresa = 'Empresa Prueba Autoregistro';
  const msgContent = 'Hola, estoy interesado en reservar una actividad.';

  it('EMPRESA: Visualiza solo el mensaje RECIBIDO del cliente', () => {
    cy.intercept('GET', '**/rest/v1/Comunicacion*').as('cargarMensajes');

    cy.login('empresa_nueva@test.com', '13122000Teddy13@');
    cy.visit('/messages');

    cy.wait('@cargarMensajes');
    cy.get('table', { timeout: 10000 }).should('be.visible');

    // 1. Buscamos específicamente la fila que contiene el asunto
    // Y que además contiene el nombre del Cliente en alguna parte (para filtrar)
    cy.get('tr, mat-row')
      .contains(new RegExp(msgSubject, 'i'))
      .parents('tr, mat-row')
      // Filtramos para quedarnos con la fila donde el EMISOR es el Cliente
      .filter(`:contains("${nombreCliente}")`)
      .first() // Por si acaso hubiera más de uno, cogemos el primero de este filtro
      .within(() => {
        // 2. Ahora validamos con seguridad que los roles son los correctos
        cy.get('td.mat-column-Emisor')
          .invoke('text')
          .should('match', new RegExp(nombreCliente, 'i'));

        cy.get('td.mat-column-Receptor')
          .invoke('text')
          .should('match', new RegExp(nombreEmpresa, 'i'));

        // 3. Hacemos clic en "Ver" de esa fila específica
        cy.get('app-button').contains(/Ver/i).click({ force: true });
      });

    // 4. Verificamos el contenido del mensaje
    cy.get('textarea', { timeout: 7000 })
      .should('be.visible')
      .invoke('val')
      .should('match', new RegExp(msgContent, 'i'));
  });
});
