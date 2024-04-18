<!-- has the actual behaviour for the SelectParticipant dialog box -->

<template>
  <v-dialog v-model="dialog" persistent width="1300">
    <v-card>
      <v-card-title>
        <span class="headline">
          {{ 'Select Participant' }}
        </span>
      </v-card-title>
      <v-card-text>
        <v-form ref="form" lazy-validation>
          <v-row>
            <v-col cols="12">
              <v-text-field
                label="Rating"
                hint="A number between 1 and 5. Leave empty for no limit."
                v-model="editParticipant.rating"
                :rules="[
                  (v) =>
                    isNumberValid(v) ||
                    'Rating, if not empty, should be between 1 and 5.',
                ]"
                data-cy="ratingInput"
              ></v-text-field>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          color="blue-darken-1"
          variant="text"
          @click="$emit('close-select-participant-dialog')"
        >
          Close
        </v-btn>
        <v-btn
          color="blue-darken-1"
          variant="text"
          @click="updateParticipant"
          data-cy="saveParticipant"
        >
          Save
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<script lang="ts">
import { Vue, Component, Prop, Model } from 'vue-property-decorator';
import Participation from '@/models/participation/Participation';
import { ISOtoString } from '@/services/ConvertDateService';
import Enrollment from '@/models/enrollment/Enrollment';
import RemoteServices from '@/services/RemoteServices';

@Component({
  methods: { ISOtoString },
})
export default class SelectParticipantDialog extends Vue {
  @Model('dialog', Boolean) dialog!: boolean;
  @Prop({ type: Enrollment, required: true }) readonly enrollment!: Enrollment;

  editEnrollment: Enrollment = new Enrollment();
  editParticipant: Participation = new Participation();

  cypressCondition: boolean = false;

  async created() {
    this.editEnrollment = new Enrollment(this.enrollment);
    this.editParticipant.volunteerId = this.enrollment.volunteerId;
  }

  isNumberValid(value: number | null | undefined): boolean {
    if (value === null || value === undefined) return true; // Allow null or undefined
    return value >= 1 && value <= 5;
  }

  async updateParticipant() {
    if ((this.$refs.form as Vue & { validate: () => boolean }).validate()) {
      try {
        if (this.editEnrollment.activityId !== null) {
          const result = await RemoteServices.registerParticipation(
            this.$store.getters.getUser.id,
            this.editEnrollment.activityId,
            this.editParticipant,
          );
          this.$emit('save-participants', result);
        }
      } catch (error) {
        await this.$store.dispatch('error', error);
      }
    }
  }
}
</script>
