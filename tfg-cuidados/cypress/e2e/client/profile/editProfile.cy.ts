describe('Perfil - Cliente', () => {
  beforeEach(() => {
    cy.intercept('POST', '**/rest/v1/rpc/update_profile_complete').as('updateProfile');
    cy.login('clientecypress@test.com', '13122000Teddy13@');
    cy.visit('/modify-profile');
  });

  it('debe modificar el nombre de usuario del cliente', () => {
    cy.get('app-inputs[name="usuario"] input').clear().type('Cliente Actualizado');

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
