describe('Gestión Global de Servicios - Admin', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/rest/v1/Servicio*').as('fetchGlobalServices');
    cy.intercept('POST', '**/rest/v1/Servicio*').as('createGlobalService');
    cy.intercept('PATCH', '**/rest/v1/Servicio*').as('updateGlobalService');
    cy.intercept('DELETE', '**/rest/v1/Servicio*').as('deleteGlobalService');

    cy.login('admin@test.com', '13122000Teddy13@');
    cy.visit('/global-services');
    cy.wait('@fetchGlobalServices');
  });

  it('debe crear, editar y eliminar un servicio', () => {
    cy.get('app-inputs').find('input').eq(0).type('Servicio Base');
    cy.get('app-inputs').find('input').eq(1).type('Categoria Test');
    cy.get('app-button')
      .contains(/Añadir/i)
      .click();
    cy.wait('@createGlobalService');
    cy.get('tr.mat-mdc-row').should('have.length.at.least', 1);
    cy.get('tr.mat-mdc-row')
      .first()
      .within(() => {
        cy.get('app-button')
          .contains(/Editar/i)
          .click();
      });
    cy.get('app-button')
      .contains(/Guardar/i)
      .should('be.visible');
    cy.get('app-inputs').find('input').eq(0).clear().type('Servicio Modificado');
    cy.get('app-button')
      .contains(/Guardar/i)
      .click();
    cy.wait('@updateGlobalService').its('response.statusCode').should('be.oneOf', [200, 204]);
    cy.get('.text-primary').should('be.visible');
    cy.on('window:confirm', () => true);
    cy.get('tr.mat-mdc-row')
      .first()
      .within(() => {
        cy.get('app-button')
          .contains(/Eliminar/i)
          .click();
      });
    cy.wait('@deleteGlobalService');
    cy.get('.text-primary').should('be.visible');
  });
});
