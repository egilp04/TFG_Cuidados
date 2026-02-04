describe('Contratos - Verificación de Estados Activos', () => {
  const emailCliente = 'clientecypress@test.com';
  const passCliente = '13122000Teddy13@';

  const contratoActivo = {
    id_contrato: 'activo-123',
    estado: 'activo',
    fecha_creacion: new Date().toISOString(),
    id_servicio_horario: {
      id_servicio_horario: 'sh-1',
      Servicio: { nombre: 'Servicio Activo' },
    },
    Empresa: { Usuario: { nombre: 'Empresa A' } },
    Cliente: { Usuario: { nombre: 'Cliente A' } },
  };

  beforeEach(() => {
    cy.intercept('POST', '**/auth/v1/token*').as('loginPost');

    cy.intercept('GET', '**/rest/v1/Contrato**', {
      statusCode: 200,
      body: [contratoActivo],
    }).as('getContratos');

    cy.intercept('PATCH', '**/rest/v1/Contrato**', {
      statusCode: 204,
      body: {},
    }).as('patchContrato');

    cy.login(emailCliente, passCliente);
    cy.wait('@loginPost');
    cy.url().should('include', '/home');
  });

  it('debe desaparecer de la tabla al ser cancelado', () => {
    cy.contains('app-button', /Servicios Contratados/i).click();
    cy.wait('@getContratos');

    cy.get('mat-row, tr[mat-row]').should('have.length', 1);

    cy.intercept('GET', '**/rest/v1/Contrato**', {
      statusCode: 200,
      body: [],
    }).as('getContratosVacios');

    cy.get('mat-row, tr[mat-row]')
      .first()
      .within(() => {
        cy.get('app-button')
          .contains(/Cancelar/i)
          .click({ force: true });
      });

    cy.get('mat-dialog-container').within(() => {
      cy.get('app-button')
        .contains(/Confirmar|Aceptar|cancelar contrato/i)
        .click({ force: true });
    });
    cy.wait('@patchContrato');
    cy.visit('/home');
    cy.contains('app-button', /Servicios Contratados/i).click();
    cy.wait('@getContratosVacios');

    cy.get('mat-row, tr[mat-row]').should('not.exist');
  });
});
