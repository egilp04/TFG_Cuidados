describe('Flujo de Registro - TFG', () => {
  const emailCliente = `cliente_test@cypresstest.com`;
  it('Debe registrarse correctamente como CLIENTE', () => {
    cy.visit('/register', {
      onBeforeLoad(win) {
        Object.defineProperty(win.history, 'state', {
          value: { tipo: 'cliente' },
          writable: true,
        });
      },
    });

    cy.intercept('POST', '**/auth/v1/signup*').as('registroPost');

    cy.get('app-inputs[name="nombre"] input').type('Juan', { force: true }).blur();
    cy.get('app-inputs[name="email"] input').type(emailCliente, { force: true });
    cy.get('app-inputs[name="telef"] input').type('600000000', { force: true }).blur();
    cy.get('app-inputs[name="ape1"] input').type('García', { force: true }).blur();
    cy.get('app-inputs[name="ape2"] input').type('Rodríguez', { force: true }).blur();
    cy.get('app-inputs[name="dni"] input').type('53988094X', { force: true }).blur();
    cy.get('app-inputs[name="fechnac"] input').type('1992-05-20').trigger('change');
    cy.get('app-inputs[name="direccion"] input').type('Calle Falsa 123', { force: true });
    cy.get('app-inputs[name="localidad"] input').type('Madrid', { force: true });
    cy.get('app-inputs[name="codpostal"] input').type('28001', { force: true });
    cy.get('select').select(1, { force: true });
    cy.get('app-inputs[name="password"] input').type('Password123!', { force: true });
    cy.get('app-inputs[name="repassword"] input').type('Password123!', { force: true });

    cy.get('#terms').check({ force: true });
    cy.wait(500);
    cy.get('form').submit();
    cy.wait('@registroPost').its('response.statusCode').should('be.oneOf', [200, 201]);
  });
});
