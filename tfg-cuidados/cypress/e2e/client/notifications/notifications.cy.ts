describe('Notificaciones: Cliente', () => {
  it('CLIENTE: Visualiza sus notificaciones correctamente', () => {
    cy.intercept('GET', '**/rest/v1/Comunicacion*notificacion*').as('getNotificaciones');
    cy.login('cliente_nuevo@test.com', '13122000Teddy13@');
    cy.visit('/notifications');

    cy.wait('@getNotificaciones');
  });
});
