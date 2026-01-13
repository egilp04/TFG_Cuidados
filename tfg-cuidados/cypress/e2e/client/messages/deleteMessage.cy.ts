describe('Borrado de mensaje: Cliente-Empresa', () => {
  const msgSubject = 'Consulta de Servicio TFG';
  const nombreEmpresa = 'Empresa Prueba Autoregistro';

  it('CLIENTE: Borra un mensaje (Borrado Lógico)', () => {
    cy.intercept('PATCH', '**/rest/v1/Comunicacion*').as('borradoLogico');
    cy.intercept('GET', '**/rest/v1/Comunicacion*').as('getMensajes');

    cy.login('cliente_nuevo@test.com', '1234TeddY24.');
    cy.visit('/messages');

    cy.wait('@getMensajes');
    cy.on('window:confirm', () => true);

    // 1. Buscamos la fila de forma más flexible
    // Usamos una Regex para ignorar los espacios &nbsp; que genera Angular Material
    const regexEmpresa = new RegExp(nombreEmpresa.trim(), 'i');

    cy.get('tr, mat-row').each(($el) => {
      // Buscamos dentro de la fila la columna Emisor
      const emisorText = $el.find('.mat-column-Emisor').text().trim();
      const asuntoText = $el.find('.mat-column-Asunto').text().trim();

      if (emisorText.includes(nombreEmpresa) && asuntoText.includes(msgSubject)) {
        cy.wrap($el).within(() => {
          cy.get('app-button')
            .contains(/Borrar/i)
            .click({ force: true });
        });
      }
    });
    cy.wait('@borradoLogico').then((interception) => {
      expect(interception.response?.statusCode).to.be.oneOf([200, 204]);
    });
  });
});
