<template>
  <q-page class="entity-page">
    <header class="entity-page__header">
      <div class="entity-page__heading">
        <q-btn flat dense round icon="arrow_back" color="grey-7" @click="router.push('/events')" />
        <h1 class="entity-page__title">{{ dashboard.event?.name || "Event dashboard" }}</h1>
      </div>
      <div class="entity-page__actions">
        <q-btn
          v-if="auth.canDo('action.events.scan')"
          dense
          unelevated
          no-caps
          color="primary"
          icon="qr_code_scanner"
          label="Scan attendance"
          @click="router.push(`/events/${eventId}/scan`)"
        />
        <q-btn
          v-if="auth.canDo('action.events.attendance')"
          dense
          outline
          no-caps
          color="primary"
          icon="fact_check"
          label="Attendance sheet"
          @click="router.push(`/events/${eventId}/attendance`)"
        />
        <q-btn
          v-if="registrationOpen"
          dense
          outline
          no-caps
          color="primary"
          icon="qr_code_2"
          label="Registration QR"
          @click="registrationQrDialogOpen = true"
        />
        <q-btn
          v-if="auth.canDo('action.events.edit')"
          dense
          outline
          no-caps
          color="grey-8"
          icon="edit"
          label="Edit event"
          @click="editDialogOpen = true"
        />
      </div>
    </header>

    <q-inner-loading :showing="loading">
      <q-spinner size="36px" color="primary" />
    </q-inner-loading>

    <template v-if="dashboard.event">
      <section class="event-dashboard__stats row q-col-gutter-sm q-mb-md">
        <div class="col-6 col-sm-4 col-md-3 col-lg-2">
          <button
            type="button"
            class="event-stat-card event-stat-card--clickable"
            @click="openParticipantsView('all')"
          >
            <span class="event-stat-card__label">Participants</span>
            <span class="event-stat-card__value">{{ participantsWithReservedTotal }}</span>
            <span
              v-if="dashboard.stats.kidsCount || reservationTotal"
              class="event-stat-card__breakdown"
            >
              <span v-if="reservationTotal">{{ dashboard.stats.participantCount }} registered</span>
              <span v-if="dashboard.stats.kidsCount">{{ dashboard.stats.adultCount }} adults</span>
              <span v-if="dashboard.stats.kidsCount">{{ dashboard.stats.kidsCount }} kids</span>
              <span v-if="reservationTotal">{{ reservationTotal }} reserved</span>
            </span>
            <span class="event-stat-card__hint">View list</span>
          </button>
        </div>
        <div class="col-6 col-sm-4 col-md-3 col-lg-2">
          <div class="event-stat-card">
            <span class="event-stat-card__label">Expected</span>
            <span class="event-stat-card__value">{{ dashboard.event.expectedParticipants || "—" }}</span>
          </div>
        </div>
        <div class="col-6 col-sm-4 col-md-3 col-lg-2">
          <button
            type="button"
            class="event-stat-card event-stat-card--clickable"
            @click="openParticipantsView('church')"
          >
            <span class="event-stat-card__label">Reserved</span>
            <span class="event-stat-card__value">{{ reservationTotal || 0 }}</span>
            <span class="event-stat-card__breakdown">
              <span>{{ (dashboard.reservations || []).length }} guest list(s)</span>
            </span>
            <span class="event-stat-card__hint">View reservations</span>
          </button>
        </div>
        <div class="col-6 col-sm-4 col-md-3 col-lg-2">
          <div class="event-stat-card">
            <span class="event-stat-card__label">Attended</span>
            <span class="event-stat-card__value">{{ dashboard.stats.attendedCount }}</span>
          </div>
        </div>
        <div class="col-6 col-sm-4 col-md-3 col-lg-2">
          <div class="event-stat-card">
            <span class="event-stat-card__label">Attendance</span>
            <span class="event-stat-card__value">{{ dashboard.stats.attendanceRate }}%</span>
          </div>
        </div>
        <div v-if="hasRegistrationFee" class="col-6 col-sm-4 col-md-3 col-lg-2">
          <div class="event-stat-card">
            <span class="event-stat-card__label">Registration</span>
            <span class="event-stat-card__value">{{ formatCurrency(dashboard.stats.registrationCollected) }}</span>
          </div>
        </div>
        <div v-if="showTotalCollected" class="col-6 col-sm-4 col-md-3 col-lg-2">
          <div class="event-stat-card">
            <span class="event-stat-card__label">Total collected</span>
            <span class="event-stat-card__value">{{ formatCurrency(dashboard.stats.totalCollected) }}</span>
          </div>
        </div>
      </section>

      <section class="entity-page__panel q-mb-md">
        <div class="event-dashboard__section-header">
          <h2>Reservations</h2>
          <div class="event-dashboard__section-actions">
            <span v-if="reservationTotal" class="event-dashboard__reservation-total">
              Total reserved: {{ reservationTotal }}
            </span>
            <q-btn
              v-if="canManageReservations"
              dense
              unelevated
              no-caps
              color="primary"
              icon="event_seat"
              label="Add reservation"
              @click="openReservationDialog"
            />
          </div>
        </div>
        <p class="event-dashboard__section-note">
          Reserve expected guests who are not members of any registered church (e.g. Friends, Relatives).
        </p>
        <q-table
          :rows="dashboard.reservations || []"
          :columns="reservationColumns"
          row-key="id"
          flat
          dense
          :pagination="{ rowsPerPage: 10 }"
          class="entity-table"
        >
          <template #body-cell-reservedCount="props">
            <q-td :props="props">
              <strong>
                {{ Number(props.row.filledCount || 0) }} / {{ props.row.reservedCount }}
              </strong>
            </q-td>
          </template>
          <template #body-cell-actions="props">
            <q-td :props="props" class="entity-table__actions">
              <q-btn
                v-if="canManageReservations"
                flat
                dense
                round
                size="sm"
                color="grey-7"
                icon="person_add"
                :disable="isReservationFilled(props.row)"
                @click="openReservationNamesDialog(props.row)"
              >
                <q-tooltip>
                  {{
                    isReservationFilled(props.row)
                      ? "Reservation is full"
                      : "Add names to this reservation"
                  }}
                </q-tooltip>
              </q-btn>
              <q-btn
                v-if="canManageReservations"
                flat
                dense
                round
                size="sm"
                color="grey-7"
                icon="edit"
                @click="editReservation(props.row)"
              >
                <q-tooltip>Edit</q-tooltip>
              </q-btn>
              <q-btn
                v-if="canManageReservations"
                flat
                dense
                round
                size="sm"
                color="grey-7"
                icon="delete_outline"
                @click="removeReservation(props.row)"
              >
                <q-tooltip>Delete</q-tooltip>
              </q-btn>
            </q-td>
          </template>
          <template #no-data>
            <div class="full-width row flex-center q-pa-md text-grey-6">
              No reservations yet. Use Add reservation to enter guest group headcounts.
            </div>
          </template>
        </q-table>
      </section>

      <section class="entity-page__panel q-mb-md">
        <div class="event-dashboard__section-header">
          <h2>Event details</h2>
        </div>
        <div class="event-dashboard__details">
          <dl class="entity-details">
            <div class="entity-details__item">
              <dt class="entity-details__label">Date</dt>
              <dd class="entity-details__value">{{ formatDate(dashboard.event.eventDate) }}</dd>
            </div>
            <div class="entity-details__item">
              <dt class="entity-details__label">Time</dt>
              <dd class="entity-details__value">{{ formatEventTime(dashboard.event.eventTime) }}</dd>
            </div>
            <div class="entity-details__item">
              <dt class="entity-details__label">Location</dt>
              <dd class="entity-details__value">{{ dashboard.event.location }}</dd>
            </div>
            <div class="entity-details__item">
              <dt class="entity-details__label">Status</dt>
              <dd class="entity-details__value">
                <q-badge :color="statusColor(dashboard.event.status)" :label="dashboard.event.status" />
              </dd>
            </div>
            <div class="entity-details__item">
              <dt class="entity-details__label">Type</dt>
              <dd class="entity-details__value">{{ dashboard.event.eventType }}</dd>
            </div>
            <div class="entity-details__item">
              <dt class="entity-details__label">Registration fee</dt>
              <dd class="entity-details__value">
                {{ dashboard.event.registrationFee > 0 ? formatCurrency(dashboard.event.registrationFee) : "Free" }}
              </dd>
            </div>
            <div class="entity-details__item">
              <dt class="entity-details__label">Pre-registration</dt>
              <dd class="entity-details__value">
                {{ dashboard.event.requiresPreRegistration ? "Required" : "Not required" }}
              </dd>
            </div>
            <div class="entity-details__item entity-details__item--full">
              <dt class="entity-details__label">Description</dt>
              <dd class="entity-details__value">{{ dashboard.event.description }}</dd>
            </div>
            <div class="entity-details__item">
              <dt class="entity-details__label">Organizer</dt>
              <dd class="entity-details__value">{{ dashboard.event.organizer || "—" }}</dd>
            </div>
            <div class="entity-details__item">
              <dt class="entity-details__label">Contact</dt>
              <dd class="entity-details__value">
                {{ dashboard.event.contactPerson || "—" }}
                <span v-if="dashboard.event.contactEmail"> · {{ dashboard.event.contactEmail }}</span>
              </dd>
            </div>
            <div class="entity-details__item">
              <dt class="entity-details__label">Tags</dt>
              <dd class="entity-details__value">{{ dashboard.event.tags || "—" }}</dd>
            </div>
            <div class="entity-details__item">
              <dt class="entity-details__label">Created at</dt>
              <dd class="entity-details__value">{{ formatDateTime(dashboard.event.createdAt) }}</dd>
            </div>
            <div class="entity-details__item">
              <dt class="entity-details__label">Updated at</dt>
              <dd class="entity-details__value">{{ formatDateTime(dashboard.event.updatedAt) }}</dd>
            </div>
            <div class="entity-details__item">
              <dt class="entity-details__label">Created by</dt>
              <dd class="entity-details__value">{{ dashboard.event.createdByName || "—" }}</dd>
            </div>
            <div class="entity-details__item">
              <dt class="entity-details__label">Updated by</dt>
              <dd class="entity-details__value">{{ dashboard.event.updatedByName || "—" }}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section v-if="registrationOpen" class="entity-page__panel q-mb-md">
        <div class="event-dashboard__section-header">
          <h2>Registration link</h2>
          <q-badge color="positive" label="Active" />
        </div>
        <div class="event-dashboard__registration">
          <q-input
            :model-value="registrationUrl"
            dense
            outlined
            readonly
            label="Public registration URL"
            class="event-dashboard__registration-input"
          >
            <template #append>
              <q-btn
                flat
                dense
                no-caps
                color="primary"
                icon="content_copy"
                label="Copy"
                @click="copyRegistrationLink"
              />
              <q-btn
                flat
                dense
                no-caps
                color="primary"
                icon="open_in_new"
                label="Open"
                :href="registrationUrl"
                target="_blank"
              />
            </template>
          </q-input>
          <p class="event-dashboard__registration-note">
            Share this link or QR code so participants can scan to register.
          </p>

          <div class="event-dashboard__registration-qr q-mt-md">
            <EventRegistrationQrCard
              :event-id="eventId"
              :event="dashboard.event"
              :size="200"
              :show-fullscreen="true"
            />
          </div>
        </div>
      </section>

      <section class="entity-page__panel q-mb-md">
        <div class="event-dashboard__section-header">
          <h2>Participants</h2>
          <div class="event-dashboard__section-actions">
            <q-btn
              dense
              flat
              no-caps
              color="grey-8"
              icon="download"
              label="Download template"
              @click="openTemplateDialog"
            />
            <q-btn
              dense
              flat
              no-caps
              color="grey-8"
              icon="upload_file"
              label="Upload Excel"
              :loading="uploadingParticipants"
              @click="openUploadPicker"
            />
            <input
              ref="uploadInputRef"
              type="file"
              accept=".xlsx,.xls"
              class="event-dashboard__upload-input"
              @change="onUploadSelected"
            />
            <q-btn
              dense
              outline
              no-caps
              color="primary"
              icon="church"
              label="By church"
              :disable="!dashboard.participants.length && !(dashboard.reservations || []).length"
              @click="openParticipantsView('church')"
            />
            <q-btn
              dense
              outline
              no-caps
              color="primary"
              icon="sell"
              label="By tag"
              :disable="!dashboard.participants.length"
              @click="openParticipantsView('tag')"
            />
            <q-btn
              v-if="auth.canDo('action.events.manage_participants')"
              dense
              unelevated
              no-caps
              color="primary"
              icon="person_add"
              label="Add participant"
              @click="openParticipantDialog"
            />
          </div>
        </div>
        <q-table
          :rows="tagFilteredParticipants"
          :columns="participantColumns"
          row-key="id"
          flat
          dense
          :filter="participantFilter"
          :filter-method="filterParticipants"
          v-model:pagination="participantPagination"
          class="entity-table"
        >
          <template #top>
            <div class="event-dashboard__participants-toolbar">
              <q-input
                v-model="participantFilter"
                dense
                borderless
                clearable
                placeholder="Search participants…"
                class="entity-table__search"
              >
                <template #prepend>
                  <q-icon name="search" size="18px" color="grey-6" />
                </template>
              </q-input>
              <q-btn-toggle
                v-model="participantTagMode"
                no-caps
                unelevated
                dense
                toggle-color="primary"
                color="white"
                text-color="grey-8"
                :options="participantTagModeOptions"
                :disable="!participantTagFilter.length"
                class="event-dashboard__tag-mode"
              />
              <AppSelect
                v-model="participantTagFilter"
                :options="participantTagOptions"
                dense
                borderless
                clearable
                multiple
                use-chips
                emit-value
                map-options
                placeholder="Filter by tags"
                class="event-dashboard__tag-select"
              >
                <template #prepend>
                  <q-icon name="sell" size="18px" color="grey-6" />
                </template>
              </AppSelect>
            </div>
          </template>

          <template #body-cell-churchName="props">
            <q-td :props="props">
              <span class="entity-table__muted">{{ props.row.churchName || "—" }}</span>
            </q-td>
          </template>
          <template #body-cell-lifegroupName="props">
            <q-td :props="props">
              <span class="entity-table__muted">{{ props.row.lifegroupName || "—" }}</span>
            </q-td>
          </template>
          <template #body-cell-tags="props">
            <q-td :props="props">
              <div v-if="props.row.tags?.length" class="event-dashboard__tags">
                <q-badge
                  v-for="tag in props.row.tags"
                  :key="tag"
                  outline
                  color="grey-7"
                  :label="tag"
                />
              </div>
              <span v-else class="entity-table__muted">—</span>
            </q-td>
          </template>
          <template #body-cell-registrationPaid="props">
            <q-td :props="props">
              <q-badge
                :color="props.row.registrationPaid ? 'positive' : 'warning'"
                :label="props.row.registrationPaid ? 'Paid' : 'Unpaid'"
              />
              <q-btn
                v-if="!props.row.registrationPaid"
                flat
                dense
                no-caps
                size="sm"
                color="primary"
                label="Pay link"
                class="q-ml-xs"
                @click="copyPayLink(props.row)"
              />
            </q-td>
          </template>
          <template #body-cell-actions="props">
            <q-td :props="props" class="entity-table__actions">
              <q-btn flat dense round size="sm" color="grey-7" icon="edit" @click="editParticipant(props.row)">
                <q-tooltip>Edit</q-tooltip>
              </q-btn>
              <q-btn flat dense round size="sm" color="grey-7" icon="delete_outline" @click="removeParticipant(props.row)">
                <q-tooltip>Remove</q-tooltip>
              </q-btn>
            </q-td>
          </template>

          <template #no-data>
            <div class="full-width row flex-center q-pa-md text-grey-6">
              {{
                participantFilter || participantTagFilter.length
                  ? "No participants match your search."
                  : "No participants yet."
              }}
            </div>
          </template>
        </q-table>
      </section>

      <section v-if="dashboard.event.allowPledges" class="entity-page__panel">
        <div class="event-dashboard__section-header">
          <h2>Pledges</h2>
          <q-btn dense unelevated no-caps color="primary" icon="volunteer_activism" label="Add pledge" @click="openPledgeDialog" />
        </div>
        <q-table
          :rows="dashboard.pledges"
          :columns="pledgeColumns"
          row-key="id"
          flat
          dense
          :pagination="{ rowsPerPage: 10 }"
          class="entity-table"
        >
          <template #body-cell-amount="props">
            <q-td :props="props">{{ formatCurrency(props.row.amount) }}</q-td>
          </template>
          <template #body-cell-paid="props">
            <q-td :props="props">
              <q-badge :color="props.row.paid ? 'positive' : 'warning'" :label="props.row.paid ? 'Paid' : 'Pending'" />
            </q-td>
          </template>
          <template #body-cell-actions="props">
            <q-td :props="props" class="entity-table__actions">
              <q-btn flat dense round size="sm" color="grey-7" icon="edit" @click="editPledge(props.row)">
                <q-tooltip>Edit</q-tooltip>
              </q-btn>
              <q-btn flat dense round size="sm" color="grey-7" icon="delete_outline" @click="removePledge(props.row)">
                <q-tooltip>Delete</q-tooltip>
              </q-btn>
            </q-td>
          </template>
        </q-table>
      </section>
    </template>

    <EventFormDialog v-model="editDialogOpen" mode="edit" :event-id="eventId" @saved="onEventSaved" />

    <EventParticipantFormDialog
      v-model="participantDialogOpen"
      :mode="participantMode"
      :event-id="eventId"
      :participant="editingParticipant"
      @saved="loadDashboard"
    />

    <EventRegistrationQrDialog
      v-model="registrationQrDialogOpen"
      :event-id="eventId"
      :event="dashboard.event"
    />

    <EventParticipantsViewDialog
      v-model="participantsViewDialogOpen"
      :event-id="eventId"
      :event="dashboard.event"
      :participants="dashboard.participants"
      :reservations="dashboard.reservations || []"
      :church-options="allChurchOptions"
      :has-registration-fee="hasRegistrationFee"
      :initial-view="participantsViewInitialMode"
      @linked="loadDashboard"
      @deleted="loadDashboard"
    />

    <q-dialog v-model="templateDialogOpen" persistent>
      <q-card class="event-participant-template-dialog">
        <q-card-section class="event-participant-template-dialog__header">
          <div>
            <h2 class="event-participant-template-dialog__title">Download import template</h2>
            <p class="event-participant-template-dialog__subtitle">
              Choose a general template or one tied to a specific church for this event.
            </p>
          </div>
          <q-btn flat round dense icon="close" color="grey-7" @click="closeTemplateDialog" />
        </q-card-section>

        <q-separator />

        <q-card-section class="event-participant-template-dialog__body">
          <q-option-group
            v-model="templateScope"
            :options="templateScopeOptions"
            type="radio"
            color="primary"
            dense
          />

          <AppSelect
            v-if="templateScope === 'church'"
            v-model="templateChurchId"
            :options="allChurchOptions"
            label="Church *"
            dense
            outlined
            emit-value
            map-options
            clearable
            class="event-participant-template-dialog__church-select"
            :loading="churchesLoading"
          />

          <AppSelect
            v-if="templateScope === 'church' && templateChurchId"
            v-model="templateLifeGroupId"
            :options="templateLifeGroupOptions"
            label="Lifegroup (optional)"
            dense
            outlined
            emit-value
            map-options
            clearable
            class="event-participant-template-dialog__lifegroup-select"
            :loading="lifeGroupsLoading"
          />

          <p v-if="templateScope === 'general'" class="event-participant-template-dialog__hint">
            This template includes the event identifier. Existing members are matched by name and linked
            to the event. Names not found are added as event-only participants, not as members. Lifegroup
            assignment requires a church template.
          </p>
          <p v-else class="event-participant-template-dialog__hint">
            The template includes hidden event and church identifiers. Existing members are matched by
            name and linked to the event. Names not found are created as members under the selected
            church, then added as participants. Optionally select a lifegroup to pre-fill the template
            with that group's members (Kids are excluded) and auto-link everyone on import. You can
            still fill the Lifegroup column per row to override or assign a different group.
          </p>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right" class="event-participant-template-dialog__actions">
          <q-btn flat no-caps color="grey-8" label="Cancel" @click="closeTemplateDialog" />
          <q-btn
            unelevated
            no-caps
            color="primary"
            label="Download"
            :loading="templateDownloading"
            :disable="templateDownloading || (templateScope === 'church' && !templateChurchId)"
            @click="downloadTemplate"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="pledgeDialogOpen" persistent>
      <q-card class="entity-dialog">
        <header class="entity-dialog__header">
          <div>
            <h2 class="entity-dialog__title">{{ pledgeMode === 'create' ? 'Add pledge' : 'Edit pledge' }}</h2>
          </div>
          <q-btn flat round dense icon="close" color="grey-7" @click="pledgeDialogOpen = false" />
        </header>
        <q-separator />
        <q-card-section class="entity-dialog__body">
          <q-form ref="pledgeFormRef" class="entity-dialog__form">
            <div class="row q-col-gutter-sm">
              <div class="col-12">
                <q-input v-model="pledgeForm.pledgerName" label="Pledger name *" dense outlined :rules="[requiredRule]" />
              </div>
              <div class="col-12 col-sm-6">
                <q-input v-model="pledgeForm.email" type="email" label="Email" dense outlined />
              </div>
              <div class="col-12 col-sm-6">
                <q-input v-model.number="pledgeForm.amount" type="number" min="0" step="0.01" label="Amount *" dense outlined prefix="₱" :rules="[requiredRule]" />
              </div>
              <div class="col-12">
                <q-toggle v-model="pledgeForm.paid" label="Mark as paid" dense />
              </div>
            </div>
          </q-form>
        </q-card-section>
        <q-separator />
        <footer class="entity-dialog__footer">
          <q-btn flat no-caps label="Cancel" color="grey-8" @click="pledgeDialogOpen = false" />
          <q-btn unelevated no-caps color="primary" label="Save" :loading="pledgeSaving" @click="savePledge" />
        </footer>
      </q-card>
    </q-dialog>

    <q-dialog v-model="reservationDialogOpen" persistent>
      <q-card class="entity-dialog">
        <header class="entity-dialog__header">
          <div>
            <h2 class="entity-dialog__title">
              {{ reservationMode === "create" ? "Add reservation" : "Edit reservation" }}
            </h2>
            <p class="entity-dialog__subtitle">
              For guests who are not members of any registered church
            </p>
          </div>
          <q-btn flat round dense icon="close" color="grey-7" @click="reservationDialogOpen = false" />
        </header>
        <q-separator />
        <q-card-section class="entity-dialog__body">
          <q-form ref="reservationFormRef" class="entity-dialog__form">
            <div class="row q-col-gutter-sm">
              <div class="col-12">
                <q-input
                  v-model="reservationForm.label"
                  label="Group name *"
                  dense
                  outlined
                  hide-bottom-space
                  :rules="[requiredRule]"
                  hint="e.g. Friends, Relatives, Visitors"
                />
              </div>
              <div class="col-12">
                <q-input
                  v-model.number="reservationForm.reservedCount"
                  type="number"
                  min="0"
                  label="Number of people *"
                  dense
                  outlined
                  hide-bottom-space
                  :rules="[reservedCountRule]"
                />
              </div>
            </div>
          </q-form>
        </q-card-section>
        <q-separator />
        <footer class="entity-dialog__footer">
          <q-btn flat no-caps label="Cancel" color="grey-8" @click="reservationDialogOpen = false" />
          <q-btn
            unelevated
            no-caps
            color="primary"
            label="Save"
            :loading="reservationSaving"
            @click="saveReservation"
          />
        </footer>
      </q-card>
    </q-dialog>

    <q-dialog v-model="reservationNamesDialogOpen" persistent>
      <q-card class="entity-dialog">
        <header class="entity-dialog__header">
          <div>
            <h2 class="entity-dialog__title">
              Add names · {{ reservationNamesTarget?.label || "Reservation" }}
            </h2>
            <p class="entity-dialog__subtitle">
              {{ reservationNamesFilledCount }} / {{ reservationNamesReservedCount }} filled ·
              {{ reservationNamesRemaining }} slot(s) left
            </p>
          </div>
          <q-btn
            flat
            round
            dense
            icon="close"
            color="grey-7"
            :disable="reservationNamesSaving"
            @click="reservationNamesDialogOpen = false"
          />
        </header>
        <q-separator />
        <q-card-section class="entity-dialog__body">
          <div class="event-dashboard__reservation-names">
            <div
              v-for="(name, index) in reservationNames"
              :key="index"
              class="event-dashboard__reservation-name-row"
            >
              <q-input
                v-model="reservationNames[index]"
                :label="`Name ${index + 1}`"
                dense
                outlined
                hide-bottom-space
                :disable="reservationNamesSaving"
                @keyup.enter="addReservationNameRow"
              />
              <q-btn
                v-if="reservationNames.length > 1"
                flat
                dense
                round
                size="sm"
                color="grey-7"
                icon="close"
                :disable="reservationNamesSaving"
                @click="removeReservationNameRow(index)"
              >
                <q-tooltip>Remove</q-tooltip>
              </q-btn>
            </div>
            <q-btn
              flat
              dense
              no-caps
              color="primary"
              icon="add"
              label="Add another name"
              class="self-start"
              :disable="
                reservationNamesSaving || reservationNames.length >= reservationNamesRemaining
              "
              @click="addReservationNameRow"
            />
          </div>
        </q-card-section>
        <q-separator />
        <footer class="entity-dialog__footer">
          <q-btn
            flat
            no-caps
            label="Cancel"
            color="grey-8"
            :disable="reservationNamesSaving"
            @click="reservationNamesDialogOpen = false"
          />
          <q-btn
            unelevated
            no-caps
            color="primary"
            label="Add names"
            :loading="reservationNamesSaving"
            :disable="reservationNamesSaving || !reservationNamesRemaining"
            @click="saveReservationNames"
          />
        </footer>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useQuasar } from "quasar";
