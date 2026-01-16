it('Empresa: Borra el mensaje enviado por el CLIENTE (Bandeja de Entrada)', () => {
  const msgSubject = 'Consulta de Servicio TFG';
  const nombreCliente = 'Cliente Prueba';
  cy.intercept('PATCH', '**/rest/v1/Comunicacion*').as('borradoLogico');
  cy.intercept('GET', '**/rest/v1/Comunicacion*').as('getMensajes');

  cy.login('empresaCypress@test.com', '13122000Teddy13@');
  cy.visit('/messages');
  cy.wait('@getMensajes');

  cy.on('window:confirm', () => true);

  cy.get('tr, mat-row')
    .contains('td.mat-column-Emisor', nombreCliente)
    .closest('tr, mat-row')
    .should('contain', msgSubject)
    .within(() => {
      cy.get('app-button')
        .contains(/Borrar/i)
        .click({ force: true });
    });

  cy.wait('@borradoLogico').then((interception) => {
    expect(interception.request.body).to.have.property('eliminado_por_receptor', true);
  });

  cy.visit('/messages');
  cy.wait('@getMensajes');
});
