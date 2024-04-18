describe('Enrollment', () => {
  beforeEach(() => {
    cy.deleteAllButArs();
    cy.createDemoEntities();
    cy.createEnrollmentActivities();
  });

  afterEach(() => {
    cy.deleteAllButArs();
  });

  it('create enrollment', () => {
    const APPLICATION_BEFORE_ENROLLMENT = 0;
    const APPLICATION_AFTER_ENROLLMENT = 1;
    const MOTIVATION = 'I am interested in this activity';

    cy.demoMemberLogin();
    cy.intercept('GET', '/users/*/getInstitution').as('getInstitution');
    cy.get('[data-cy="institution"]').click();
    cy.get('[data-cy="activities"]').click();
    cy.wait('@getInstitution');
    cy.get('[data-cy="memberActivitiesTable"] tbody tr')
          .should('have.length', 3)
          .eq(0)
          .children()
          .eq(3)
          .should('contain', APPLICATION_BEFORE_ENROLLMENT)
    
    cy.logout();

    cy.demoVolunteerLogin();
    cy.intercept('POST', 'activities/*/enrollments', (req) => {
        req.body = {
          enrollmentDateTime: '2024-01-13T12:00:00+00:00'
        };
    }).as('register');
    // intercept get activities request
    cy.intercept('GET', '/activities').as('getActivities');
    // go to volunteer activities view
    cy.get('[data-cy="volunteerActivities"]').click();
    // check request was done
    cy.wait('@getActivities');
    
    // click the ApplyForActivity button
    cy.get('[data-cy="volunteerActivitiesTable"] tbody tr')
      .eq(0)
      .children()
      .find('[data-cy="applyForActivityButton"]').click()
    // fill the form
    cy.get('[data-cy="motivationInput"]').type(MOTIVATION);
    // save form
    cy.get('[data-cy="saveEnrollment"]').click()
    // check request was done
    cy.wait('@register')
    cy.logout();

    cy.demoMemberLogin();
    cy.intercept('GET', '/users/*/getInstitution').as('getInstitution');
    cy.intercept('GET', '/activities/*/enrollments').as('getActivityEnrollments');
    
    cy.get('[data-cy="institution"]').click();
    cy.get('[data-cy="activities"]').click();
    cy.wait('@getInstitution');

    cy.get('[data-cy="memberActivitiesTable"] tbody tr')
          .eq(0)
          .children()
          .eq(3)
          .should('contain', APPLICATION_AFTER_ENROLLMENT)
    
    cy.get('[data-cy="memberActivitiesTable"] tbody tr')
      .eq(0)
      .children()
      .find('[data-cy="showEnrollments"]').click()
    
    cy.wait('@getActivityEnrollments');
    cy.get('[data-cy="activityEnrollmentsTable"] tbody tr')
          .should('have.length', 1)
          .eq(0)
          .children()
          .eq(1)
          .should('contain', MOTIVATION)

    cy.logout();


  });   
});
