describe('Actividades Cliente - Borrado Lógico', () => {
  const emailUser = 'cliente_nuevo@test.com';
  const passwordUser = '13122000Teddy13@';

  beforeEach(() => {
    cy.intercept('POST', '**/auth/v1/token*').as('loginPost');
    cy.login(emailUser, passwordUser);
    cy.wait('@loginPost');
  });

  it('debe visualizar eventos en el calendario y cancelar (borrado lógico) el primer contrato', () => {
    cy.visit('/activities');

    // 1. Validar el calendario: los días con contrato tienen puntos de colores
    cy.get('.grid-cols-7', { timeout: 10000 }).should('be.visible');
    cy.get('.w-2.h-2.rounded-full').should('exist'); // Puntos de evento

    // 2. Interceptar el PATCH del borrado lógico
    // Supabase usa PATCH para actualizaciones parciales (como poner activo = false)
    cy.intercept('PATCH', '**/rest/v1/Contrato*').as('patchContract');

    // 3. Click en Cancelar de la primera fila
    cy.get('table[mat-table] mat-row')
      .first()
      .within(() => {
        cy.get('app-button')
          .contains(/cancelar/i)
          .click({ force: true });
      });

    // 4. Confirmar en el Modal (Cancelmodal)
    cy.get('mat-dialog-container')
      .should('be.visible')
      .within(() => {
        cy.get('app-button')
          .filter(':contains("onfirmar"), :contains("ceptar"), :contains("Sí")')
          .click({ force: true });
      });

    // 5. Verificar que la petición PATCH fue exitosa (200 o 204)
    cy.wait('@patchContract').its('response.statusCode').should('be.oneOf', [200, 204]);

    // 6. Verificar mensaje de éxito en la interfaz
    cy.get('.text-primary').should('be.visible').and('not.be.empty');
  });
});
