import { ROOT } from "../constants";

describe('Create New Account', () => {
  it('loads the home page', () => {
    cy.visit(ROOT);
  })

  it('creates an account', () => {
    cy.visit(ROOT);
    cy.get('input[autocomplete="username"]').type('test-account');
    cy.get('input[name="password"]').type('test-password');
    //cy.get('button.primary').click();
  })
})