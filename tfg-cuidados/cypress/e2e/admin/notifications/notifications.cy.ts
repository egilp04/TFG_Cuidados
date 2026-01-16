describe('Notificaciones: Administrador', () => {
  it('Admin: Visualiza sus notificaciones correctamente', () => {
    cy.intercept('GET', '**/rest/v1/Comunicacion*notificacion*').as('getNotificaciones');
    cy.login('admin@test.com', '13122000Teddy13@');
    cy.url().should('include', '/home');
    cy.get('.lucide-bell, lucide-angular[name="bell"]').first().click({ force: true });
    cy.url().should('include', '/notifications');
    cy.wait('@getNotificaciones').its('response.statusCode').should('eq', 200);
  });
});
