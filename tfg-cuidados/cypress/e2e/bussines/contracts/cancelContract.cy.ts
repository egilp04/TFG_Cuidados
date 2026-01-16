describe('Contratos - Cancelación de Servicio', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/Contrato?*').as('getContratos');
    cy.intercept('PATCH', '**/Contrato?*').as('patchContrato');

    cy.login('empresaCypress@test.com', '13122000Teddy13@');
    cy.visit('/home');
  });

  it('debe navegar y cancelar el contrato desde Servicios Contratados', () => {
    cy.contains('app-button', /ver todos los contratos/i, { timeout: 10000 })
      .should('be.visible')
      .click();
    cy.url().should('include', '/contract');

    cy.wait('@getContratos');

    cy.get('mat-table, table, [role="grid"]', { timeout: 10000 })
      .should('be.visible')
      .find('mat-row, tr[mat-row], .mat-mdc-row')
      .filter(':visible')
      .first()
      .within(() => {
        cy.get('app-button')
          .contains(/Cancelar/i)
          .click({ force: true });
      });

    cy.get('mat-dialog-container', { timeout: 8000 })
      .should('be.visible')
      .within(() => {
        cy.contains('app-button', /Confirmar|Cancelar contrato/i).click({ force: true });
      });

    cy.wait('@patchContrato').then((interception) => {
      expect(interception.request.body.estado).to.equal('no activo');
      expect(interception.response?.statusCode).to.be.oneOf([200, 204]);
    });
    cy.get('.text-primary', { timeout: 5000 }).should('be.visible');
  });
});
