describe('Gestión Global de Servicios - Admin', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/rest/v1/Servicio*').as('fetchGlobalServices');
    cy.intercept('POST', '**/rest/v1/Servicio*').as('createGlobalService');
    cy.intercept('PATCH', '**/rest/v1/Servicio*').as('updateGlobalService');
    cy.intercept('DELETE', '**/rest/v1/Servicio*').as('deleteGlobalService');
    cy.login('admin@test.com', '13122000Teddy13@');
    cy.contains('app-button', /Servicios|Services/i).click();
    cy.wait('@fetchGlobalServices');
    cy.url().should('include', '/global-services');
  });

  it('debe crear, editar y eliminar un servicio', () => {
    cy.get('app-inputs[name="nombre"] input')
      .should('be.visible')
      .type('Servicio Base', { force: true })
      .blur();
    cy.get('app-inputs').find('input').eq(1).type('Categoria Test', { force: true }).blur();
    cy.wait(500);
    cy.contains('app-button', /Añadir/i)
      .should('not.have.class', 'disabled')
      .click({ force: true });
    cy.wait('@createGlobalService').its('response.statusCode').should('be.oneOf', [200, 201, 204]);
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
    cy.get('app-inputs')
      .find('input')
      .eq(0)
      .clear({ force: true })
      .type('Servicio Modificado', { force: true })
      .blur();
    cy.get('app-button')
      .contains(/Guardar/i)
      .click();
    cy.wait('@updateGlobalService').its('response.statusCode').should('be.oneOf', [200, 204]);
    cy.wait(500);
    cy.get('tr.mat-mdc-row')
      .first()
      .within(() => {
        cy.get('app-button')
          .contains(/Eliminar/i)
          .click();
      });
    cy.get('mat-dialog-container')
      .should('be.visible')
      .within(() => {
        cy.contains('button', /eliminar|si|confirmar/i).click({ force: true });
      });
    cy.wait('@deleteGlobalService').its('response.statusCode').should('be.oneOf', [200, 204]);
    cy.contains('Servicio Modificado').should('not.exist');
  });
});
