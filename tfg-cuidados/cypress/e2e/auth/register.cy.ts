describe('Flujo de Registro - TFG', () => {
  const randomId = Math.floor(Math.random() * 100000);
  const emailEmpresa = `empresa_test_${randomId}@cypresstest.com`;
  it('Debe registrarse correctamente como EMPRESA', () => {
    cy.visit('/register', {
      onBeforeLoad(win) {
        Object.defineProperty(win.history, 'state', { value: { tipo: 'empresa' }, writable: true });
      },
    });
    cy.wait(1000);
    cy.get('app-inputs[name="nombreEmpresa"] input', { timeout: 10000 })
      .should('be.visible')
      .should('not.be.disabled')
      .click()
      .clear()
      .type('Limpiezas S.L.', { delay: 50 });
    cy.get('app-inputs[name="cif"] input').should('not.be.disabled').type('B12345674');
    cy.get('app-inputs[name="descripcion"]')
      .find('input, textarea')
      .type('Limpieza industrial', { force: true });
    cy.get('app-inputs[name="email"] input').type(emailEmpresa, { force: true });
    cy.get('app-inputs[name="telef"] input').type('600123456', { force: true });
    cy.get('app-inputs[name="direccion"] input').type('Polígono 1', { force: true });
    cy.get('app-inputs[name="localidad"] input').type('Barcelona', { force: true });
    cy.get('app-inputs[name="codpostal"] input').type('08001', { force: true });
    cy.get('select').select(1, { force: true }).should('not.have.value', 'null');
    cy.get('app-inputs[name="password"] input').type('Empresa123.', { force: true });
    cy.get('app-inputs[name="repassword"] input').type('Empresa123.', { force: true });
    cy.get('#terms').check({ force: true });
    cy.intercept('POST', '**/auth/v1/signup*').as('regEmpresa');
    cy.get('form').submit();
    cy.wait('@regEmpresa').its('response.statusCode').should('be.oneOf', [200, 201]);
  });
});
