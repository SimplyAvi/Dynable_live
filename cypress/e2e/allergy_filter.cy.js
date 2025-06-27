describe('Allergy Filter Functionality', () => {
  it('should not render any products containing the excluded allergen', () => {
    // Visit your homepage
    cy.visit('http://localhost:3000');

    // Type a search term (e.g., "bread")
    cy.get('input[name="searchText"]').type('bread');

    // Click the submit button
    cy.get('button[type="submit"]').click();

    // Wait for results to load
    cy.wait(1000);

    // Toggle the "wheat" allergen filter
    cy.contains('.scroll-item', 'wheat').click();

    // Wait for the results to update
    cy.wait(1000);

    // Check all rendered product cards for the allergen
    cy.get('.food-card, .product-card').each(($card) => {
      const text = $card.text().toLowerCase();
      expect(text).not.to.include('wheat');
    });
  });
}); 