describe('Perfil - Empresa', () => {
  beforeEach(() => {
    cy.intercept('POST', '**/auth/v1/token*').as('loginPost');
    cy.intercept('POST', '**/rest/v1/rpc/update_profile_complete').as('updateProfile');

    cy.login('empresaCypress@test.com', '13122000Teddy13@');

    cy.wait('@loginPost');
    cy.url().should('include', '/home');
    cy.get('nav lucide-icon').eq(2).click({ force: true });

    cy.url().should('include', '/modify-profile');
  });

  it('debe modificar el nombre de usuario de la empresa', () => {
    cy.get('app-inputs[name="nombreEmpresa"] input')
      .should('exist')
      .first()
      .clear({ force: true })
      .type('Empresa Actualizada cypress', { force: true });

    cy.get('app-inputs[name="direccion"] input').clear({ force: true }).type('Calle Falsa 123', { force: true });
    cy.get('app-inputs[name="localidad"] input').clear({ force: true }).type('Madrid', { force: true });
    cy.get('app-inputs[name="codpostal"] input').clear({ force: true }).type('06700', { force: true });

    cy.get('select').should('have.descendants', 'option').select(1, { force: true });

    cy.contains('button', /Modificar|Guardar/i)
      .should('not.be.disabled')
      .click({ force: true });

    cy.wait('@updateProfile');
    cy.get('.text-primary', { timeout: 10000 }).should('be.visible');
  });
});
