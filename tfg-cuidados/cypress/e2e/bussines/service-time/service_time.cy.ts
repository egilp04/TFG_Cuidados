describe('Gestión de Servicios y Horarios - Empresa', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/rest/v1/Servicio_Horario*').as('fetchServicios');
    cy.intercept('POST', '**/rest/v1/Servicio_Horario*').as('createServicio');
    cy.intercept('PATCH', '**/rest/v1/Servicio_Horario*').as('updateServicio');
    cy.intercept('DELETE', '**/rest/v1/Servicio_Horario*').as('deleteServicio');

    cy.login('empresaCypress@test.com', '13122000Teddy13@');
    cy.visit('/admin-services');
    cy.wait('@fetchServicios', { timeout: 10000 });
  });

  it('debe crear un nuevo servicio y horario', () => {
    cy.get('app-button').contains(/Nuevo/i).click();
    cy.get('app-service-time-modal', { timeout: 8000 }).should('exist');
    cy.get('app-inputs').find('input').eq(0).type('Servicio de Prueba', { force: true });
    cy.get('app-inputs').find('input').eq(1).clear({ force: true }).type('50', { force: true });
    cy.get('select').first().select(1, { force: true });
    cy.get('select').last().select(1, { force: true });
    cy.get('app-button')
      .contains(/crear oferta/i)
      .click();
    cy.wait('@createServicio');
    cy.get('.text-primary', { timeout: 10000 }).should('be.visible');
  });

  it('debe modificar un servicio existente', () => {
    cy.get('tr.mat-mdc-row', { timeout: 10000 })
      .should('have.length.at.least', 1)
      .first()
      .within(() => {
        cy.get('app-button')
          .contains(/Modificar/i)
          .click({ force: true });
      });
    cy.get('app-inputs').find('input').eq(1).clear({ force: true }).type('75', { force: true });
    cy.get('app-button')
      .contains(/actualizar cambios/i)
      .click();
    cy.wait('@updateServicio');
    cy.get('.text-primary').should('be.visible');
  });

  it('debe borrar un servicio', () => {
    cy.get('tr.mat-mdc-row', { timeout: 10000 })
      .should('have.length.at.least', 1)
      .first()
      .within(() => {
        cy.get('button')
          .contains(/Eliminar/i)
          .click({ force: true });
      });
    cy.get('app-cancelmodal', { timeout: 8000 }).should('exist');
    cy.get('mat-dialog-container')
      .find('app-button')
      .contains(/Confirmar|Eliminar/i)
      .click({ force: true });
    cy.wait('@deleteServicio');
    cy.get('.text-primary', { timeout: 10000 }).should('be.visible');
  });
});
