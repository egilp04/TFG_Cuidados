describe('Contratos - Flujo de Cliente', () => {
  beforeEach(() => {
    cy.login('clientecypress@test.com', '13122000Teddy13@');

    cy.url().should('include', '/home');
    cy.wait(1000);

    cy.visit('/search-business');
  });

  it('debe permitir buscar una empresa, seleccionar un horario y crear un contrato', () => {
    cy.intercept('POST', '**/rest/v1/Contrato*').as('apiCrearContrato');
    cy.get('app-searchbar input').type('limpieza{enter}');
    cy.get('mat-card, .bg-white')
      .first()
      .within(() => {
        cy.get('select').select(1);
        cy.get('app-button')
          .contains(/Contratar/i)
          .click();
      });

    cy.wait('@apiCrearContrato').then((interception) => {
      const body = interception.request.body;
      expect(body).to.have.property('id_servicio_horario');
      expect(body).to.have.property('id_cliente');
      expect(body).to.have.property('id_empresa');
      expect(interception.response?.statusCode).to.be.oneOf([200, 201]);
    });

    cy.get('.text-green-600').should('be.visible');
  });
});
