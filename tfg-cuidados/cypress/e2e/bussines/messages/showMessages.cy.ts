describe('Ver mensaje: Empresa', () => {
  it('EMPRESA: Visualiza solo el mensaje RECIBIDO del cliente', () => {
    cy.intercept('POST', '**/auth/v1/token*').as('loginPost');
    cy.intercept('GET', '**/rest/v1/Comunicacion*').as('cargarMensajes');

    cy.login('clienteCypress@test.com', '13122000Teddy13@');

    cy.wait('@loginPost');
    cy.url().should('include', '/home');

    cy.get('nav lucide-icon').eq(0).click({ force: true });

    cy.wait('@cargarMensajes');
  });
});
