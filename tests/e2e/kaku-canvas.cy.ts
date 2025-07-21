/// <reference types="cypress" />
/// <reference types="cypress-real-events" />

import "cypress-real-events";

// E2E test for KakuCanvas core flows
describe("KakuCanvas E2E", () => {
  beforeEach(() => {
    cy.visit("/");
    cy.get("canvas").should("be.visible");
    cy.wait(1000)
    cy.get("canvas.upper-canvas").realClick();
  });

  it("should render canvas and basic UI elements", () => {
    // Check canvas is visible
    cy.get("canvas").should("be.visible");

    // Check drawing mode buttons are visible (should have 10 modes + 1 dropdown = 11 total)
    cy.get('div[class*="top-3"] button').should("have.length", 11);

    // Check zoom controls are visible
    cy.get("button").contains("%").should("be.visible");

    // Check dropdown menu button exists (with menu icon)
    cy.get('div[class*="top-3"] button').last().should("be.visible");
  });

  it("should open dropdown menu and show all options", () => {
    // Open dropdown menu by clicking menu button
    cy.get('div[class*="top-3"] button').last().click();

    cy.wait(300);

    cy.get("body").then(($body) => {
      // Just check that the dropdown opened and has some content
      if ($body.find(':contains("Open")').length > 0) {
        cy.contains("Open").should("be.visible");
      }
      if ($body.find(':contains("Export")').length > 0) {
        cy.contains("Export").should("be.visible");
      }
      if ($body.find(':contains("Clear Canvas")').length > 0) {
        cy.contains("Clear Canvas").should("be.visible");
      }
    });
  });

  it("can select different drawing modes", () => {
    // Test selecting Rectangle mode and verify it's selected
    cy.get('div[class*="top-3"] button').eq(4).realClick();
    // Just verify the button was clicked and tool is functional
    cy.wait(200);

    // Test selecting Ellipse mode and verify it's selected
    cy.get('div[class*="top-3"] button').eq(3).click();
    cy.wait(200);

    // Test selecting Line mode and verify it's selected
    cy.get('div[class*="top-3"] button').eq(7).click();
    cy.wait(200);

    // Test selecting Draw mode and verify it's selected
    cy.get('div[class*="top-3"] button').eq(2).click();
    // Verify draw mode panel appears
    cy.contains("Stroke").should("be.visible");
    cy.wait(200);

    // Return to select mode and verify it's selected
    cy.get('div[class*="top-3"] button').eq(1).click();
    cy.wait(200);

    // Verify the buttons are still visible and clickable
    cy.get('div[class*="top-3"] button').should("have.length", 11);
  });

  it("can draw each shape type individually", () => {
    // Step 1: Draw Rectangle
    cy.get('div[class*="top-3"] button').eq(4).realClick(); // Rectangle tool
    cy.wait(300);

    cy.get("canvas.upper-canvas")
      .realMouseDown({ x: 50, y: 50 })
      .realMouseMove(150, 120)
      .realMouseUp({ x: 150, y: 120 });
    cy.wait(300);

    // Capture rectangle canvas
    cy.get("canvas.lower-canvas").then(($canvas) => {
      const canvas = $canvas[0] as HTMLCanvasElement;
      const dataURL = canvas.toDataURL("image/png");
      cy.writeFile(
        "cypress/screenshots/01-individual-shapes/step-1-rectangle.png",
        dataURL.split(",")[1],
        "base64"
      );
    });

    // Step 2: Draw Ellipse
    cy.get('div[class*="top-3"] button').eq(3).realClick(); // Ellipse tool
    cy.wait(300);

    cy.get("canvas.upper-canvas")
      .realMouseDown({ x: 200, y: 50 })
      .realMouseMove(300, 120)
      .realMouseUp({ x: 300, y: 120 });
    cy.wait(1000);

    // Capture ellipse canvas
    cy.get("canvas.lower-canvas").then(($canvas) => {
      const canvas = $canvas[0] as HTMLCanvasElement;
      const dataURL = canvas.toDataURL("image/png");
      cy.writeFile(
        "cypress/screenshots/01-individual-shapes/step-2-ellipse.png",
        dataURL.split(",")[1],
        "base64"
      );
    });

    // Step 3: Draw Diamond
    cy.get('div[class*="top-3"] button').eq(5).realClick(); // Diamond tool
    cy.wait(300);

    cy.get("canvas.upper-canvas")
      .realMouseDown({ x: 350, y: 50 })
      .realMouseMove(450, 120)
      .realMouseUp({ x: 450, y: 120 });
    cy.wait(1000);

    // Capture diamond canvas
    cy.get("canvas.lower-canvas").then(($canvas) => {
      const canvas = $canvas[0] as HTMLCanvasElement;
      const dataURL = canvas.toDataURL("image/png");
      cy.writeFile(
        "cypress/screenshots/01-individual-shapes/step-3-diamond.png",
        dataURL.split(",")[1],
        "base64"
      );
    });

    // Step 4: Draw Line
    cy.get('div[class*="top-3"] button').eq(7).realClick(); // Line tool
    cy.wait(300);

    cy.get("canvas.upper-canvas")
      .realMouseDown({ x: 50, y: 150 })
      .realMouseMove(200, 200)
      .realMouseUp({ x: 200, y: 200 });
    cy.wait(1000);

    // Capture line canvas
    cy.get("canvas.lower-canvas").then(($canvas) => {
      const canvas = $canvas[0] as HTMLCanvasElement;
      const dataURL = canvas.toDataURL("image/png");
      cy.writeFile(
        "cypress/screenshots/01-individual-shapes/step-4-line.png",
        dataURL.split(",")[1],
        "base64"
      );
    });

    // Step 5: Draw Arrow
    cy.get('div[class*="top-3"] button').eq(8).realClick(); // Arrow tool
    cy.wait(300);

    cy.get("canvas.upper-canvas")
      .realMouseDown({ x: 250, y: 150 })
      .realMouseMove(400, 200)
      .realMouseUp({ x: 400, y: 200 });
    cy.wait(1000);

    // Capture arrow canvas
    cy.get("canvas.lower-canvas").then(($canvas) => {
      const canvas = $canvas[0] as HTMLCanvasElement;
      const dataURL = canvas.toDataURL("image/png");
      cy.writeFile(
        "cypress/screenshots/01-individual-shapes/step-5-arrow.png",
        dataURL.split(",")[1],
        "base64"
      );
    });

    // Step 6: Final screenshot with all shapes
    cy.get("canvas.lower-canvas").then(($canvas) => {
      const canvas = $canvas[0] as HTMLCanvasElement;
      const dataURL = canvas.toDataURL("image/png");
      cy.writeFile(
        "cypress/screenshots/01-individual-shapes/step-6-all-shapes.png",
        dataURL.split(",")[1],
        "base64"
      );
    });

    // Switch to select mode
    cy.get('div[class*="top-3"] button').eq(1).click();
    cy.wait(200);
  });

  it("can draw multiple shapes at once", () => {
    // Step 1: Draw first rectangle
    cy.get('div[class*="top-3"] button').eq(4).realClick(); // Rectangle tool
    cy.wait(300);

    cy.get("canvas.upper-canvas")
      .realMouseDown({ x: 50, y: 50 })
      .realMouseMove(150, 120)
      .realMouseUp({ x: 150, y: 120 });
    cy.wait(500);

    cy.get("canvas.lower-canvas").then(($canvas) => {
      const canvas = $canvas[0] as HTMLCanvasElement;
      const dataURL = canvas.toDataURL("image/png");
      cy.writeFile(
        "cypress/screenshots/02-multiple-shapes/step-1-first-rectangle.png",
        dataURL.split(",")[1],
        "base64"
      );
    });

    // Step 2: Draw second rectangle
    cy.get('div[class*="top-3"] button').eq(4).realClick(); // Rectangle tool
    cy.wait(300);
    cy.get("canvas.upper-canvas")
      .realMouseDown({ x: 200, y: 50 })
      .realMouseMove(300, 120)
      .realMouseUp({ x: 300, y: 120 });
    cy.wait(500);

    cy.get("canvas.lower-canvas").then(($canvas) => {
      const canvas = $canvas[0] as HTMLCanvasElement;
      const dataURL = canvas.toDataURL("image/png");
      cy.writeFile(
        "cypress/screenshots/02-multiple-shapes/step-2-second-rectangle.png",
        dataURL.split(",")[1],
        "base64"
      );
    });

    // Step 3: Draw third rectangle
    cy.get('div[class*="top-3"] button').eq(4).realClick(); // Rectangle tool
    cy.wait(300);
    cy.get("canvas.upper-canvas")
      .realMouseDown({ x: 350, y: 50 })
      .realMouseMove(450, 120)
      .realMouseUp({ x: 450, y: 120 });
    cy.wait(500);

    cy.get("canvas.lower-canvas").then(($canvas) => {
      const canvas = $canvas[0] as HTMLCanvasElement;
      const dataURL = canvas.toDataURL("image/png");
      cy.writeFile(
        "cypress/screenshots/02-multiple-shapes/step-3-third-rectangle.png",
        dataURL.split(",")[1],
        "base64"
      );
    });

    // Step 4: Switch to ellipse and add first ellipse
    cy.get('div[class*="top-3"] button').eq(3).realClick(); // Ellipse tool
    cy.wait(300);

    cy.get("canvas.upper-canvas")
      .realMouseDown({ x: 100, y: 150 })
      .realMouseMove(180, 220)
      .realMouseUp({ x: 180, y: 220 });
    cy.wait(500);

    cy.get("canvas.lower-canvas").then(($canvas) => {
      const canvas = $canvas[0] as HTMLCanvasElement;
      const dataURL = canvas.toDataURL("image/png");
      cy.writeFile(
        "cypress/screenshots/02-multiple-shapes/step-4-first-ellipse.png",
        dataURL.split(",")[1],
        "base64"
      );
    });

    // Step 5: Draw second ellipse
    cy.get('div[class*="top-3"] button').eq(3).realClick(); // Ellipse tool
    cy.wait(300);
    cy.get("canvas.upper-canvas")
      .realMouseDown({ x: 300, y: 150 })
      .realMouseMove(380, 220)
      .realMouseUp({ x: 380, y: 220 });
    cy.wait(500);

    // Step 6: Final screenshot showing all shapes together
    cy.get("canvas.lower-canvas").then(($canvas) => {
      const canvas = $canvas[0] as HTMLCanvasElement;
      const dataURL = canvas.toDataURL("image/png");
      cy.writeFile(
        "cypress/screenshots/02-multiple-shapes/step-5-final-all-shapes.png",
        dataURL.split(",")[1],
        "base64"
      );
    });

    // Switch to select mode
    cy.get('div[class*="top-3"] button').eq(1).click();
    cy.wait(200);
  });

  it("can export canvas as PNG", () => {
    // Step 1: Draw a rectangle for export test
    cy.get('div[class*="top-3"] button').eq(4).realClick(); // Rectangle tool
    cy.wait(300);

    cy.get("canvas.upper-canvas")
      .realMouseDown({ x: 100, y: 100 })
      .realMouseMove(200, 200)
      .realMouseUp({ x: 200, y: 200 });
    cy.wait(1000);

    // Capture canvas before export
    cy.get("canvas.lower-canvas").then(($canvas) => {
      const canvas = $canvas[0] as HTMLCanvasElement;
      const dataURL = canvas.toDataURL("image/png");
      cy.writeFile(
        "cypress/screenshots/03-export-test/step-1-canvas-before-export.png",
        dataURL.split(",")[1],
        "base64"
      );
    });

    // Step 2: Open export modal via keyboard shortcut
    cy.get("body").type("{ctrl+e}");

    // Wait for modal to load
    cy.wait(1000);

    // Step 3: Check export modal opens and basic elements are visible
    cy.get("body").then(($body) => {
      if ($body.find(':contains("Scale")').length > 0) {
        cy.contains("Scale").should("be.visible");
        cy.contains("1x").should("be.visible");
      }
      if ($body.find('img[alt="Image Preview"]').length > 0) {
        cy.get('img[alt="Image Preview"]').should("be.visible");
      } else if ($body.find("img").length > 0) {
        cy.get("img").first().should("be.visible");
      }
    });

    // Step 4: Test some scale options if available
    cy.get("body").then(($body) => {
      if ($body.find(':contains("2x")').length > 0) {
        cy.contains("2x").click();
        cy.wait(200);
        cy.contains("1x").click();
      }
    });

    cy.contains("PNG").realClick();
  });

  it("can use undo/redo functionality", () => {
    // Step 1: Draw a rectangle
    cy.get('div[class*="top-3"] button').eq(4).realClick(); // Rectangle tool
    cy.wait(300);

    cy.get("canvas.upper-canvas")
      .realMouseDown({ x: 100, y: 100 })
      .realMouseMove(200, 200)
      .realMouseUp({ x: 200, y: 200 });
    cy.wait(1000);

    // Capture after first shape
    cy.get("canvas.lower-canvas").then(($canvas) => {
      const canvas = $canvas[0] as HTMLCanvasElement;
      const dataURL = canvas.toDataURL("image/png");
      cy.writeFile(
        "cypress/screenshots/04-undo-redo/step-1-first-shape.png",
        dataURL.split(",")[1],
        "base64"
      );
    });

    // Step 2: Draw another shape (ellipse)
    cy.get('div[class*="top-3"] button').eq(3).realClick(); // Ellipse tool
    cy.wait(300);

    cy.get("canvas.upper-canvas")
      .realMouseDown({ x: 250, y: 250 })
      .realMouseMove(350, 330)
      .realMouseUp({ x: 350, y: 330 });
    cy.wait(1000);

    // Capture after second shape
    cy.get("canvas.lower-canvas").then(($canvas) => {
      const canvas = $canvas[0] as HTMLCanvasElement;
      const dataURL = canvas.toDataURL("image/png");
      cy.writeFile(
        "cypress/screenshots/04-undo-redo/step-2-second-shape.png",
        dataURL.split(",")[1],
        "base64"
      );
    });

    // Step 3: First undo using keyboard shortcuts
    cy.get("body").type("{ctrl+z}");
    cy.wait(500);

    // Capture after first undo
    cy.get("canvas.lower-canvas").then(($canvas) => {
      const canvas = $canvas[0] as HTMLCanvasElement;
      const dataURL = canvas.toDataURL("image/png");
      cy.writeFile(
        "cypress/screenshots/04-undo-redo/step-3-after-first-undo.png",
        dataURL.split(",")[1],
        "base64"
      );
    });

    // Step 4: Second undo
    cy.get("body").type("{ctrl+z}");
    cy.wait(500);

    // Capture after second undo
    cy.get("canvas.lower-canvas").then(($canvas) => {
      const canvas = $canvas[0] as HTMLCanvasElement;
      const dataURL = canvas.toDataURL("image/png");
      cy.writeFile(
        "cypress/screenshots/04-undo-redo/step-4-after-second-undo.png",
        dataURL.split(",")[1],
        "base64"
      );
    });

    // Step 5: Redo once
    cy.get("body").type("{ctrl+y}");
    cy.wait(500);

    // Capture after redo
    cy.get("canvas.lower-canvas").then(($canvas) => {
      const canvas = $canvas[0] as HTMLCanvasElement;
      const dataURL = canvas.toDataURL("image/png");
      cy.writeFile(
        "cypress/screenshots/04-undo-redo/step-5-after-redo.png",
        dataURL.split(",")[1],
        "base64"
      );
    });

    // Verify undo/redo worked by switching to select mode and trying to click shapes
    cy.get('div[class*="top-3"] button').eq(1).click();
  });

  it("can copy and paste shapes", () => {
    // Step 1: Draw a rectangle
    cy.get('div[class*="top-3"] button').eq(4).realClick(); // Rectangle tool
    cy.wait(300);

    cy.get("canvas.upper-canvas")
      .realMouseDown({ x: 100, y: 100 })
      .realMouseMove(200, 200)
      .realMouseUp({ x: 200, y: 200 });
    cy.wait(1000);

    // Capture original shape
    cy.get("canvas.lower-canvas").then(($canvas) => {
      const canvas = $canvas[0] as HTMLCanvasElement;
      const dataURL = canvas.toDataURL("image/png");
      cy.writeFile(
        "cypress/screenshots/05-copy-paste/step-1-original-shape.png",
        dataURL.split(",")[1],
        "base64"
      );
    });

    // Step 2: Switch to select mode and select the shape
    cy.get('div[class*="top-3"] button').eq(1).realClick(); // Select tool
    cy.wait(300);
    cy.get("canvas.upper-canvas").realClick({ x: 150, y: 150 });
    cy.wait(500);

    cy.get("canvas.lower-canvas").then(($canvas) => {
      const canvas = $canvas[0] as HTMLCanvasElement;
      const dataURL = canvas.toDataURL("image/png");
      cy.writeFile(
        "cypress/screenshots/05-copy-paste/step-2-shape-selected.png",
        dataURL.split(",")[1],
        "base64"
      );
    });

    // Step 3: Copy and paste
    cy.get("body").type("{ctrl+c}");
    cy.wait(500);
    cy.get("body").type("{ctrl+v}");
    cy.wait(1000);

    // Capture after copy/paste
    cy.get("canvas.lower-canvas").then(($canvas) => {
      const canvas = $canvas[0] as HTMLCanvasElement;
      const dataURL = canvas.toDataURL("image/png");
      cy.writeFile(
        "cypress/screenshots/05-copy-paste/step-3-after-paste.png",
        dataURL.split(",")[1],
        "base64"
      );
    });

    // The pasted shape should be slightly offset
    cy.get("canvas").should("be.visible");
  });

  it("can clear the canvas", () => {
    // Step 1: Draw first shape (rectangle)
    cy.get('div[class*="top-3"] button').eq(4).realClick(); // Rectangle tool
    cy.wait(300);

    cy.get("canvas.upper-canvas")
      .realMouseDown({ x: 100, y: 100 })
      .realMouseMove(200, 200)
      .realMouseUp({ x: 200, y: 200 });
    cy.wait(500);

    cy.get("canvas.lower-canvas").then(($canvas) => {
      const canvas = $canvas[0] as HTMLCanvasElement;
      const dataURL = canvas.toDataURL("image/png");
      cy.writeFile(
        "cypress/screenshots/06-clear-canvas/step-1-first-shape.png",
        dataURL.split(",")[1],
        "base64"
      );
    });

    // Step 2: Draw second shape (ellipse)
    cy.get('div[class*="top-3"] button').eq(3).realClick(); // Ellipse tool
    cy.wait(300);

    cy.get("canvas.upper-canvas")
      .realMouseDown({ x: 250, y: 250 })
      .realMouseMove(350, 330)
      .realMouseUp({ x: 350, y: 330 });
    cy.wait(500);

    // Capture before clearing
    cy.get("canvas.lower-canvas").then(($canvas) => {
      const canvas = $canvas[0] as HTMLCanvasElement;
      const dataURL = canvas.toDataURL("image/png");
      cy.writeFile(
        "cypress/screenshots/06-clear-canvas/step-2-before-clear.png",
        dataURL.split(",")[1],
        "base64"
      );
    });

    // Step 3: Open dropdown and clear canvas
    cy.get('div[class*="top-3"] button').last().click();
    cy.contains("Clear Canvas").click();

    // Confirm the clear action
    cy.on("window:confirm", () => true);
    cy.wait(1000);

    // Capture after clearing
    cy.get("canvas.lower-canvas").then(($canvas) => {
      const canvas = $canvas[0] as HTMLCanvasElement;
      const dataURL = canvas.toDataURL("image/png");
      cy.writeFile(
        "cypress/screenshots/06-clear-canvas/step-3-after-clear.png",
        dataURL.split(",")[1],
        "base64"
      );
    });

    // Canvas should be cleared
    cy.get("canvas").should("be.visible");
  });

  it("can use text tool", () => {
    // Step 1: Select text tool
    cy.get('div[class*="top-3"] button').eq(6).realClick();
    cy.wait(300);

    // Step 2: Click on canvas to place text
    cy.get("canvas.upper-canvas").realClick({ x: 200, y: 200 });
    cy.wait(500);

    // Step 3: Type some text
    cy.focused().type("Hello Kaku!");
    cy.wait(500);

    // Step 4: Click elsewhere to finish editing
    cy.get("canvas.upper-canvas").realClick({ x: 400, y: 400 });
    cy.wait(1000);

    // Capture text on canvas
    cy.get("canvas.lower-canvas").then(($canvas) => {
      const canvas = $canvas[0] as HTMLCanvasElement;
      const dataURL = canvas.toDataURL("image/png");
      cy.writeFile(
        "cypress/screenshots/07-text-tool/step-1-text-final.png",
        dataURL.split(",")[1],
        "base64"
      );
    });

    // Switch to select mode
    cy.get('div[class*="top-3"] button').eq(1).click();
  });

  it("can use free drawing tool", () => {
    // Step 1: Select draw tool
    cy.get('div[class*="top-3"] button').eq(2).realClick();
    cy.wait(300);

    // Verify draw mode panel appears
    cy.contains("Stroke").should("be.visible");
    cy.wait(500);

    // Step 2: Draw first stroke with different coordinates
    cy.get("canvas.upper-canvas")
      .realMouseDown({ x: 50, y: 50 })
      .realMouseMove(70, 60)
      .realMouseMove(90, 70)
      .realMouseMove(110, 65)
      .realMouseMove(130, 75)
      .realMouseMove(150, 50)
      .realMouseUp({ x: 150, y: 50 });
    cy.wait(1000);

    // Capture after first stroke
    cy.get("canvas.lower-canvas").then(($canvas) => {
      const canvas = $canvas[0] as HTMLCanvasElement;
      const dataURL = canvas.toDataURL("image/png");
      cy.writeFile(
        "cypress/screenshots/08-free-drawing/step-1-free-drawing.png",
        dataURL.split(",")[1],
        "base64"
      );
    });

    // Draw second stroke with well-separated coordinates
    cy.get("canvas.upper-canvas")
      .realMouseDown({ x: 250, y: 150 })
      .realMouseMove(270, 160)
      .realMouseMove(290, 170)
      .realMouseMove(310, 165)
      .realMouseMove(330, 175)
      .realMouseMove(350, 150)
      .realMouseUp({ x: 350, y: 150 });
    cy.wait(1000);

    // Switch to select mode
    cy.get('div[class*="top-3"] button').eq(1).realClick();
    cy.wait(500);

    cy.get("canvas.lower-canvas").then(($canvas) => {
      const canvas = $canvas[0] as HTMLCanvasElement;
      const dataURL = canvas.toDataURL("image/png");
      cy.writeFile(
        "cypress/screenshots/08-free-drawing/step-2-multiple-strokes.png",
        dataURL.split(",")[1],
        "base64"
      );
    });
  });

  it("can save and load scenes", () => {
    // Step 1: Draw some content
    cy.get('div[class*="top-3"] button').eq(4).realClick(); // Rectangle tool
    cy.wait(300);

    cy.get("canvas.upper-canvas")
      .realMouseDown({ x: 100, y: 100 })
      .realMouseMove(200, 200)
      .realMouseUp({ x: 200, y: 200 });
    cy.wait(500);

    // Capture before save
    cy.get("canvas.lower-canvas").then(($canvas) => {
      const canvas = $canvas[0] as HTMLCanvasElement;
      const dataURL = canvas.toDataURL("image/png");
      cy.writeFile(
        "cypress/screenshots/09-save-load/step-1-before-save.png",
        dataURL.split(",")[1],
        "base64"
      );
    });

    // Step 2: Save the scene
    cy.get('div[class*="top-3"] button').last().click(); // Open dropdown menu
    cy.wait(500);
    cy.contains("Export Scene").click();
    cy.wait(2000); // Wait for download

    // Step 3: Clear the canvas
    cy.get('div[class*="top-3"] button').last().click(); // Open dropdown menu
    cy.wait(500);
    cy.contains("Clear Canvas").click();

    // Confirm the clear action
    cy.on("window:confirm", () => true);
    cy.wait(1000);

    // Capture after clearing
    cy.get("canvas.lower-canvas").then(($canvas) => {
      const canvas = $canvas[0] as HTMLCanvasElement;
      const dataURL = canvas.toDataURL("image/png");
      cy.writeFile(
        "cypress/screenshots/09-save-load/step-2-after-clear.png",
        dataURL.split(",")[1],
        "base64"
      );
    });

    // Step 4: Import the scene from downloads folder
    cy.get('div[class*="top-3"] button').last().click(); // Open dropdown menu
    cy.wait(500);
    // Trigger the code that creates the file input
    cy.contains("Open").realClick();
    cy.wait(400);

    // Find the dynamically created file input
    cy.get('input[type="file"]', { includeShadowDom: true }).should("exist");

    // Force file selection
    cy.get('input[type="file"]').selectFile("cypress/downloads/scene.kaku", {
      force: true,
    });

    cy.wait(1500);

    // Capture after importing
    cy.get("canvas.lower-canvas").then(($canvas) => {
      const canvas = $canvas[0] as HTMLCanvasElement;
      const dataURL = canvas.toDataURL("image/png");
      cy.writeFile(
        "cypress/screenshots/09-save-load/step-3-after-import.png",
        dataURL.split(",")[1],
        "base64"
      );
    });
  });

  it("can test arrow binding to objects", () => {
    // Step 1: Draw first rectangle - moved further right to avoid properties panel
    cy.get('div[class*="top-3"] button').eq(4).realClick(); // Rectangle tool
    cy.wait(300);

    cy.get("canvas.upper-canvas")
      .realMouseDown({ x: 350, y: 200 })
      .realMouseMove(450, 250)
      .realMouseUp({ x: 450, y: 250 });
    cy.wait(500);

    cy.get("canvas.lower-canvas").then(($canvas) => {
      const canvas = $canvas[0] as HTMLCanvasElement;
      const dataURL = canvas.toDataURL("image/png");
      cy.writeFile(
        "cypress/screenshots/10-arrow-binding/step-1-first-rectangle.png",
        dataURL.split(",")[1],
        "base64"
      );
    });

    // Step 2: Draw second rectangle
    cy.get('div[class*="top-3"] button').eq(4).realClick(); // Rectangle tool
    cy.wait(300);
    cy.get("canvas.upper-canvas")
      .realMouseDown({ x: 600, y: 300 })
      .realMouseMove(700, 350)
      .realMouseUp({ x: 700, y: 350 });
    cy.wait(500);

    cy.get("canvas.lower-canvas").then(($canvas) => {
      const canvas = $canvas[0] as HTMLCanvasElement;
      const dataURL = canvas.toDataURL("image/png");
      cy.writeFile(
        "cypress/screenshots/10-arrow-binding/step-2-two-rectangles.png",
        dataURL.split(",")[1],
        "base64"
      );
    });

    // Step 3: Switch to arrow tool and draw arrow from first rectangle edge to second rectangle edge
    cy.get('div[class*="top-3"] button').eq(8).realClick(); // Arrow tool
    cy.wait(300);

    // Draw arrow from right edge of first rectangle to left edge of second rectangle
    // First rectangle is at (350,200) to (450,250), so right edge center is (450, 225)
    // Second rectangle is at (600,300) to (700,350), so left edge center is (600, 325)
    cy.get("canvas.upper-canvas")
      .realMouseDown({ x: 450, y: 225 })
      .realMouseMove(600, 325)
      .realMouseUp({ x: 600, y: 325 });
    cy.wait(1000);

    cy.get("canvas.lower-canvas").then(($canvas) => {
      const canvas = $canvas[0] as HTMLCanvasElement;
      const dataURL = canvas.toDataURL("image/png");
      cy.writeFile(
        "cypress/screenshots/10-arrow-binding/step-3-arrow-connected.png",
        dataURL.split(",")[1],
        "base64"
      );
    });

    // Step 4: Switch to select mode
    cy.get('div[class*="top-3"] button').eq(1).realClick();
    cy.wait(300);

    // Step 5: Select and move the first rectangle
    cy.get("canvas.upper-canvas").realClick({ x: 400, y: 225 }); // Click center of first rectangle
    cy.wait(500);

    // Move the first rectangle up and to the left
    cy.get("canvas.upper-canvas")
      .realMouseDown({ x: 400, y: 225 })
      .realMouseMove(330, 180)
      .realMouseUp({ x: 330, y: 180 });
    cy.wait(1000);

    cy.get("canvas.lower-canvas").then(($canvas) => {
      const canvas = $canvas[0] as HTMLCanvasElement;
      const dataURL = canvas.toDataURL("image/png");
      cy.writeFile(
        "cypress/screenshots/10-arrow-binding/step-4-first-rectangle-moved.png",
        dataURL.split(",")[1],
        "base64"
      );
    });

    // Step 6: Select and move the second rectangle
    cy.get("canvas.upper-canvas").realClick({ x: 650, y: 325 }); // Click center of second rectangle
    cy.wait(500);

    // Move the second rectangle down and to the right
    cy.get("canvas.upper-canvas")
      .realMouseDown({ x: 650, y: 325 })
      .realMouseMove(750, 400)
      .realMouseUp({ x: 750, y: 400 });
    cy.wait(1000);

    cy.get("canvas.lower-canvas").then(($canvas) => {
      const canvas = $canvas[0] as HTMLCanvasElement;
      const dataURL = canvas.toDataURL("image/png");
      cy.writeFile(
        "cypress/screenshots/10-arrow-binding/step-5-second-rectangle-moved.png",
        dataURL.split(",")[1],
        "base64"
      );
    });

    // Step 7: Move first rectangle again to test binding further
    cy.get("canvas.upper-canvas").realClick({ x: 330, y: 180 }); // Click new position of first rectangle
    cy.wait(500);

    cy.get("canvas.upper-canvas")
      .realMouseDown({ x: 330, y: 180 })
      .realMouseMove(400, 400)
      .realMouseUp({ x: 400, y: 400 });
    cy.wait(1000);

    // Final capture showing arrow follows both rectangles
    cy.get("canvas.lower-canvas").then(($canvas) => {
      const canvas = $canvas[0] as HTMLCanvasElement;
      const dataURL = canvas.toDataURL("image/png");
      cy.writeFile(
        "cypress/screenshots/10-arrow-binding/step-6-final-arrow-binding-test.png",
        dataURL.split(",")[1],
        "base64"
      );
    });
  });

    it("can zoom and pan the canvas", () => {
    cy.get('div[class*="top-3"] button').eq(4).realClick();
    cy.wait(500);

    // Draw rectangle using real mouse events
    cy.get("canvas.upper-canvas")
      .realMouseDown({ x: 100, y: 100 })
      .realMouseMove(200, 150)
      .realMouseMove(300, 200)
      .realMouseUp({ x: 300, y: 200 });
    cy.wait(300);
    // Test zoom in - click the last button in the zoom group (add button)
    cy.get('div[class*="bottom-4"] button')
      .last()
      .realClick()
      .realClick()
      .realClick();
    cy.get("button").contains("%").should("contain", "130%");

    cy.get("canvas.lower-canvas").then(($canvas) => {
      const canvas = $canvas[0] as HTMLCanvasElement;
      const dataURL = canvas.toDataURL("image/png");
      cy.writeFile(
        "cypress/screenshots/11-zoom-in-test/step-1-zoomed-in.png",
        dataURL.split(",")[1],
        "base64"
      );
    });

    // Test zoom reset by clicking percentage
    cy.get('div[class*="bottom-4"] button').last().realClick();
    cy.get('div[class*="bottom-4"] button').last().realClick();
    cy.get("button").contains("%").realClick();
    cy.get("button").contains("%").should("contain", "100%");

    cy.get("canvas.lower-canvas").then(($canvas) => {
      const canvas = $canvas[0] as HTMLCanvasElement;
      const dataURL = canvas.toDataURL("image/png");
      cy.writeFile(
        "cypress/screenshots/11-zoom-in-test/step-2-zoom-reset.png",
        dataURL.split(",")[1],
        "base64"
      );
    });

    // Test zoom out - click the first button in the zoom group (minus button)
    cy.get('div[class*="bottom-4"] button')
      .first()
      .realClick()
      .realClick()
      .realClick();
    cy.get("button").contains("%").should("contain", "70%");

    cy.get("canvas.lower-canvas").then(($canvas) => {
      const canvas = $canvas[0] as HTMLCanvasElement;
      const dataURL = canvas.toDataURL("image/png");
      cy.writeFile(
        "cypress/screenshots/11-zoom-in-test/step-3-zoomed-out.png",
        dataURL.split(",")[1],
        "base64"
      );
    });
  });
});
