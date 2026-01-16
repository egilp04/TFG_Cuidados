describe('Envío de mensaje: Cliente-Empresa', () => {
  const msgSubject = 'Consulta de Servicio TFG';
  const msgContent = 'Hola, estoy interesado en reservar una actividad.';
  const emailEmpresaDestino = 'empresacypress@test.com';

  beforeEach(() => {
    cy.intercept('POST', '**/auth/v1/token*').as('loginPost');
    cy.intercept('GET', '**/rest/v1/Comunicacion*', { body: [] }).as('getMensajes');
    cy.intercept('GET', '**/rest/v1/Usuario?select=*&email=eq.*').as('checkUser');
    cy.intercept('POST', '**/rest/v1/Comunicacion*').as('postMensaje');

    cy.login('clientecypress@test.com', '13122000Teddy13@');

    cy.wait('@loginPost');
    cy.url().should('include', '/home');

    cy.get('nav lucide-icon').eq(0).click({ force: true });
    cy.wait('@getMensajes');
  });

  it('CLIENTE: Envía mensaje a la Empresa', () => {
    cy.contains('button', /Nuevo|Mensaje/i)
      .should('be.visible')
      .click();

    cy.get('app-inputs[name="receptor"] input').clear().type(emailEmpresaDestino, { force: true });

    cy.get('app-inputs[name="asunto"] input').type(msgSubject, { force: true });

    cy.get('textarea').type(msgContent, { force: true });

    cy.get('app-button')
      .contains(/Enviar|Send/i)
      .click({ force: true });

    cy.wait('@checkUser').its('response.statusCode').should('eq', 200);

    cy.wait('@postMensaje').then((interception) => {
      expect(interception.response?.statusCode).to.be.oneOf([200, 201]);
    });

    cy.get('.text-primary').should('be.visible');
  });
});
