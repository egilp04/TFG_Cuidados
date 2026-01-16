describe('Flujo de Recuperación de Contraseña - TFG', () => {
  describe('Fase 1: Solicitud desde el Modal', () => {
    beforeEach(() => {
      cy.visit('/');
      cy.get('app-button').contains('Iniciar Sesión').click({ force: true });
      cy.get('mat-dialog-container').should('be.visible');
      cy.get('app-button').contains('He olvidado mi contraseña').click({ force: true });
    });

    it('Debe enviar el correo de recuperación con éxito (Mocked)', () => {
      cy.intercept('POST', '**/auth/v1/recover*', {
        statusCode: 200,
        body: {},
      }).as('recoverPost');
      cy.get('app-inputs input').last().type('clienteCypress@test.com', { force: true });
      cy.get('app-button').contains('Enviar enlace').click({ force: true });
      cy.wait('@recoverPost');
      cy.contains('Enlace enviado. Revisa tu correo.').should('be.visible');
    });
  });
  describe('Fase 2: Cambio de Contraseña (Flujo Real)', () => {
    beforeEach(() => {
      cy.session('sesion-real', () => {
        cy.visit('/');
        cy.get('app-button').contains('Iniciar Sesión').click({ force: true });
        cy.get('app-inputs[name="email"] input').type('eveliagilparedes@test.com', {
          force: true,
        });
        cy.get('app-inputs[name="password"] input').type('13122000Teddy13@', { force: true });
        cy.get('app-button').contains('Entrar').click({ force: true });
        cy.contains('Cerrar Sesión').should('be.visible');
      });
      cy.visit('/recover-password');
    });

    it('Debe cambiar la contraseña realmente en la base de datos', () => {
      const nuevaPass = '13122000Teddy13@';
      cy.get('app-inputs[name="password"] input').type(nuevaPass, { force: true });
      cy.get('app-button').contains('Enviar').click({ force: true });
      cy.contains('¡Contraseña actualizada! Bienvenido de nuevo.', { timeout: 15000 }).should(
        'be.visible'
      );
      cy.url().should('eq', Cypress.config().baseUrl + '/');
    });
  });
});
