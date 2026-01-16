describe('Ver mensaje: Cliente', () => {
  const msgSubject = 'Consulta de Servicio TFG';
  const nombreCliente = 'Cliente Prueba';
  const nombreEmpresa = 'Empresa Prueba Autoregistro';
  const msgContent = 'Hola, tengo un duda sobre su direccion.';

  it('CLIENTE: Recibe y visualiza el mensaje de la empresa', () => {
    cy.intercept('GET', '**/rest/v1/Comunicacion*').as('cargarMensajes');
    cy.login('clientecypress@test.com', '13122000Teddy13@');

    cy.url().should('include', '/home');
    cy.wait(1000);

    cy.visit('/messages');

    cy.wait('@cargarMensajes');
    cy.get('table', { timeout: 10000 }).should('be.visible');

    cy.get('td.mat-column-Emisor')
      .contains(new RegExp(nombreEmpresa, 'i'))
      .parents('tr, mat-row')
      .filter(`:contains("${msgSubject}")`)
      .within(() => {
        cy.get('td.mat-column-Emisor').should('contain', nombreEmpresa);
        cy.get('td.mat-column-Receptor').should('contain', nombreCliente);

        cy.get('app-button').contains(/Ver/i).click({ force: true });
      });

    cy.get('textarea', { timeout: 7000 })
      .should('be.visible')
      .invoke('val')
      .should('match', new RegExp(msgContent, 'i'));
  });
});
