describe('Actividades Empresa - Borrado Lógico', () => {
  const emailEmpresa = 'empresacypress@test.com';
  const passwordEmpresa = '13122000Teddy13@';
  beforeEach(() => {
    cy.intercept('POST', '**/auth/v1/token*').as('loginPost');
    cy.intercept('GET', '**/rest/v1/Contrato*').as('getGrid');
    cy.intercept('PATCH', '**/rest/v1/Contrato*').as('patchContractEmpresa');
    cy.login(emailEmpresa, passwordEmpresa);
    cy.wait('@loginPost');
    cy.url().should('include', '/home');
  });
  it('debe mostrar la lista de contratos/actividades', () => {
    cy.contains(/actividades programadas/i).click();
    cy.wait('@getGrid');
    cy.get('table').should('exist');
  });
});
