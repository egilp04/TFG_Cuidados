describe('Flujo de Baja - Empresa', () => {
  const emailEmpresa = 'empresa_tes@cypresstest.com';
  const passwordEmpresa = 'Empresa123!';

  beforeEach(() => {
    cy.intercept('POST', '**/auth/v1/token*').as('loginPost');
    cy.login(emailEmpresa, passwordEmpresa);
    cy.wait('@loginPost').its('response.statusCode').should('eq', 200);
  });

  it('debe navegar a modify-profile y eliminar la cuenta usando RPC', () => {
    cy.visit('/modify-profile');
    cy.url().should('include', '/modify-profile');
    cy.intercept('POST', '**/rest/v1/rpc/eliminar_usuario_total*').as('deleteUserRPC');
    cy.contains('app-button', /darse de baja|eliminar cuenta/i, { timeout: 12000 })
      .scrollIntoView()
      .click({ force: true });

    // 3. Manejo del Modal de Confirmación
    cy.get('mat-dialog-container', { timeout: 10000 })
      .last()
      .should('be.visible')
      .within(() => {
        // Buscamos el botón de confirmación
        cy.get('app-button')
          .filter(':contains("Cancelar registro")')
          .should('be.visible')
          .click({ force: true });
      });

    // 4. Verificación de la llamada RPC
    // Según tus logs, devuelve un 204
    cy.wait('@deleteUserRPC', { timeout: 15000 })
      .its('response.statusCode')
      .should('be.oneOf', [200, 204]);

    // 5. Verificar que redirige a la landing
    cy.url().should('eq', Cypress.config().baseUrl + '/');
  });
});
