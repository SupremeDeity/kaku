/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to select DOM element by data-cy attribute.
       * @example cy.dataCy('greeting')
       */
      dataCy(value: string): Chainable<any>
      
      /**
       * Custom command to draw a rectangle on the canvas
       * @example cy.drawRectangle(50, 50, 150, 150)
       */
      drawRectangle(x1: number, y1: number, x2: number, y2: number): Chainable<any>
      
      /**
       * Custom command to draw a line on the canvas
       * @example cy.drawLine(50, 50, 150, 150)
       */
      drawLine(x1: number, y1: number, x2: number, y2: number): Chainable<any>
      
      /**
       * Custom command to wait for canvas to be ready
       * @example cy.waitForCanvas()
       */
      waitForCanvas(): Chainable<any>
    }
  }
}

export {};
