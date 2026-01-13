describe('Gestión Global de Horarios - Admin', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/rest/v1/Horario*').as('fetchGlobalTimes');
    cy.intercept('POST', '**/rest/v1/Horario*').as('createGlobalTime');
    cy.intercept('PATCH', '**/rest/v1/Horario*').as('updateGlobalTime');
    cy.intercept('DELETE', '**/rest/v1/Horario*').as('deleteGlobalTime');

    cy.login('admin@test.com', '13122000Teddy13@');
    cy.visit('/global-times');
    cy.wait('@fetchGlobalTimes');
  });

  it('debe crear un nuevo horario global', () => {
    cy.get('app-inputs').find('input[type="time"]').type('08:30');

    cy.get('select').select('Lunes');

    cy.get('app-button')
      .contains(/Añadir/i)
      .click();

    cy.wait('@createGlobalTime').its('response.statusCode').should('be.oneOf', [200, 201, 204]);
    cy.get('.text-primary').should('be.visible');
  });

  it('debe ver la lista y modificar un horario', () => {
    cy.get('tr.mat-mdc-row', { timeout: 10000 }).should('have.length.at.least', 1);

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
    cy.get('app-inputs').find('input[type="time"]').clear().type('22:00');
    cy.get('select').select('Sábado');
    cy.get('app-button')
      .contains(/Guardar/i)
      .click();
    cy.wait('@updateGlobalTime').its('response.statusCode').should('be.oneOf', [200, 204]);
    cy.get('.text-primary').should('be.visible');
  });

  it('debe eliminar un horario global', () => {
    cy.on('window:confirm', () => true);

    cy.get('tr.mat-mdc-row')
      .first()
      .within(() => {
        cy.get('app-button')
          .contains(/Eliminar/i)
          .click();
      });

    cy.wait('@deleteGlobalTime').its('response.statusCode').should('be.oneOf', [200, 204]);
    cy.get('.text-primary').should('be.visible');
  });
});
