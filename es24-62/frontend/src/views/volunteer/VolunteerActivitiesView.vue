<template>
  <div>
    <v-card class="table">
      <v-data-table
        :headers="headers"
        :items="activities"
        :search="search"
        disable-pagination
        :hide-default-footer="true"
        :mobile-breakpoint="0"
        data-cy="volunteerActivitiesTable"
      >
        <template v-slot:top>
          <v-card-title>
            <v-text-field
              v-model="search"
              append-icon="search"
              label="Search"
              class="mx-2"
            />
            <v-spacer />
          </v-card-title>
        </template>
        <template v-slot:[`item.themes`]="{ item }">
          <v-chip v-for="theme in item.themes" v-bind:key="theme.id">
            {{ theme.completeName }}
          </v-chip>
        </template>
        <template v-slot:[`item.action`]="{ item }">
          <v-tooltip v-if="item.state === 'APPROVED'" bottom>
            <template v-slot:activator="{ on }">
              <v-icon
                class="mr-2 action-button"
                color="red"
                v-on="on"
                data-cy="reportButton"
                @click="reportActivity(item)"
                >warning</v-icon
              >
            </template>
            <span>Report Activity</span>
          </v-tooltip>
          <v-tooltip
            v-if="
              showEnrollmentButtonDeadLine(item) &&
              !volunteerAlreadyApplied(item)
            "
            bottom
          >
            <template v-slot:activator="{ on }">
              <v-icon
                class="mr-2 action-button"
                color="blue"
                v-on="on"
                data-cy="applyForActivityButton"
                @click="applyForActivity(item)"
              >
                fas fa-sign-in-alt
              </v-icon>
            </template>
            <span>Apply for Activity</span>
          </v-tooltip>
          <v-tooltip v-if="verifyVolunteerCanAssess(item)" bottom>
            <template v-slot:activator="{ on }">
              <v-icon
                class="mr-2 action-button"
                color="blue"
                v-on="on"
                data-cy="writeAssessmentButton"
                @click="writeAssessment(item)"
                >fas fa-pen-to-square</v-icon
              >
            </template>
            <span>Write Assessment</span>
          </v-tooltip>
        </template>
      </v-data-table>
      <enrollment-dialog
        v-if="applyForActivityDialog"
        v-model="applyForActivityDialog"
        :activity="currentActivity"
        v-on:save-enrollment="onSaveEnrollment"
        v-on:close-enrollment-dialog="onCloseEnrollmentDialog"
      />
      <writeAssessment-dialog
        v-if="currentInstitution && writeAssessmentDialog"
        v-model="writeAssessmentDialog"
        :institution="currentInstitution"
        v-on:save-assessment="onSaveAssessment"
        v-on:close-writeAssessment-dialog="onCloseWriteAssessmentDialog"
      />
    </v-card>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import RemoteServices from '@/services/RemoteServices';
import Activity from '@/models/activity/Activity';
import Assessment from '@/models/assessment/Assessment';
import Institution from '@/models/institution/Institution';
import Participation from '@/models/participation/Participation';
import { show } from 'cli-cursor';
import Enrollment from '@/models/enrollment/Enrollment';
import EnrollmentDialog from '@/views/volunteer/EnrollmentDialog.vue';
import WriteAssessmentDialog from '@/views/volunteer/WriteAssessmentDialog.vue';

@Component({
  components: {
    'enrollment-dialog': EnrollmentDialog,
    'writeAssessment-dialog': WriteAssessmentDialog,
  },
  methods: { show },
})
export default class VolunteerActivitiesView extends Vue {
  activities: Activity[] = [];
  enrollments: Enrollment[] = [];
  assessments: Assessment[] = [];
  participations: Participation[] = [];

  currentInstitution: Institution | null = null;
  writeAssessmentDialog: boolean = false;

  search: string = '';

