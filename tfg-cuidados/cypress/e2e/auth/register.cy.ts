describe('Flujo de Registro - TFG', () => {
  const emailEmpresa = `empresa_tes@cypresstest.com`;

  it('Debe registrarse correctamente como EMPRESA', () => {
    cy.visit('/register', {
      onBeforeLoad(win) {
        Object.defineProperty(win.history, 'state', { value: { tipo: 'empresa' }, writable: true });
      },
    });

    cy.get('app-inputs[name="nombreEmpresa"] input').type('Limpiezas S.L.', { force: true });
    cy.get('app-inputs[name="cif"] input').type('C11841145', { force: true });
    cy.get('app-inputs[name="descripcion"] input').type('Limpieza industrial', { force: true });
    cy.get('app-inputs[name="email"] input').type(emailEmpresa, { force: true });
    cy.get('app-inputs[name="telef"] input').type('912344556', { force: true });
    cy.get('app-inputs[name="direccion"] input').type('Polígono 1', { force: true });
    cy.get('app-inputs[name="localidad"] input').type('Barcelona', { force: true });
    cy.get('app-inputs[name="codpostal"] input').type('08001', { force: true });
    cy.get('select').select(1, { force: true });
    cy.get('app-inputs[name="password"] input').type('Empresa123!', { force: true });
    cy.get('app-inputs[name="repassword"] input').type('Empresa123!', { force: true });
    cy.get('#terms').check({ force: true });

    cy.intercept('POST', '**/auth/v1/signup*').as('regEmpresa');
    cy.get('form').submit();
    cy.wait('@regEmpresa').its('response.statusCode').should('be.oneOf', [200, 201]);
  });
});
