describe('Contratos - Cancelación de Servicio', () => {
  const contratoMock = {
    id_contrato: 'uuid-test-123',
    estado: 'activo',
    fecha_creacion: new Date().toISOString(),
    id_servicio_horario: {
      id_servicio_horario: 'sh-1',
      Servicio: { nombre: 'Servicio de Prueba' },
    },
    Empresa: {
      Usuario: { nombre: 'Empresa Test', email: 'empresa@test.com' },
    },
    Cliente: {
      Usuario: { nombre: 'Cliente Cypress', email: 'clientecypress@test.com' },
    },
  };

  beforeEach(() => {
    cy.intercept('POST', '**/auth/v1/token*').as('loginPost');
    cy.intercept('GET', '**/rest/v1/Contrato**', {
      statusCode: 200,
      body: [contratoMock],
    }).as('getContratos');

    cy.intercept('PATCH', '**/rest/v1/Contrato**', {
      statusCode: 204,
      body: {},
    }).as('patchContrato');

    cy.login('clientecypress@test.com', '13122000Teddy13@');
    cy.wait('@loginPost');
    cy.url().should('include', '/home');
  });

  it('debe navegar y cancelar el contrato desde Servicios Contratados', () => {
    cy.contains('app-button', /Servicios Contratados/i, { timeout: 10000 })
      .should('be.visible')
      .click();

    cy.url().should('include', '/contract');

    cy.wait('@getContratos');

    cy.get('mat-row, tr[mat-row], .mat-mdc-row', { timeout: 10000 })
      .should('have.length.at.least', 1)
      .first()
      .within(() => {
        cy.get('app-button')
          .contains(/Cancelar/i)
          .click({ force: true });
      });

    cy.get('mat-dialog-container', { timeout: 8000 })
      .should('be.visible')
      .within(() => {
        cy.get('app-button')
          .contains(/Confirmar|Aceptar|Cancelar contrato/i)
          .click({ force: true });
      });
    cy.wait('@patchContrato');
    cy.get('.text-primary', { timeout: 5000 }).should('be.visible');
  });
});
