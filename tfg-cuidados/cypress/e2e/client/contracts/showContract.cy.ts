describe('Contratos - Flujo de Cliente', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/Contrato?*').as('fetchContratos');
    cy.login('clientecypress@test.com', '13122000Teddy13@');

    cy.visit('/home');
    cy.url().should('include', '/home');
  });

  it('debe navegar a mis contratos y abrir el primero', () => {
    cy.get('app-button')
      .contains(/Servicios Contratados/i)
      .should('be.visible')
      .click();

    cy.url().should('include', '/contract');

    cy.wait('@fetchContratos', { timeout: 15000 });

    cy.get('mat-row, tr, .bg-white', { timeout: 10000 }).should('have.length.at.least', 1);

    cy.get('button')
      .filter(':has(mat-icon:contains("visibility")), :contains("Ver")')
      .first()
      .click();

    cy.get('mat-dialog-container')
      .should('be.visible')
      .within(() => {
        cy.contains('Cliente Prueba').should('be.visible');
        cy.contains('Empresa Prueba Autoregistro').should('be.visible');
        cy.contains('limpieza').should('be.visible');
      });

    cy.get('img[src*="cerrar"], [mat-dialog-close]').first().click();
  });
});
