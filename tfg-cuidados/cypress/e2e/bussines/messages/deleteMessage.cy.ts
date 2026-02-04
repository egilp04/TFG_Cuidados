it('Empresa: Borra el PRIMER mensaje de la Bandeja de Entrada', () => {
  cy.intercept('PATCH', '**/rest/v1/Comunicacion*').as('borradoLogico');
  cy.intercept('GET', '**/rest/v1/Comunicacion*').as('getMensajes');
  cy.intercept('POST', '**/auth/v1/token*').as('loginPost');

  cy.login('empresaCypress@test.com', '13122000Teddy13@');
  cy.wait('@loginPost');
  cy.url().should('include', '/home');
  cy.get('nav lucide-icon').eq(0).click({ force: true });
  cy.wait('@getMensajes');
  cy.on('window:confirm', () => true);
  cy.get('mat-row, tr[mat-row]')
    .should('have.length.at.least', 1)
    .first()
    .within(() => {
      cy.get('app-button')
        .contains(/Borrar|Eliminar/i)
        .click({ force: true });
    });
  cy.wait('@borradoLogico').then((interception) => {
    const body = interception.request.body;
    const isDeleted = body.eliminado_por_receptor === true || body.eliminado_por_emisor === true;
    expect(isDeleted, 'Debe contener un campo de borrado lógico en true').to.be.true;
    expect(interception.response?.statusCode).to.be.oneOf([200, 204]);
  });
});
