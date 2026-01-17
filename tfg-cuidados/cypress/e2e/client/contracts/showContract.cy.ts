describe('Contratos - Flujo de Cliente', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/Contrato?*').as('fetchContratos');
    cy.login('clientecypress@test.com', '13122000Teddy13@');

    cy.url().should('include', '/home');
    cy.wait(1000);
  });

  it('debe navegar a mis contratos', () => {
    cy.get('app-button')
      .contains(/Servicios Contratados/i)
      .should('be.visible')
      .click();

    cy.url().should('include', '/contract');
  });
});
