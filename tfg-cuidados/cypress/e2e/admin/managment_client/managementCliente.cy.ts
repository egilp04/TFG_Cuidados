// Función auxiliar para calcular DNI válido
function generarDniValido(semilla: number): string {
  const numeroStr = semilla.toString().slice(-8).padEnd(8, '0');
  const numero = parseInt(numeroStr, 10);
  const letras = 'TRWAGMYFPDXBNJZSQVHLCKE';
  const letra = letras.charAt(numero % 23);
  return `${numero}${letra}`;
}

describe('ADMIN: Gestión de Clientes - Flujo Blindado', () => {
  const timestamp = Date.now();
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
    cy.intercept('GET', '**/rest/v1/Usuario*Cliente*').as('getListaClientes');

    cy.intercept('POST', '**/auth/v1/signup*').as('signupUser');
    cy.intercept('POST', '**/rest/v1/rpc/update_profile_complete').as('updateProfile');
    cy.intercept('POST', '**/rest/v1/rpc/eliminar_usuario_total*').as('deleteUser');

    cy.login('admin@test.com', '13122000Teddy13@');
  });

  it('Debe completar el ciclo CRUD (Crear -> Leer -> Modificar -> Eliminar)', () => {

    cy.visit('/admin-gestion?tipo=cliente');
    cy.wait('@getListaClientes');

    cy.contains('app-button', /crear|añadir|nuevo/i).click({ force: true });
    cy.url().should('include', '/register');

    // Rellenado (Formulario validado)
    cy.get('app-inputs[name="nombre"] input').type(usuarioTest.nombre).blur();
    cy.get('app-inputs[name="ape1"] input').type(usuarioTest.ape1).blur();
    cy.get('app-inputs[name="ape2"] input').type('Apellido2').blur();

    cy.get('app-inputs[name="fechnac"] input')
      .type('1990-01-01')
      .trigger('input')
      .trigger('change')
      .blur();

    cy.get('app-inputs[name="dni"] input').type(usuarioTest.dni).blur();
    cy.get('app-inputs[name="telef"] input').type(usuarioTest.telefono).blur();
    cy.get('app-inputs[name="email"] input').type(usuarioTest.email).blur();
    cy.get('app-inputs[name="direccion"] input').type('Calle Test').blur();
    cy.get('app-inputs[name="localidad"] input').type('Madrid').blur();
    cy.get('app-inputs[name="codpostal"] input').type('28001').blur();

    cy.get('select[formControlName="comunidad"]')
      .select(1, { force: true })
      .trigger('change')
      .blur();

    cy.get('app-inputs[name="password"] input').type(usuarioTest.password).blur();
    cy.get('app-inputs[name="repassword"] input').type(usuarioTest.password).blur();

    cy.get('input[type="checkbox"]').check({ force: true }).trigger('change');

    cy.wait(1000);

    cy.contains('button', /registrar|finalizar|crear/i)
      .should('not.be.disabled')
      .click({ force: true });

    cy.wait('@signupUser', { timeout: 20000 })
      .its('response.statusCode')
      .should('be.oneOf', [200, 201]);

    cy.log('--- ESPERANDO BASE DE DATOS ---');
    cy.wait(3000); // Dar tiempo a Supabase

    cy.visit('/admin-gestion?tipo=cliente');

    cy.wait('@getListaClientes').then((interception) => {
      const body = interception.response?.body;
  const datos = Array.isArray(body) ? body : [];

      const existe = datos.find((u: any) => u.nombre === usuarioTest.nombre);

      if (!existe) {
        cy.log('🔄 Usuario no encontrado en la primera carga. Recargando...');
        cy.wait(2000);
        cy.reload();
        cy.wait('@getListaClientes');
      }
    });

    cy.get('app-searchbar input').clear().type(usuarioTest.nombre, { delay: 50 });
    cy.wait(1000);

    cy.contains('td', usuarioTest.nombre, { timeout: 10000 }).should('be.visible');


    cy.contains('tr', usuarioTest.nombre).within(() => {
      cy.get('app-button[variant="primary"]').click({ force: true });
    });

    cy.url().should('include', '/modify-profile');

    cy.get('app-inputs[name="telefono"] input').clear().type(usuarioTest.nuevoTelefono);

    cy.contains('button', /guardar|modificar/i).click({ force: true });
    cy.wait('@updateProfile').its('response.statusCode').should('eq', 204);

    cy.get('app-buttonback').click();
    cy.wait('@getListaClientes');

    cy.get('app-searchbar input').clear().type(usuarioTest.nombre, { delay: 50 });
    cy.wait(1000);

    cy.contains('tr', usuarioTest.nombre).within(() => {
      cy.get('app-button[variant="secondary"]').click({ force: true });
    });

    cy.get('mat-dialog-container')
      .should('be.visible')
      .within(() => {
        cy.contains('button', /eliminar|si|baja/i).click({ force: true });
      });

    cy.wait('@deleteUser').its('response.statusCode').should('be.oneOf', [200, 204]);

    cy.get('app-searchbar input').clear().type(usuarioTest.nombre);
    cy.get('table').should('not.contain', usuarioTest.nombre);
  });
});