import { api } from "src/boot/axios";
import { useAuthStore } from "src/stores/auth";
import EventFormDialog from "src/components/EventFormDialog.vue";
import EventParticipantFormDialog from "src/components/EventParticipantFormDialog.vue";
import EventRegistrationQrCard from "src/components/EventRegistrationQrCard.vue";
import EventRegistrationQrDialog from "src/components/EventRegistrationQrDialog.vue";
import EventParticipantsViewDialog from "src/components/EventParticipantsViewDialog.vue";
import AppSelect from "src/components/AppSelect.vue";
import {
  downloadEventParticipantBulkTemplate,
  parseEventParticipantBulkUpload
} from "src/utils/eventParticipantBulkExcel";
import { getChurchDisplayName, sortChurchesMainFirst } from "src/utils/churchDisplay";
import {
  getEventSignupUrl,
  isRegistrationOpen
} from "src/utils/eventRegistration";
import { formatEventTime } from "src/utils/eventTime";
import {
  filterParticipantsByTags,
  uniqueParticipantTags
} from "src/utils/participantTags";

const props = defineProps({
  id: { type: [String, Number], required: true }
});

const $q = useQuasar();
const auth = useAuthStore();
const route = useRoute();
const router = useRouter();
const eventId = props.id || route.params.id;

