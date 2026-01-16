describe('Gestión Global de Horarios - Admin', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/rest/v1/Horario*').as('fetchGlobalTimes');
    cy.intercept('POST', '**/rest/v1/Horario*').as('createGlobalTime');
    cy.intercept('PATCH', '**/rest/v1/Horario*').as('updateGlobalTime');
    cy.intercept('DELETE', '**/rest/v1/Horario*').as('deleteGlobalTime');

    cy.login('admin@test.com', '13122000Teddy13@');

    cy.contains('app-button', /Horarios|Schedules/i).click();

    cy.wait('@fetchGlobalTimes');
    cy.url().should('include', '/global-times');
  });

  it('debe crear un nuevo horario global', () => {
    cy.get('app-inputs')
      .find('input[type="time"]')
      .should('be.visible')
      .type('08:30', { force: true })
      .blur();

    cy.get('select').select(1, { force: true });

    cy.wait(500);

    cy.get('app-button')
      .contains(/Añadir/i)
      .click({ force: true });

    cy.wait('@createGlobalTime').its('response.statusCode').should('be.oneOf', [200, 201, 204]);
  });

  it('debe ver la lista y modificar un horario', () => {
    cy.get('tr.mat-mdc-row', { timeout: 10000 }).should('have.length.at.least', 1);

    cy.get('tr.mat-mdc-row')
      .first()
      .within(() => {
        cy.get('app-button')
          .contains(/Editar/i)
          .click({ force: true });
      });

    cy.get('app-button')
      .contains(/Guardar/i)
      .should('be.visible');

    cy.get('app-inputs')
      .find('input[type="time"]')
      .clear({ force: true })
      .type('22:00', { force: true })
      .blur();

    cy.get('select').select(2, { force: true });

    cy.get('app-button')
      .contains(/Guardar/i)
      .click({ force: true });

    cy.wait('@updateGlobalTime').its('response.statusCode').should('be.oneOf', [200, 204]);
  });

  it('debe eliminar un horario global', () => {
    cy.get('tr.mat-mdc-row')
      .first()
      .within(() => {
        cy.get('app-button')
          .contains(/Eliminar/i)
          .click({ force: true });
      });

    cy.get('mat-dialog-container')
      .should('be.visible')
      .within(() => {
        cy.contains('button', /eliminar|si|confirmar/i).click({ force: true });
      });

    cy.wait('@deleteGlobalTime').its('response.statusCode').should('be.oneOf', [200, 204]);
  });
});
