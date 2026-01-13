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
  cy.visit('/');
  cy.intercept('POST', '**/auth/v1/token*').as('authSession');
  cy.get('app-button')
    .contains(/Registrarse|Entrar/i)
    .click({ force: true });
  cy.get('app-button')
    .contains(/Tengo una cuenta|Iniciar Sesión/i)
    .click({ force: true });
  cy.get('app-inputs[name="email"] input').type(email, { force: true });
  cy.get('app-inputs[name="password"] input').type(password, { force: true });
  cy.get('app-button')
    .contains(/Entrar/i)
    .click({ force: true });
  cy.wait('@authSession').its('response.statusCode').should('eq', 200);
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
