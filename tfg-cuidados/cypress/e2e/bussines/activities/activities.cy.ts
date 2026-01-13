describe('Actividades Empresa - Borrado Lógico', () => {
  const emailEmpresa = 'empresa_test@test.com';
  const passwordEmpresa = '13122000Teddy13@';

  beforeEach(() => {
    cy.intercept('POST', '**/auth/v1/token*').as('loginPost');
    cy.login(emailEmpresa, passwordEmpresa);
    cy.wait('@loginPost');
  });

  it('debe gestionar la agenda y realizar el borrado lógico de un servicio', () => {
    cy.visit('/activities');

    // Interceptar la actualización del contrato
    cy.intercept('PATCH', '**/rest/v1/Contrato*').as('patchContractEmpresa');

    // Abrir modal de cancelación desde la tabla
    cy.get('table[mat-table] mat-row')
      .first()
      .find('app-button')
      .contains(/cancelar/i)
      .click({ force: true });

    // Confirmar en el diálogo
    cy.get('mat-dialog-container')
      .last()
      .within(() => {
        cy.contains(/confirmar|sí|aceptar/i).click({ force: true });
      });

    // Validar el PATCH
    cy.wait('@patchContractEmpresa').its('response.statusCode').should('be.oneOf', [200, 204]);

    // Validar que el MessageService muestra el éxito
    cy.get('.text-primary').should('be.visible');
  });
});
