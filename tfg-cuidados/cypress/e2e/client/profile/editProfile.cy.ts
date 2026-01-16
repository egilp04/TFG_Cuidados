describe('Perfil - Cliente', () => {
  beforeEach(() => {
    cy.intercept('POST', '**/auth/v1/token*').as('loginPost');
    cy.intercept('POST', '**/rest/v1/rpc/update_profile_complete').as('updateProfile');
    cy.login('clientecypress@test.com', '13122000Teddy13@');
    cy.wait('@loginPost');
    cy.url().should('include', '/home');
    cy.get('nav lucide-icon').eq(2).click({ force: true });

    cy.url().should('include', '/modify-profile');
  });

  it('debe modificar el nombre de usuario del cliente', () => {
    cy.get('app-inputs[name="usuario"] input').should('exist').clear().type('Cliente Actualizado');
    cy.get('app-inputs[name="direccion"] input').clear().type('Calle Falsa 123');
    cy.get('app-inputs[name="localidad"] input').clear().type('Madrid');
    cy.get('app-inputs[name="codpostal"] input').clear().type('06700');
    cy.get('select').select(1, { force: true });

    cy.contains('button', /Modificar|Guardar/i)
      .should('not.be.disabled')
      .click({ force: true });
    cy.wait('@updateProfile');
    cy.get('.text-primary').should('be.visible');
  });
});