const loading = ref(false);
const dashboard = ref({ event: null, participants: [], pledges: [], reservations: [], stats: {} });
const editDialogOpen = ref(false);
const registrationQrDialogOpen = ref(false);
const participantsViewDialogOpen = ref(false);
const participantsViewInitialMode = ref("all");
const participantDialogOpen = ref(false);
const participantMode = ref("create");
const editingParticipant = ref(null);
const uploadingParticipants = ref(false);
const uploadInputRef = ref(null);
const templateDialogOpen = ref(false);
const templateScope = ref("general");
const templateChurchId = ref(null);
const templateLifeGroupId = ref(null);
const allChurchOptions = ref([]);
const templateLifeGroupOptions = ref([]);
const churchesLoading = ref(false);
const lifeGroupsLoading = ref(false);
const templateDownloading = ref(false);
const pledgeDialogOpen = ref(false);
const pledgeMode = ref("create");
const pledgeSaving = ref(false);
const editingPledgeId = ref(null);
const pledgeFormRef = ref(null);
const reservationDialogOpen = ref(false);
const reservationMode = ref("create");
const reservationSaving = ref(false);
const editingReservationId = ref(null);
const reservationFormRef = ref(null);
const reservationNamesDialogOpen = ref(false);
const reservationNamesSaving = ref(false);
const reservationNamesTarget = ref(null);
const reservationNames = ref([""]);