  currentActivity: Activity | null = null;
  currentEnrollment: Enrollment | null = null;
  applyForActivityDialog: boolean = false;

  headers: object = [
    {
      text: 'Name',
      value: 'name',
      align: 'left',
      width: '5%',
    },
    {
      text: 'Region',
      value: 'region',
      align: 'left',
      width: '5%',
    },
    {
      text: 'Participants',
      value: 'participantsNumberLimit',
      align: 'left',
      width: '5%',
    },
    {
      text: 'Themes',
      value: 'themes',
      align: 'left',
      width: '5%',
    },
    {
      text: 'Description',
      value: 'description',
      align: 'left',
      width: '30%',
    },
    {
      text: 'State',
      value: 'state',
      align: 'left',
      width: '5%',
    },
    {
      text: 'Start Date',
      value: 'formattedStartingDate',
      align: 'left',
      width: '5%',
    },
    {
      text: 'End Date',
      value: 'formattedEndingDate',
      align: 'left',
      width: '5%',
    },
    {
      text: 'Application Deadline',
      value: 'formattedApplicationDeadline',
      align: 'left',
      width: '5%',
    },
    {
      text: 'Actions',
      value: 'action',
      align: 'left',
      sortable: false,
      width: '5%',
    },
  ];

  async created() {
    await this.$store.dispatch('loading');
    try {
      this.activities = await RemoteServices.getActivities();
      this.enrollments = await RemoteServices.getVolunteerEnrollments();
      this.assessments = await RemoteServices.getAssessmentsByVolunteer();
      this.participations = await RemoteServices.getParticipationsByVolunteer();
    } catch (error) {
      await this.$store.dispatch('error', error);
    }
    await this.$store.dispatch('clearLoading');
  }

  onSaveAssessment(assessment: Assessment) {
    this.assessments.unshift(assessment);
    this.writeAssessmentDialog = false;
    this.currentInstitution = null;
  }

  onCloseWriteAssessmentDialog() {
    this.currentInstitution = null;
    this.writeAssessmentDialog = false;
  }

  writeAssessment(activity: Activity) {
    this.currentInstitution = new Institution(activity.institution);
    this.writeAssessmentDialog = true;
  }

  alreadyAssessedInstitution(institution: Institution) {
    return this.assessments.some(
      (assessment) => assessment.institutionId === institution.id,
    );
  }

  participatesInActivity(activity: Activity) {
    return this.participations.some(
      (participation) => participation.activityId === activity.id,
    );
  }

  verifyVolunteerCanAssess(item: Activity) {
    return (
      new Date() > new Date(item.formattedEndingDate) &&
      !this.alreadyAssessedInstitution(item.institution) &&
      this.participatesInActivity(item)
    );
  }

  async reportActivity(activity: Activity) {
    this.applyForActivityDialog = false;
    if (activity.id !== null) {
      try {
        const result = await RemoteServices.reportActivity(
          this.$store.getters.getUser.id,
          activity.id,
        );
        this.activities = this.activities.filter((a) => a.id !== activity.id);
        this.activities.unshift(result);
      } catch (error) {
        await this.$store.dispatch('error', error);
      }
    }
  }
  onCloseEnrollmentDialog() {
    this.currentEnrollment = null;
    this.applyForActivityDialog = false;
  }

  onSaveEnrollment(enrollment: Enrollment) {
    this.enrollments.unshift(enrollment);
    this.applyForActivityDialog = false;
    this.currentActivity = null;
  }
  applyForActivity(activity: Activity) {
    this.currentActivity = activity;
    this.applyForActivityDialog = true;
  }

  volunteerAlreadyApplied(activity: Activity) {
    return this.enrollments.some(
      (enrollment) => enrollment.activityId === activity.id,
    );
  }

  showEnrollmentButtonDeadLine(activity: Activity) {
    return new Date(activity.applicationDeadline) > new Date();
  }
}
</script>

<style lang="scss" scoped></style>
