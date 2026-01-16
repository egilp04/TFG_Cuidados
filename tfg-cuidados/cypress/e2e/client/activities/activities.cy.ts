describe('Actividades Cliente - Borrado Lógico', () => {
  const emailUser = 'clientecypress@test.com';
  const passwordUser = '13122000Teddy13@';

  beforeEach(() => {
    cy.intercept('POST', '**/auth/v1/token*').as('loginPost');
    cy.login(emailUser, passwordUser);

    cy.url().should('include', '/home');
    cy.wait(1000);
  });

  it('debe visualizar eventos en el calendario y cancelar (borrado lógico) el primer contrato', () => {
    cy.visit('/activities');

    cy.get('.grid-cols-7', { timeout: 10000 }).should('be.visible');
    cy.get('.w-2.h-2.rounded-full').should('exist');

    cy.intercept('PATCH', '**/rest/v1/Contrato*').as('patchContract');

    cy.get('table[mat-table] mat-row')
      .first()
      .within(() => {
        cy.get('app-button')
          .contains(/cancelar/i)
          .click({ force: true });
      });

    cy.get('mat-dialog-container')
      .should('be.visible')
      .within(() => {
        cy.get('app-button')
          .filter(':contains("onfirmar"), :contains("ceptar"), :contains("Sí")')
          .click({ force: true });
      });

    cy.wait('@patchContract').its('response.statusCode').should('be.oneOf', [200, 204]);

    cy.get('.text-primary').should('be.visible').and('not.be.empty');
  });
});