const requiredRule = (val) => !!val || "Required";
const reservedCountRule = (val) =>
  (val !== null && val !== undefined && val !== "" && Number(val) >= 0) || "Enter 0 or more";

const participantPagination = ref({
  page: 1,
  rowsPerPage: 10,
  sortBy: "lastName",
  descending: false
});
const participantFilter = ref("");
const participantTagFilter = ref([]);
const participantTagMode = ref("include");

const participantTagModeOptions = [
  { label: "Include", value: "include" },
  { label: "Exclude", value: "exclude" }
];

const participantTagOptions = computed(() =>
  uniqueParticipantTags(dashboard.value.participants).map((tag) => ({
    label: tag,
    value: tag
  }))
);

const tagFilteredParticipants = computed(() =>
  filterParticipantsByTags(dashboard.value.participants, participantTagFilter.value, {
    exclude: participantTagMode.value === "exclude"
  })
);

const templateScopeOptions = [
  { label: "General", value: "general" },
  { label: "Per church", value: "church" }
];

const pledgeForm = ref({
  pledgerName: "",
  email: "",
  amount: null,
  paid: false
});

const reservationForm = ref({
  label: "",
  reservedCount: null
});

const reservationTotal = computed(() =>
  (dashboard.value.reservations || []).reduce((sum, row) => sum + Number(row.reservedCount || 0), 0)
);

