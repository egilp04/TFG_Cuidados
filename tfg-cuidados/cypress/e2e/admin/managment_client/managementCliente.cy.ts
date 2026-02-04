describe('ADMIN: Gestión de Clientes - Flujo Blindado', () => {
  const timestamp = Date.now();
  function generarDniValido(semilla: number): string {
    const numeroStr = semilla.toString().slice(-8).padEnd(8, '0');
    const numero = parseInt(numeroStr, 10);
    const letras = 'TRWAGMYFPDXBNJZSQVHLCKE';
    const letra = letras.charAt(numero % 23);
    return `${numero}${letra}`;
  }
  const dniValido = generarDniValido(timestamp);

  const usuarioTest = {
    nombre: `Cypress_${timestamp}`,
    ape1: 'Test',
    email: `cy_${timestamp}@test.com`,
    dni: dniValido,
    telefono: '600123456',
    password: 'Password123!',
    nuevoTelefono: '699999999',
  };

  beforeEach(() => {
    cy.intercept('GET', '**/rest/v1/Usuario*').as('getListaClientes');
    cy.intercept('POST', '**/auth/v1/signup*').as('signupUser');
    cy.intercept('POST', '**/rest/v1/rpc/update_profile_complete').as('updateProfile');
    cy.intercept('POST', '**/rest/v1/rpc/eliminar_usuario_total*').as('deleteUser');

    cy.login('admin@test.com', '13122000Teddy13@');

    cy.contains('app-button', /Usuarios|Clientes|Users/i).click();

    cy.wait('@getListaClientes');
    cy.url().should('include', 'tipo=cliente');
  });

  it('Debe completar el ciclo CRUD sin ser expulsado', () => {
    cy.contains('app-button', /crear|añadir|nuevo/i).click({ force: true });

    cy.get('app-inputs[name="nombre"] input').type(usuarioTest.nombre, { force: true });
    cy.get('app-inputs[name="ape1"] input').type(usuarioTest.ape1, { force: true });
    cy.get('app-inputs[name="ape2"] input').type('Apellido2', { force: true });
    cy.get('app-inputs[name="fechnac"] input').type('1990-01-01', { force: true }).blur();
    cy.get('app-inputs[name="dni"] input').type(usuarioTest.dni, { force: true });
    cy.get('app-inputs[name="telef"] input').type(usuarioTest.telefono, { force: true });
    cy.get('app-inputs[name="email"] input').type(usuarioTest.email, { force: true });
    cy.get('app-inputs[name="direccion"] input').type('Calle Test', { force: true });
    cy.get('app-inputs[name="localidad"] input').type('Madrid', { force: true });
    cy.get('app-inputs[name="codpostal"] input').type('28001', { force: true });

    cy.get('select[formControlName="comunidad"]').select(1, { force: true });

    cy.get('app-inputs[name="password"] input').type(usuarioTest.password, { force: true });
    cy.get('app-inputs[name="repassword"] input').type(usuarioTest.password, { force: true });

    cy.get('input[type="checkbox"]').check({ force: true });

    cy.contains('button', /registrar|finalizar|crear/i).click({ force: true });

    cy.wait('@signupUser').its('response.statusCode').should('be.oneOf', [200, 201]);

    cy.get('app-buttonback').click();
    cy.wait('@getListaClientes');

    cy.get('app-searchbar input').clear().type(usuarioTest.nombre, { delay: 100 });
    cy.wait(1000);
    cy.contains('td', usuarioTest.nombre).should('be.visible');

    cy.contains('tr', usuarioTest.nombre).within(() => {
      cy.get('app-button')
        .contains(/Modificar|Editar|Modify/i)
        .click({ force: true });
    });

    cy.url().should('include', '/modify-profile');

    cy.get('app-inputs[name="telefono"] input')
      .should('be.visible')
      .clear()
      .type(usuarioTest.nuevoTelefono);

    cy.contains('button', /guardar|modificar/i).click({ force: true });
    cy.wait('@updateProfile');

    cy.get('app-buttonback').click();
    cy.wait('@getListaClientes');

    cy.get('app-searchbar input').clear().type(usuarioTest.nombre, { delay: 100 });
    cy.wait(500);

    cy.contains('tr', usuarioTest.nombre).within(() => {
      cy.get('app-button')
        .contains(/Eliminar|Delete/i)
        .click({ force: true });
    });

    cy.get('mat-dialog-container')
      .should('be.visible')
      .within(() => {
        cy.contains('button', /eliminar|si|baja|confirmar/i).click({ force: true });
      });

    cy.wait('@deleteUser');

    cy.get('app-searchbar input').clear().type(usuarioTest.nombre);
    cy.contains('td', usuarioTest.nombre).should('not.exist');
  });
});
