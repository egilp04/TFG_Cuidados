describe('Perfil - Empresa', () => {
  beforeEach(() => {
    cy.intercept('POST', '**/rest/v1/rpc/update_profile_complete').as('updateProfile');
    cy.login('empresaCypress@test.com', '13122000Teddy13@');

    cy.url().should('include', '/home');
    cy.wait(1000);

    cy.visit('/modify-profile');
  });

  it('debe modificar el nombre de usuario de la empresa', () => {
    cy.get('app-inputs[name="nombreEmpresa"] input').clear().type('Empresa Actualizada cypress');

    cy.get('app-inputs[name="direccion"] input').clear().type('Calle Falsa 123');
    cy.get('app-inputs[name="localidad"] input').clear().type('Madrid');
    cy.get('app-inputs[name="codpostal"] input').clear().type('06700');

    cy.get('select').should('have.descendants', 'option').select(1);
    cy.contains('button', /Modificar/i)
      .should('not.be.disabled')
      .click();

    cy.wait('@updateProfile');
    cy.get('.text-primary').should('be.visible');
  });
});