const participantsWithReservedTotal = computed(
  () => Number(dashboard.value.stats?.participantCount || 0) + reservationTotal.value
);

const canManageReservations = computed(
  () => auth.canDo("action.events.edit") || auth.canDo("action.events.manage_participants")
);

const reservationColumns = [
  { name: "label", label: "Group name", field: "label", align: "left", sortable: true },
  {
    name: "reservedCount",
    label: "Reserved",
    field: "reservedCount",
    align: "right",
    sortable: true
  },
  { name: "actions", label: "", field: "actions", align: "right" }
];

const reservationNamesFilledCount = computed(() =>
  Number(reservationNamesTarget.value?.filledCount || 0)
);
const reservationNamesReservedCount = computed(() =>
  Number(reservationNamesTarget.value?.reservedCount || 0)
);
const reservationNamesRemaining = computed(() =>
  Math.max(reservationNamesReservedCount.value - reservationNamesFilledCount.value, 0)
);

function isReservationFilled(row) {
  return Number(row?.filledCount || 0) >= Number(row?.reservedCount || 0);
}

const participantColumns = computed(() => {
  const columns = [
    { name: "lastName", label: "Last name", field: "lastName", align: "left", sortable: true },
    { name: "firstName", label: "First name", field: "firstName", align: "left", sortable: true },
    { name: "churchName", label: "Church", field: "churchName", align: "left", sortable: true },
    { name: "lifegroupName", label: "LifeGroup", field: "lifegroupName", align: "left", sortable: true },
    { name: "tags", label: "Tags", field: "tags", align: "left" }
  ];

  if (Number(dashboard.value.event?.registrationFee || 0) > 0) {
    columns.push({
      name: "registrationPaid",
      label: "PAID",
      field: "registrationPaid",
      align: "left"
    });
  }

  columns.push({ name: "actions", label: "", field: "actions", align: "right" });
  return columns;
});

