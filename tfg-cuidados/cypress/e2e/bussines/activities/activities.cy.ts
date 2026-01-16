describe('Actividades Empresa - Borrado Lógico', () => {
  const emailEmpresa = 'empresacypress@test.com';
  const passwordEmpresa = '13122000Teddy13@';

  beforeEach(() => {
    cy.intercept('POST', '**/auth/v1/token*').as('loginPost');
    cy.intercept('PATCH', '**/rest/v1/Contrato*').as('patchContractEmpresa');

    cy.login(emailEmpresa, passwordEmpresa);
    cy.wait('@loginPost');

    cy.url().should('include', '/home');
    cy.wait(1000);
  });

  it('debe gestionar la agenda y realizar el borrado lógico de un servicio', () => {
    cy.visit('/activities');

    cy.get('table[mat-table] mat-row')
      .first()
      .find('app-button')
      .contains(/cancelar/i)
      .click({ force: true });

    cy.get('mat-dialog-container')
      .last()
      .within(() => {
        cy.contains(/confirmar|sí|aceptar/i).click({ force: true });
      });

    cy.wait('@patchContractEmpresa').its('response.statusCode').should('be.oneOf', [200, 204]);

    cy.get('.text-primary').should('be.visible');
  });
});
