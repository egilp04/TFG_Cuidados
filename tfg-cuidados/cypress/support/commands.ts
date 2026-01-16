// ***********************************************
// This example namespace declaration will help
// with Intellisense and code completion in your
// IDE or Text Editor.
// ***********************************************
// declare namespace Cypress {
//   interface Chainable<Subject = any> {
//     customCommand(param: any): typeof customCommand;
//   }
// }
//
// function customCommand(param: any): void {
//   console.warn(param);
// }
//
// NOTE: You can use it like so:
// Cypress.Commands.add('customCommand', customCommand);
//
// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })

Cypress.Commands.add('login', (email, password) => {
  cy.intercept('POST', '**/auth/v1/token*').as('authSession');

  cy.visit('/');

  cy.get('app-button')
    .contains(/Registrarse|Entrar/i)
    .should('be.visible')
    .click({ force: true });

  cy.get('app-button')
    .contains(/Tengo una cuenta|Iniciar Sesión/i)
    .should('be.visible')
    .click({ force: true });

  cy.get('app-inputs[name="email"] input')
    .should('be.visible')
    .clear()
    .type(email, { force: true });

  cy.get('app-inputs[name="password"] input')
    .should('be.visible')
    .clear()
    .type(password, { force: true });

  cy.get('app-button')
    .contains(/Entrar/i)
    .click({ force: true });

  cy.wait('@authSession').then((interception) => {
    expect(interception.response?.statusCode).to.eq(200);
    if (interception.response?.body) {
      cy.log('Datos recibidos del login:', JSON.stringify(interception.response.body));
    }
  });

  cy.wait(500);

  cy.url().should('include', '/home');
});

declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>;
    }
  }
}
export {};