const registrationUrl = computed(() => getEventSignupUrl(eventId));
const registrationOpen = computed(() => isRegistrationOpen(dashboard.value.event));
const hasRegistrationFee = computed(() => Number(dashboard.value.event?.registrationFee || 0) > 0);
const showTotalCollected = computed(
  () => hasRegistrationFee.value || !!dashboard.value.event?.allowPledges
);

const pledgeColumns = [
  { name: "pledgerName", label: "Pledger", field: "pledgerName", align: "left", sortable: true },
  { name: "email", label: "Email", field: "email", align: "left" },
  { name: "amount", label: "Amount", field: "amount", align: "right", sortable: true },
  { name: "paid", label: "Status", field: "paid", align: "left" },
  { name: "actions", label: "", field: "actions", align: "right" }
];

function formatCurrency(value) {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(value || 0);
}

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString();
}

function formatDateTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

function statusColor(status) {
  const map = { draft: "grey", published: "blue", ongoing: "orange", completed: "positive", cancelled: "negative" };
  return map[status] || "grey";
}

function copyPayLink(participant) {
  const url = `${window.location.origin}/events/${eventId}/register/${participant.id}`;
  navigator.clipboard?.writeText(url);
  $q.notify({ type: "info", message: "Payment link copied to clipboard." });
}

function copyRegistrationLink() {
  if (!registrationOpen.value) return;
  navigator.clipboard?.writeText(registrationUrl.value);
  $q.notify({ type: "positive", message: "Registration link copied to clipboard." });
}

function openParticipantDialog() {
  participantMode.value = "create";
  editingParticipant.value = null;
  participantDialogOpen.value = true;
}

function openParticipantsView(mode = "all") {
  participantsViewInitialMode.value = mode;
  participantsViewDialogOpen.value = true;
  if (!allChurchOptions.value.length) {
    loadChurches();
  }
}

