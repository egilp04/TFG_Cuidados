describe('Gestión de Empresas - Admin', () => {
  it('Admin puede ver la tabla de Empresas y las columnas son correctas', () => {
    cy.login('admin@test.com', '13122000Teddy13@');
    cy.url().should('include', '/home');
    cy.contains(/Gestión|Admin|Empresas/i).click();
    cy.url().should('include', '/admin-gestion');
    cy.get('table', { timeout: 10000 }).should('be.visible');
    cy.contains('th', 'Nombre').should('exist');
    cy.contains('th', 'Apellidos').should('not.exist');
  });
});
