it('Admin puede ver la tabla de Empresas y las columnas son correctas', () => {
  cy.login('admin@test.com', '13122000Teddy13@');
  cy.visit('/admin-gestion?tipo=empresa');

  cy.get('table').should('be.visible');
  cy.contains('th', 'Apellidos').should('not.exist');
  cy.contains('th', 'Nombre').should('exist');
});
