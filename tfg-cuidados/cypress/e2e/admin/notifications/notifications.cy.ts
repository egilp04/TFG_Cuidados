describe('Notificaciones: Cliente', () => {
  it('Admin: Visualiza sus notificaciones correctamente', () => {
    cy.intercept('GET', '**/rest/v1/Comunicacion*notificacion*').as('getNotificaciones');
    cy.login('admin@test.com', '13122000Teddy13@');
    cy.visit('/notifications');
    cy.wait('@getNotificaciones');
  });
});
