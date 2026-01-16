describe('Mensajería - Enviar Mensaje Real', () => {
  const emailReceptorReal = 'clientecypress@test.com';

  beforeEach(() => {
    cy.intercept('POST', '**/auth/v1/token*').as('loginPost');
    cy.intercept('GET', '**/rest/v1/Comunicacion*', { body: [] }).as('getMensajes');
    cy.intercept('GET', '**/rest/v1/Usuario?select=*&email=eq.*').as('checkUser');
    cy.intercept('POST', '**/rest/v1/Comunicacion*').as('enviarMensaje');

    cy.login('empresaCypress@test.com', '13122000Teddy13@');

    cy.wait('@loginPost');
    cy.url().should('include', '/home');

    cy.get('nav lucide-icon').eq(0).click({ force: true });
    cy.wait('@getMensajes');
  });

  it('debe enviar un mensaje real y guardarlo en BBDD', () => {
    cy.contains('button', /Nuevo|Mensaje/i)
      .should('be.visible')
      .click();

    cy.get('app-inputs[name="receptor"] input').clear().type(emailReceptorReal, { force: true });

    cy.get('app-inputs[name="asunto"] input').type('Prueba Cypress Real ' + new Date().getTime(), {
      force: true,
    });

    cy.get('textarea').type('Este mensaje sí debería guardarse en la BBDD.', { force: true });

    cy.get('app-button')
      .contains(/Enviar|Send/i)
      .click({ force: true });

    cy.wait('@checkUser').its('response.statusCode').should('eq', 200);

    cy.wait('@enviarMensaje').then((interception) => {
      expect(interception.response?.statusCode).to.eq(201);
    });

    cy.get('.text-primary').should('be.visible');
  });
});
