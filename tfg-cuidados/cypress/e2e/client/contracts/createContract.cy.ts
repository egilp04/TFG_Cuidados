describe('Contratos - Flujo de Cliente', () => {
  const emailCliente = 'clientecypress@test.com';
  const passCliente = '13122000Teddy13@';

  const servicioEjemplo = {
    id_servicio_horario: '999',
    id_empresa: '2db369bb-ebd5-4a37-81ea-8ae3520e6fb6',
    precio: 50,
    estado: true,
    Servicio: { nombre: 'Limpieza de Hogar', tipo_servicio: 'Limpieza' },
    Horario: { hora: '10:00', dia_semana: 'Lunes' },
  };

  beforeEach(() => {
    cy.intercept('POST', '**/auth/v1/token*').as('loginPost');
    cy.intercept('GET', '**/rest/v1/Empresa?select=*Servicio_Horario*', {
      statusCode: 200,
      body: [
        {
          id_empresa: '2db369bb-ebd5-4a37-81ea-8ae3520e6fb6',
          Usuario: { nombre: 'Empresa Test', estado: true },
          Servicio_Horario: [servicioEjemplo],
        },
      ],
    }).as('buscarServicios');

    cy.intercept('POST', '**/rest/v1/Contrato*', {
      statusCode: 201,
      body: { id_contrato: '123' },
    }).as('apiCrearContrato');

    cy.login(emailCliente, passCliente);
    cy.wait('@loginPost');

    cy.contains(/servicios|buscar|contratar/i).click();
    cy.wait('@buscarServicios');
  });

  it('debe permitir buscar una empresa, seleccionar un horario y crear un contrato', () => {
    cy.get('app-searchbar input').should('be.visible').type('limpieza');

    cy.get('mat-card, .bg-white', { timeout: 10000 })
      .should('be.visible')
      .first()
      .within(() => {
       cy.get('select').select(1, { force: true });

        cy.get('app-button')
          .contains(/Contratar/i)
          .click({ force: true });
      });

    cy.wait('@apiCrearContrato').then((interception) => {
      expect(interception.response?.statusCode).to.eq(201);
    });

    cy.contains(/éxito|creado|correctamente/i).should('be.visible');
  });
});
