describe('Admin: Ver el dashboard', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/Usuario?select=*').as('getUsuarios');
    cy.intercept('GET', '**/Contrato?select=*').as('getContratosStats');
    cy.login('admin@test.com', '13122000Teddy13@');
    cy.visit('/home');
  });

  it('debe navegar al dashboard y mostrar las gráficas con datos', () => {
    cy.contains('app-button', /Dashboard/i, { timeout: 10000 })
      .should('be.visible')
      .click();
    cy.url().should('include', '/dashboard');
    cy.wait(['@getUsuarios', '@getContratosStats']);
    cy.contains('h2', /Contratos/i).should('be.visible');
    cy.get('canvas').should('be.visible');
    cy.get('.bg-surface')
      .contains(/usuarios totales actuales/i)
      .find('span')
      .invoke('text')
      .then((text) => {
        const total = parseInt(text.trim());
        expect(total).to.be.at.least(0);
      });

    cy.get('.text-label').contains(/Total/i).should('be.visible');
  });
});