function filterParticipants(rows, terms) {
  const needle = String(terms || "")
    .trim()
    .toLowerCase();
  if (!needle) return rows;

  return rows.filter((row) => {
    const haystack = [
      row.firstName,
      row.lastName,
      row.fullName,
      row.churchName,
      row.lifegroupName,
      row.email,
      row.phone,
      ...(Array.isArray(row.tags) ? row.tags : [])
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(needle);
  });
}

async function loadChurches() {
  churchesLoading.value = true;
  try {
    const { data } = await api.get("/churches");
    allChurchOptions.value = sortChurchesMainFirst(
      data.map((church) => ({
        label: getChurchDisplayName(church),
        value: Number(church.id)
      })),
      (church) => church.label
    );
  } finally {
    churchesLoading.value = false;
  }
}

async function loadTemplateLifeGroups(churchId) {
  templateLifeGroupOptions.value = [];
  if (!churchId) return;

  lifeGroupsLoading.value = true;
  try {
    const { data } = await api.get(`/churches/${churchId}/lifegroups`);
    templateLifeGroupOptions.value = (data || []).map((group) => ({
      label: group.name,
      value: Number(group.id)
    }));
  } catch {
    templateLifeGroupOptions.value = [];
    $q.notify({ type: "negative", message: "Failed to load lifegroups for this church." });
  } finally {
    lifeGroupsLoading.value = false;
  }
}

watch(templateChurchId, (churchId) => {
  templateLifeGroupId.value = null;
  loadTemplateLifeGroups(churchId);
});

watch(participantTagFilter, (tags) => {
  if (!tags.length && participantTagMode.value === "exclude") {
    participantTagMode.value = "include";
  }
});

watch(templateScope, (scope) => {
  if (scope !== "church") {
    templateChurchId.value = null;
    templateLifeGroupId.value = null;
    templateLifeGroupOptions.value = [];
  }
});

function openTemplateDialog() {
  templateScope.value = "general";
  templateChurchId.value = null;
  templateLifeGroupId.value = null;
  templateLifeGroupOptions.value = [];
  templateDialogOpen.value = true;
  if (!allChurchOptions.value.length) {
    loadChurches();
  }
}

function closeTemplateDialog() {
  templateDialogOpen.value = false;
}

function hasKidsTag(tags = []) {
  return (tags || []).some((tag) => String(tag || "").trim().toLowerCase() === "kids");
}

function buildLifeGroupParticipantRows(group) {
  const rows = [];
  const seen = new Set();

  const pushMember = ({ firstName, lastName, phone, tags }) => {
    const first = String(firstName || "").trim();
    const last = String(lastName || "").trim();
    if (!first || !last) return;

    const key = `${first.toLowerCase()}|${last.toLowerCase()}`;
    if (seen.has(key)) return;
    if (hasKidsTag(tags)) return;

    seen.add(key);
    rows.push({
      firstName: first,
      lastName: last,
      tag: "",
      phone: phone || "",
      lifeGroup: ""
    });
  };

  if (group?.coachId) {
    pushMember({
      firstName: group.coachFirstName,
      lastName: group.coachLastName,
      phone: group.coachPhone,
      tags: group.coachTags
    });
  }

  (group?.members || []).forEach((member) => {
    pushMember({
      firstName: member.firstName,
      lastName: member.lastName,
      phone: member.phone,
      tags: member.tags
    });
  });

  return rows.sort((a, b) => {
    const last = a.lastName.localeCompare(b.lastName, undefined, { sensitivity: "base" });
    if (last !== 0) return last;
    return a.firstName.localeCompare(b.firstName, undefined, { sensitivity: "base" });
  });
}

async function loadLifeGroupParticipantRows(lifeGroupId) {
  if (!lifeGroupId) return [];
  const { data } = await api.get(`/lifegroups/${lifeGroupId}`);
  return buildLifeGroupParticipantRows(data);
}

async function downloadTemplate() {
  if (templateScope.value === "church" && !templateChurchId.value) return;

  const selectedChurch = allChurchOptions.value.find((church) => church.value === templateChurchId.value);
  const selectedLifeGroup = templateLifeGroupOptions.value.find(
    (group) => group.value === templateLifeGroupId.value
  );

  templateDownloading.value = true;
  try {
    let participants = [];
    if (templateScope.value === "church" && templateLifeGroupId.value) {
      participants = await loadLifeGroupParticipantRows(templateLifeGroupId.value);
    }

    downloadEventParticipantBulkTemplate(
      templateScope.value === "church"
        ? {
            eventId: Number(eventId),
            eventName: dashboard.value.event?.name || null,
            churchId: templateChurchId.value,
            churchName: selectedChurch?.label || null,
            lifeGroupId: templateLifeGroupId.value || null,
            lifeGroupName: selectedLifeGroup?.label || null,
            participants
          }
        : {
            eventId: Number(eventId),
            eventName: dashboard.value.event?.name || null
          }
    );

    let message = "General participant import template downloaded.";
    if (templateScope.value === "church") {
      message = `Church participant template downloaded${selectedChurch ? ` for ${selectedChurch.label}` : ""}.`;
      if (selectedLifeGroup) {
        message = `Template downloaded for ${selectedChurch?.label || "church"} · ${selectedLifeGroup.label} (${participants.length} member${participants.length === 1 ? "" : "s"}, Kids excluded).`;
      }
    }

    $q.notify({ type: "info", message });
    closeTemplateDialog();
  } catch (err) {
    const message = err?.response?.data?.message || err?.message || "Failed to download template.";
    $q.notify({
      type: "negative",
      message: Array.isArray(message) ? message[0] : message
    });
  } finally {
    templateDownloading.value = false;
  }
}

function openUploadPicker() {
  uploadInputRef.value?.click();
}

function resetUploadInput() {
  if (uploadInputRef.value) uploadInputRef.value.value = "";
}

async function onUploadSelected(event) {
  const file = event.target.files?.[0];
  resetUploadInput();
  if (!file) return;

  uploadingParticipants.value = true;
  try {
    const payload = await parseEventParticipantBulkUpload(file);

    if (Number(payload.eventId) !== Number(eventId)) {
      throw new Error(
        "This template belongs to a different event. Download the template from this event dashboard."
      );
    }

    const { data } = await api.post(`/events/${eventId}/participants/import`, payload);

    await loadDashboard();

    if (data.errors?.length) {
      const preview = data.errors
        .slice(0, 3)
        .map((item) => `Row ${item.row}: ${item.message}`)
        .join(" · ");
      const suffix = data.errors.length > 3 ? ` (+${data.errors.length - 3} more)` : "";

      $q.notify({
        type: data.created ? "warning" : "negative",
        message: `${data.created} participant(s) imported. ${data.errors.length} row(s) failed.`,
        caption: `${preview}${suffix}`,
        timeout: 6000
      });
    } else {
      const churchNote = payload.churchId ? " and new members were assigned to the template church" : "";
      const lifeGroupNote = payload.lifeGroupId ? " and linked to the selected lifegroup" : "";
      $q.notify({
        type: "positive",
        message: `${data.created} participant(s) imported successfully${churchNote}${lifeGroupNote}.`
      });
    }
  } catch (err) {
    const message = err?.response?.data?.message || err?.message || "Failed to import participants.";
    $q.notify({
      type: "negative",
      message: Array.isArray(message) ? message[0] : message
    });
  } finally {
    uploadingParticipants.value = false;
  }
}

function editParticipant(row) {
  participantMode.value = "edit";
  editingParticipant.value = row;
  participantDialogOpen.value = true;
}

function removeParticipant(row) {
  $q.dialog({
    title: "Remove participant",
    message: `Remove ${row.fullName}?`,
    cancel: true,
    persistent: true
  }).onOk(async () => {
    await api.delete(`/events/${eventId}/participants/${row.id}`);
    $q.notify({ type: "positive", message: "Participant removed." });
    loadDashboard();
  });
}

function openPledgeDialog() {
  pledgeMode.value = "create";
  editingPledgeId.value = null;
  pledgeForm.value = { pledgerName: "", email: "", amount: null, paid: false };
  pledgeDialogOpen.value = true;
}

function editPledge(row) {
  pledgeMode.value = "edit";
  editingPledgeId.value = row.id;
  pledgeForm.value = {
    pledgerName: row.pledgerName,
    email: row.email || "",
    amount: row.amount,
    paid: row.paid
  };
  pledgeDialogOpen.value = true;
}

async function savePledge() {
  const valid = await pledgeFormRef.value?.validate();
  if (!valid) return;

  pledgeSaving.value = true;
  try {
    if (pledgeMode.value === "create") {
      await api.post(`/events/${eventId}/pledges`, pledgeForm.value);
    } else {
      await api.put(`/events/${eventId}/pledges/${editingPledgeId.value}`, pledgeForm.value);
    }
    pledgeDialogOpen.value = false;
    $q.notify({ type: "positive", message: "Pledge saved." });
    loadDashboard();
  } catch (err) {
    const message = err?.response?.data?.message || "Failed to save pledge.";
    $q.notify({ type: "negative", message: Array.isArray(message) ? message[0] : message });
  } finally {
    pledgeSaving.value = false;
  }
}

function removePledge(row) {
  $q.dialog({
    title: "Delete pledge",
    message: `Delete pledge from ${row.pledgerName}?`,
    cancel: true,
    persistent: true
  }).onOk(async () => {
    await api.delete(`/events/${eventId}/pledges/${row.id}`);
    $q.notify({ type: "positive", message: "Pledge deleted." });
    loadDashboard();
  });
}

function openReservationDialog() {
  reservationMode.value = "create";
  editingReservationId.value = null;
  reservationForm.value = { label: "", reservedCount: null };
  reservationDialogOpen.value = true;
}

function editReservation(row) {
  reservationMode.value = "edit";
  editingReservationId.value = row.id;
  reservationForm.value = {
    label: row.label || "",
    reservedCount: row.reservedCount
  };
  reservationDialogOpen.value = true;
}

function openReservationNamesDialog(row) {
  if (isReservationFilled(row)) return;
  reservationNamesTarget.value = row;
  reservationNames.value = [""];
  reservationNamesDialogOpen.value = true;
}

function addReservationNameRow() {
  if (reservationNames.value.length >= reservationNamesRemaining.value) return;
  reservationNames.value.push("");
}

function removeReservationNameRow(index) {
  if (reservationNames.value.length <= 1) {
    reservationNames.value = [""];
    return;
  }
  reservationNames.value.splice(index, 1);
}

async function saveReservationNames() {
  const names = reservationNames.value.map((name) => String(name || "").trim()).filter(Boolean);
  if (!names.length) {
    $q.notify({ type: "warning", message: "Add at least one name." });
    return;
  }
  if (names.length > reservationNamesRemaining.value) {
    $q.notify({
      type: "warning",
      message: `Only ${reservationNamesRemaining.value} slot(s) left on this reservation.`
    });
    return;
  }

  reservationNamesSaving.value = true;
  try {
    const { data } = await api.post(
      `/events/${eventId}/reservations/${reservationNamesTarget.value.id}/participants`,
      { names }
    );
    const created = Number(data?.created || 0);
    const errors = Array.isArray(data?.errors) ? data.errors : [];
    if (created) {
      $q.notify({
        type: "positive",
        message: created === 1 ? "1 name added." : `${created} names added.`
      });
    }
    if (errors.length) {
      $q.notify({
        type: "warning",
        message: errors.map((item) => item.message).join(" ")
      });
    }
    reservationNamesDialogOpen.value = false;
    loadDashboard();
  } catch (err) {
    const message = err?.response?.data?.message || "Failed to add names.";
    $q.notify({ type: "negative", message: Array.isArray(message) ? message[0] : message });
  } finally {
    reservationNamesSaving.value = false;
  }
}

async function saveReservation() {
  const valid = await reservationFormRef.value?.validate();
  if (!valid) return;

  reservationSaving.value = true;
  try {
    const payload = {
      label: reservationForm.value.label,
      reservedCount: reservationForm.value.reservedCount
    };
    if (reservationMode.value === "create") {
      await api.post(`/events/${eventId}/reservations`, payload);
    } else {
      await api.put(`/events/${eventId}/reservations/${editingReservationId.value}`, payload);
    }
    reservationDialogOpen.value = false;
    $q.notify({ type: "positive", message: "Reservation saved." });
    loadDashboard();
  } catch (err) {
    const message = err?.response?.data?.message || "Failed to save reservation.";
    $q.notify({ type: "negative", message });
  } finally {
    reservationSaving.value = false;
  }
}

function removeReservation(row) {
  $q.dialog({
    title: "Delete reservation",
    message: `Delete reservation for ${row.label}?`,
    cancel: true,
    persistent: true
  }).onOk(async () => {
    await api.delete(`/events/${eventId}/reservations/${row.id}`);
    $q.notify({ type: "positive", message: "Reservation deleted." });
    loadDashboard();
  });
}

function onEventSaved(data) {
  dashboard.value.event = { ...dashboard.value.event, ...data };
}

async function loadDashboard() {
  loading.value = true;
  try {
    const { data } = await api.get(`/events/${eventId}/dashboard`);
    dashboard.value = data;
  } catch {
    $q.notify({ type: "negative", message: "Failed to load event dashboard." });
    router.push("/events");
  } finally {
    loading.value = false;
  }
}

onMounted(loadDashboard);
</script>

<style scoped lang="scss">
.event-dashboard__stats {
  margin-top: 4px;
}

.event-stat-card {
  background: #fff;
  border: 1px solid #e4e8ef;
  border-radius: 8px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-height: 64px;
  width: 100%;
  text-align: left;
}

.event-stat-card--clickable {
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;

  &:hover {
    border-color: #1976d2;
    box-shadow: 0 2px 8px rgba(26, 26, 46, 0.08);
  }

  &:focus-visible {
    outline: 2px solid #1976d2;
    outline-offset: 2px;
  }
}

.event-stat-card__hint {
  font-size: 0.62rem;
  font-weight: 500;
  letter-spacing: 0.02em;
  color: #1976d2;
  margin-top: 2px;
}

.event-stat-card__breakdown {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 10px;
  margin-top: 2px;
  font-size: 0.68rem;
  font-weight: 500;
  color: #5f6b7a;
  line-height: 1.25;
}

.event-stat-card__label {
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #8b93a1;
}

.event-stat-card__value {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1a1a2e;
}

.event-dashboard__section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid #eef1f6;

  h2 {
    margin: 0;
    font-size: 0.85rem;
    font-weight: 600;
    color: #1a1a2e;
  }
}

