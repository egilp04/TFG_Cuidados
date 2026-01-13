describe('Envío de mensaje: Cliente-Empresa', () => {
  const msgSubject = 'Consulta de Servicio TFG';
  const msgContent = 'Hola, estoy interesado en reservar una actividad.';

  it('CLIENTE: Envía mensaje a la Empresa', () => {
    cy.intercept('GET', '**/rest/v1/Usuario*').as('getReceptor');
    cy.intercept('POST', '**/rest/v1/Comunicacion*').as('postMensaje');
    cy.login('cliente_nuevo@test.com', '13122000Teddy13@');
    cy.visit('/messages');
    cy.get('button').find('img[src*="editar"]').click({ force: true });
    cy.get('app-inputs').eq(0).find('input').type('empresa_nueva@test.com', { force: true });
    cy.get('app-inputs').eq(1).find('input').type(msgSubject, { force: true });
    cy.get('textarea').type(msgContent, { force: true });
    cy.get('app-button').contains('Enviar').click();
    cy.wait('@getReceptor');
    cy.wait('@postMensaje', { timeout: 10000 }).then((interception) => {
      expect(interception.response?.statusCode).to.be.oneOf([200, 201, 204]);
    });
    cy.contains(/correctamente|éxito/i).should('be.visible');
  });
});
