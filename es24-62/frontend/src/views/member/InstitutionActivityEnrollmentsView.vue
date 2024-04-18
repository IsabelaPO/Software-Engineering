<template>
  <v-card class="table">
    <div class="text-h3">{{ activity.name }}</div>
    <v-data-table
      :headers="headers"
      :items="enrollments"
      :search="search"
      disable-pagination
      :hide-default-footer="true"
      :mobile-breakpoint="0"
      data-cy="activityEnrollmentsTable"
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
          <v-btn
            color="primary"
            dark
            @click="getActivities"
            data-cy="getActivities"
            >Activities</v-btn
          >
        </v-card-title>
      </template>
      <!-- Define slot for Volunteer Name -->
      <template v-slot:[`item.volunteerName`]="{ item }">
        <span>{{ item.volunteer_name }}</span>
      </template>
      <!-- Define slot for Participation Status -->
      <template v-slot:[`item.participationStatus`]="{ item }">
        <span>{{ calculateParticipationStatus(item) }}</span>
      </template>
      <!-- Define slot for Actions -->
      <template v-slot:[`item.action`]="{ item }">
        <v-tooltip v-if="!isButtonDisabled(item)" bottom>
          <template v-slot:activator="{ on }">
            <v-icon
              class="mr-2 action-button"
              @click="selectParticipants(item)"
              v-on="on"
              data-cy="selectParticipants"
              >fa-solid fa-check
            </v-icon>
          </template>
          <span>Select Participants</span>
        </v-tooltip>
      </template>
    </v-data-table>
    <select-participant-dialog
      v-if="editParticipant"
      v-model="editParticipant"
      :enrollment="currentEnrollment"
      v-on:save-participants="onSaveParticipants"
      v-on:close-select-participant-dialog="onCloseParticipantsDialog"
    />
  </v-card>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import RemoteServices from '@/services/RemoteServices';
import Activity from '@/models/activity/Activity';
import Enrollment from '@/models/enrollment/Enrollment';
import SelectParticipantDialog from '@/views/member/ParticipationSelectionDialog.vue';
import Participation from '@/models/participation/Participation';

@Component({
  components: {
    'select-participant-dialog': SelectParticipantDialog,
  },
})
export default class InstitutionActivityEnrollmentsView extends Vue {
  activity!: Activity;
  enrollments: Enrollment[] = [];
  search: string = '';
  currentEnrollment: Enrollment | null = null;
  rating: any = null;
  editParticipant: boolean = false;
  participations: Participation[] = [];

  headers: object = [
    {
      text: 'Volunteer Name',
      value: 'volunteerName',
      align: 'left',
      width: '20%',
    },
    {
      text: 'Motivation',
      value: 'motivation',
      align: 'left',
      width: '50%',
    },
    {
      text: 'Application Date',
      value: 'enrollmentDateTime',
      align: 'left',
      width: '5%',
    },
    {
      text: 'Participation Status',
      value: 'participationStatus',
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
    this.activity = this.$store.getters.getActivity;
    if (this.activity !== null && this.activity.id !== null) {
      await this.$store.dispatch('loading');
      try {
        this.enrollments = await RemoteServices.getActivityEnrollments(
          this.activity.id,
        );
        this.participations = await RemoteServices.getParticipationsByActivity(
          this.activity.id,
        );
      } catch (error) {
        await this.$store.dispatch('error', error);
      }
      await this.$store.dispatch('clearLoading');
    }
  }

  selectParticipants(enrollment: Enrollment) {
    this.currentEnrollment = enrollment;
    this.editParticipant = true;
  }

  isButtonDisabled(enrollment: Enrollment) {
    const condition_participationlimits =
      this.activity.numberOfParticipations >=
      this.activity.participantsNumberLimit;
    const condition_volunteerIsParticipating =
      this.calculateParticipationStatus(enrollment) == 'true';
    return condition_participationlimits || condition_volunteerIsParticipating;
  }

  async onSaveParticipants(participation: Participation) {
    this.participations.unshift(participation);
    this.activity.numberOfParticipations = this.participations.length;
    this.currentEnrollment = null;
    this.editParticipant = false;
  }

  onCloseParticipantsDialog() {
    this.currentEnrollment = null;
    this.editParticipant = false;
  }

  async getActivities() {
    await this.$store.dispatch('setActivity', null);
    this.$router.push({ name: 'institution-activities' }).catch(() => {});
  }

  calculateParticipationStatus(item: Enrollment) {
    // Use Array.some() to check if there exists any participation with matching volunteerId
    const isParticipating = this.participations.some(
      (participation) => participation.volunteerId === item.volunteerId,
    );
    // Return 'true' if there's a match, 'false' otherwise
    return isParticipating ? 'true' : 'false';
  }
}
</script>

<style lang="scss" scoped>
.date-fields-container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.date-fields-row {
  display: flex;
  gap: 16px;
  margin-top: 8px;
}
</style>