.event-dashboard__section-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.event-dashboard__participants-toolbar {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.event-dashboard__tag-mode {
  flex-shrink: 0;
  border: 1px solid #e4e8ef;
  border-radius: 6px;

  :deep(.q-btn) {
    min-height: 30px;
    padding: 0 10px;
    font-size: 0.75rem;
  }
}

.event-dashboard__tag-select {
  min-width: 200px;
  max-width: 420px;
  flex: 1 1 220px;

  :deep(.q-field__control) {
    min-height: 30px;
    padding: 2px 8px;
    background: #f5f7fa;
    border-radius: 6px;
  }

  :deep(.q-field__native),
  :deep(.q-field__input) {
    font-size: 0.8rem;
    padding: 0;
    min-height: 24px;
  }

  :deep(.q-chip) {
    margin: 1px 2px;
    font-size: 0.72rem;
  }
}

.event-dashboard__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.event-dashboard__reservation-total {
  font-size: 0.82rem;
  font-weight: 600;
  color: #374151;
}

.event-dashboard__reservation-names {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.event-dashboard__reservation-name-row {
  display: flex;
  align-items: flex-start;
  gap: 4px;
}

.event-dashboard__reservation-name-row .q-input {
  flex: 1;
}

.event-dashboard__section-note {
  margin: 0 0 12px;
  font-size: 0.8rem;
  color: #6b7280;
  line-height: 1.4;
}

.event-dashboard__upload-input {
  display: none;
}

.event-participant-template-dialog {
  width: min(420px, 92vw);
}

.event-participant-template-dialog__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 16px 12px;
}

.event-participant-template-dialog__title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1a1a2e;
}

.event-participant-template-dialog__subtitle {
  margin: 4px 0 0;
  font-size: 0.78rem;
  color: #6b7280;
}

.event-participant-template-dialog__body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
}

.event-participant-template-dialog__church-select,
.event-participant-template-dialog__lifegroup-select {
  margin-top: 4px;
}

.event-participant-template-dialog__hint {
  margin: 0;
  font-size: 0.75rem;
  line-height: 1.45;
  color: #8b93a1;
}

.event-participant-template-dialog__actions {
  padding: 10px 12px;
}

.event-dashboard__details {
  padding: 12px;
}

.event-dashboard__registration {
  padding: 12px;
}

.event-dashboard__registration-input {
  width: 100%;
}

.event-dashboard__registration-note {
  margin: 8px 0 0;
  font-size: 0.78rem;
  color: #6b7280;
}

.event-dashboard__registration-note--closed {
  color: #9a3412;
}

.event-dashboard__registration-qr {
  border-top: 1px solid #eef1f6;
  padding-top: 12px;
}

@media (max-width: 1023px) {
  .event-dashboard__section-header {
    flex-wrap: wrap;
    gap: 8px;
  }
}
</style>
