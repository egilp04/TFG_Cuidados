describe('Ver mensaje: Empresa', () => {
  const msgSubject = 'Consulta de Servicio TFG';
  const nombreCliente = 'Cliente Prueba';
  const nombreEmpresa = 'Empresa Prueba Autoregistro';
  const msgContent = 'Hola, estoy interesado en reservar una actividad.';

  it('EMPRESA: Visualiza solo el mensaje RECIBIDO del cliente', () => {
    cy.intercept('GET', '**/rest/v1/Comunicacion*').as('cargarMensajes');

    cy.login('empresaCypress@test.com', '13122000Teddy13@');

    cy.url().should('include', '/home');
    cy.wait(1000);

    cy.visit('/messages');

    cy.wait('@cargarMensajes');
    cy.get('table', { timeout: 10000 }).should('be.visible');

    cy.get('tr, mat-row')
      .contains(new RegExp(msgSubject, 'i'))
      .parents('tr, mat-row')
      .filter(`:contains("${nombreCliente}")`)
      .first()
      .within(() => {
        cy.get('td.mat-column-Emisor')
          .invoke('text')
          .should('match', new RegExp(nombreCliente, 'i'));

        cy.get('td.mat-column-Receptor')
          .invoke('text')
          .should('match', new RegExp(nombreEmpresa, 'i'));

        cy.get('app-button').contains(/Ver/i).click({ force: true });
      });

    cy.get('textarea', { timeout: 7000 })
      .should('be.visible')
      .invoke('val')
      .should('match', new RegExp(msgContent, 'i'));
  });
});
