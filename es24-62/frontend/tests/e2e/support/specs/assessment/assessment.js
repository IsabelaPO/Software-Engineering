describe('Assessment', () => {
    beforeEach(() => {
        cy.deleteAllButArs();
        cy.createDemoEntities();
        cy.createAssessmentDemoEntities();
    });

    afterEach(() => {
        cy.deleteAllButArs();
    });

    it('create assessment', () => {
        const NAME = 'A1';
        const REVIEW = 'review 12344321';

        cy.demoVolunteerLogin();
        // intercept create assessment request and inject date values in the request body
        cy.intercept('POST', 'institutions/*/assessments', (req) => {
            req.body = {
                reviewDate: '2024-01-13T12:00:00+00:00',
            };
        }).as('register');
        // intercept get activities request
        cy.intercept('GET', '/activities').as('getActivities');
        // go to volunteer activities view
        cy.get('[data-cy="volunteerActivities"]').click();
        // check request was done
        cy.wait('@getActivities');
        // check results
        cy.get('[data-cy="volunteerActivitiesTable"] tbody tr')
            .should('have.length', 6)
            .eq(0)
            .children()
            .eq(0)
            .should('contain', NAME)
        // click the WriteAssessment button
        cy.get('[data-cy="volunteerActivitiesTable"] tbody tr')
            .eq(0)
            .children()
            .find('[data-cy="writeAssessmentButton"]').click()
        // fill the form
        cy.get('[data-cy="reviewInput"]').type(REVIEW);
        // save form
        cy.get('[data-cy="saveAssessment"]').click()
        // check request was done
        cy.wait('@register')
        cy.logout();
    });
});