describe('Flujo de Inicio de Sesión (Modal) - TFG', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.get('app-button')
      .contains(/Registrarse|Entrar/i)
      .click({ force: true });
    cy.get('mat-dialog-container').should('be.visible');
    cy.get('app-button')
      .contains(/Tengo una cuenta|Iniciar Sesión/i)
      .click({ force: true });
  });

  it('Debe mostrar error con credenciales incorrectas', () => {
    cy.intercept('POST', '**/auth/v1/token*').as('loginPost');
    cy.get('app-inputs[name="email"] input').type('correo_no_existe@test.com', { force: true });
    cy.get('app-inputs[name="password"] input').type('WrongPass123!', { force: true });
    cy.get('app-button')
      .contains(/Entrar/i)
      .click({ force: true });

    cy.wait('@loginPost').its('response.statusCode').should('eq', 400);
    cy.get('.text-red-500').should('be.visible');
  });

  it('Debe iniciar sesión correctamente como ADMINISTRADOR', () => {
    cy.intercept('POST', '**/auth/v1/token*').as('loginPost');
    cy.get('app-inputs[name="email"] input').type('admin@test.com', { force: true });
    cy.get('app-inputs[name="password"] input').type('13122000Teddy13@', { force: true });
    cy.get('app-button')
      .contains(/Entrar/i)
      .click({ force: true });
    cy.wait('@loginPost').its('response.statusCode').should('eq', 200);
    cy.get('mat-dialog-container', { timeout: 10000 }).should('not.exist');
    cy.url().should('include', '/home');

    cy.get('app-button, button')
      .contains(/Cerrar Sesión|Salir/i)
      .click({ force: true });

    cy.url().should('eq', Cypress.config().baseUrl + '/');
    cy.visit('/home');
    cy.url().should('not.include', '/home');
  });
});
