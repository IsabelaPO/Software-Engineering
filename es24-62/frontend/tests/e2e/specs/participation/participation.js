describe('Participation', () => {
    beforeEach(() => {
        cy.deleteAllButArs();
        cy.createDemoEntities();
        cy.createDemoParticipation();
    });

    afterEach(() => {
        cy.deleteAllButArs();
    });

    it('create participation', () => {
        const STATUS = 'false';
        const STATUS2 = 'true';
        const RATE = '5';
        const PARTICIPATIONS = '1';
        const PARTICIPATIONS2 = '2';
        cy.demoMemberLogin();
        cy.intercept('POST', 'activities/*/participations', (req) => {
            req.body = {
                enrollmentDateTime: '2024-01-13T12:00:00+00:00'
            };
        }).as('register');

        // intercept get activities request
        cy.intercept('GET', '/users/*/getInstitution').as('getInstitutions');

        // go to member activities view
        cy.get('[data-cy="institution"]').click();

        cy.get('[data-cy="activities"]').click();

        // check request was done
        cy.wait('@getInstitutions');

        //click on ShowEnrollments of first activity
        cy.get('[data-cy="memberActivitiesTable"] tbody tr')
            .should('have.length', 2) // checks that there are 2 rows (aka 2 activities)
            .eq(0)
            .children() // they're the components of the first activity
            .eq(4)
            .should('contain', PARTICIPATIONS)

        cy.get('[data-cy="memberActivitiesTable"] tbody tr')
            .eq(0)
            .children()
            .find('[data-cy="showEnrollments"]').click()

        //Verify the enrollment table has 2 instances and first enrollment has false Participation status
        cy.get('[data-cy="activityEnrollmentsTable"] tbody tr')
            .should('have.length', 2)
            .eq(0)
            .children()
            .eq(3)
            .should('contain', STATUS)

        //Click on SelectParticipant
        cy.get('[data-cy="activityEnrollmentsTable"] tbody tr')
            .eq(0)
            .children()
            .find('[data-cy="selectParticipants"]').click()


        // fill the form
        cy.get('[data-cy="ratingInput"]').type(RATE);

        //save form
        cy.get('[data-cy="saveParticipant"]').click();

        // check request was done
        cy.wait('@register')

        //verify that status is now true
        cy.get('[data-cy="activityEnrollmentsTable"] tbody tr')
            .eq(0)
            .children()
            .eq(3)
            .should('contain', STATUS2)

        cy.get('[data-cy="getActivities"]').click()

        //verify now if number of participants has been updated on activity view to 2
        cy.get('[data-cy="memberActivitiesTable"] tbody tr')
            .should('have.length', 2) // checks that there are 2 rows (aka 2 activities)
            .eq(0)
            .children() // they're the components of the first activity
            .eq(4)
            .should('contain', PARTICIPATIONS2)

        cy.logout();
    })
})
