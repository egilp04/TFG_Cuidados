describe('Flujo de Mensajería - Bandeja de Entrada', () => {
  const msgSubject = 'Consulta de Servicio TFG';
  const nombreCliente = 'Cliente Prueba';

  beforeEach(() => {
    // Interceptores específicos de comunicación
    cy.intercept('GET', '**/rest/v1/Comunicacion*').as('getMensajes');
    cy.intercept('PATCH', '**/rest/v1/Comunicacion*').as('borradoLogico');

    // Login como Empresa (Receptor)
    cy.login('empresa_nueva@test.com', '13122000Teddy13@');
    cy.visit('/messages');
    cy.wait('@getMensajes');
  });

  it('debe listar los mensajes recibidos correctamente', () => {
    cy.get('tr.mat-mdc-row').should('have.length.at.least', 1);
    cy.contains('td', nombreCliente).should('be.visible');
  });

  it('debe borrar (borrado lógico) un mensaje del cliente', () => {
    // Aceptar confirmación nativa de JavaScript
    cy.on('window:confirm', () => true);

    // Buscar la fila del mensaje por el nombre del emisor
    cy.contains('td.mat-column-Emisor', nombreCliente)
      .closest('tr')
      .should('contain', msgSubject)
      .within(() => {
        cy.get('app-button')
          .contains(/Borrar/i)
          .click({ force: true });
      });

    // Validar que la petición PATCH envía el flag correcto a Supabase
    cy.wait('@borradoLogico').then((interception) => {
      expect(interception.request.body).to.have.property('eliminado_por_receptor', true);
      expect(interception.response?.statusCode).to.be.oneOf([200, 204]);
    });

    // Verificar que el mensaje desaparece de la vista
    cy.get('table').should('not.contain', msgSubject);
  });
});
