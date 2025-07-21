/// <reference types="cypress" />

// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to select DOM element by data-cy attribute.
       * @example cy.dataCy('greeting')
       */
      dataCy(value: string): Chainable<any>
      
      /**
       * Custom command to draw a shape on the canvas
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

Cypress.Commands.add('dataCy', (value) => {
  return cy.get(`[data-cy=${value}]`)
})

Cypress.Commands.add('waitForCanvas', () => {
  cy.get('canvas').should('be.visible')
  cy.wait(500) // Allow time for canvas initialization
})

Cypress.Commands.add('drawRectangle', (x1: number, y1: number, x2: number, y2: number) => {
  // Use the upper canvas which is the interaction layer in Fabric.js
  cy.get('canvas.upper-canvas').then(($canvas) => {
    const canvas = $canvas[0]
    const rect = canvas.getBoundingClientRect()
    
    // Calculate absolute positions
    const startX = rect.left + x1
    const startY = rect.top + y1
    const endX = rect.left + x2
    const endY = rect.top + y2
    
    cy.get('canvas.upper-canvas')
      .trigger('mousedown', { 
        clientX: startX, 
        clientY: startY,
        which: 1,
        button: 0,
        force: true
      })
      .trigger('mousemove', { 
        clientX: endX, 
        clientY: endY,
        force: true
      })
      .trigger('mouseup', { 
        clientX: endX, 
        clientY: endY,
        which: 1,
        button: 0,
        force: true
      })
    
    // Wait a bit for the shape to be rendered
    cy.wait(300)
  })
})

Cypress.Commands.add('drawLine', (x1: number, y1: number, x2: number, y2: number) => {
  // Use the upper canvas which is the interaction layer in Fabric.js
  cy.get('canvas.upper-canvas').then(($canvas) => {
    const canvas = $canvas[0]
    const rect = canvas.getBoundingClientRect()
    
    // Calculate absolute positions
    const startX = rect.left + x1
    const startY = rect.top + y1
    const endX = rect.left + x2
    const endY = rect.top + y2
    
    cy.get('canvas.upper-canvas')
      .trigger('mousedown', { 
        clientX: startX, 
        clientY: startY,
        which: 1,
        button: 0,
        force: true
      })
      .trigger('mousemove', { 
        clientX: endX, 
        clientY: endY,
        force: true
      })
      .trigger('mouseup', { 
        clientX: endX, 
        clientY: endY,
        which: 1,
        button: 0,
        force: true
      })
    
    // Wait a bit for the shape to be rendered
    cy.wait(300)
  })
})

export {}
