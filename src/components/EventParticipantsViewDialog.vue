<template>
  <q-dialog
    :model-value="modelValue"
    maximized
    @update:model-value="$emit('update:modelValue', $event)"
    @show="onShow"
    @hide="onHide"
  >
    <q-card class="participants-view-dialog">
      <header class="participants-view-dialog__header">
        <div class="participants-view-dialog__heading">
          <q-btn flat dense round icon="arrow_back" color="grey-7" @click="close" />
          <div>
            <h2 class="participants-view-dialog__title">Participants</h2>
            <p class="participants-view-dialog__subtitle">
              {{ event?.name || "Event" }} · {{ participants.length }} participant(s)
            </p>
          </div>
        </div>

        <div class="participants-view-dialog__toolbar">
          <q-btn-toggle
            v-model="viewMode"
            no-caps
            unelevated
            toggle-color="primary"
            color="white"
            text-color="grey-8"
            :options="viewModeOptions"
            class="participants-view-dialog__toggle"
          />
          <q-btn flat round dense icon="close" color="grey-7" @click="close" />
        </div>
      </header>

      <q-separator />

      <q-card-section class="participants-view-dialog__body">
        <div v-if="!participants.length && !reservations.length" class="participants-view-dialog__empty">
          <q-icon name="groups" size="32px" color="grey-5" />
          <p>No participants yet.</p>
        </div>

        <template v-else-if="viewMode === 'all'">
          <div v-if="!participants.length" class="participants-view-dialog__empty">
            <q-icon name="groups" size="32px" color="grey-5" />
            <p>No participants yet.</p>
          </div>
          <q-table
            v-else
            :rows="sortedParticipants"
            :columns="allColumns"
            row-key="id"
            flat
            dense
            :filter="participantFilter"
            :filter-method="filterParticipants"
            :pagination="{ rowsPerPage: 25, sortBy: 'displayLastName', descending: false }"
            class="participants-view-dialog__table entity-table entity-page__panel"
          >
            <template #top>
              <div class="participants-view-dialog__table-toolbar">
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
                  v-model="tagMode"
                  no-caps
                  unelevated
                  dense
                  toggle-color="primary"
                  color="white"
                  text-color="grey-8"
                  :options="tagModeOptions"
                  :disable="!tagFilter.length"
                  class="participants-view-dialog__tag-mode"
                />
                <AppSelect
                  v-model="tagFilter"
                  :options="tagOptions"
                  dense
                  borderless
                  clearable
                  multiple
                  use-chips
                  emit-value
                  map-options
                  placeholder="Filter by tags"
                  class="participants-view-dialog__tag-select"
                >
                  <template #prepend>
                    <q-icon name="sell" size="18px" color="grey-6" />
                  </template>
                </AppSelect>
                <q-btn
                  dense
                  outline
                  no-caps
                  color="primary"
                  icon="print"
                  label="Print sheet"
                  class="participants-view-dialog__print-btn"
                  :disable="!tagFilteredParticipants.length"
                  @click="printFiltered"
                />
              </div>
            </template>

            <template #body-cell-churchName="props">
              <q-td :props="props">
                <span class="entity-table__muted">{{ props.row.displayChurch || "—" }}</span>
              </q-td>
            </template>

            <template #body-cell-lifegroupName="props">
              <q-td :props="props">
                <span class="entity-table__muted">{{ props.row.lifegroupName || "—" }}</span>
              </q-td>
            </template>

            <template #body-cell-tags="props">
              <q-td :props="props">
                <div v-if="props.row.tags?.length" class="participants-view-dialog__tags">
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
              </q-td>
            </template>

            <template #body-cell-attendedAt="props">
              <q-td :props="props">
                <q-badge
                  :color="props.row.attendedAt ? 'positive' : 'grey'"
                  :label="props.row.attendedAt ? 'Present' : 'Absent'"
                />
              </q-td>
            </template>

            <template #no-data>
              <div class="full-width row flex-center q-pa-md text-grey-6">
                {{
                  participantFilter || tagFilter.length
                    ? "No participants match your search."
                    : "No participants yet."
                }}
              </div>
            </template>
          </q-table>
        </template>

        <template v-else-if="viewMode === 'tag'">
          <div v-if="!tagGroups.length" class="participants-view-dialog__empty">
            <q-icon name="sell" size="32px" color="grey-5" />
            <p>
              {{
                tagFilter.length
                  ? tagExclude
                    ? "No participants left after excluding the selected tags."
                    : "No participants match the selected tags."
                  : "No tagged participants yet."
              }}
            </p>
          </div>

          <div v-else>
            <div class="participants-view-dialog__table-toolbar participants-view-dialog__table-toolbar--standalone">
              <q-btn-toggle
                v-model="tagMode"
                no-caps
                unelevated
                dense
                toggle-color="primary"
                color="white"
                text-color="grey-8"
                :options="tagModeOptions"
                :disable="!tagFilter.length"
                class="participants-view-dialog__tag-mode"
              />
              <AppSelect
                v-model="tagFilter"
                :options="tagOptions"
                dense
                borderless
                clearable
                multiple
                use-chips
                emit-value
                map-options
                placeholder="Filter by tags"
                class="participants-view-dialog__tag-select"
              >
                <template #prepend>
                  <q-icon name="sell" size="18px" color="grey-6" />
                </template>
              </AppSelect>
            </div>

            <div class="row q-col-gutter-md participants-view-dialog__cards">
              <div
                v-for="(group, index) in tagGroups"
                :key="group.key"
                class="col-12 col-sm-6 col-md-4 col-lg-3"
              >
                <q-card
                  flat
                  bordered
                  class="participants-view-dialog__stat-card"
                  :class="{ 'participants-view-dialog__stat-card--active': selectedKey === group.key }"
                  @click="selectGroup(group)"
                >
                  <q-card-section class="row items-center no-wrap">
                    <q-avatar :color="cardColor(index)" text-color="white" icon="sell" />
                    <div class="q-ml-md participants-view-dialog__stat-text">
                      <div class="participants-view-dialog__stat-label">{{ group.title }}</div>
                      <div class="participants-view-dialog__stat-value">{{ group.participants.length }}</div>
                    </div>
                  </q-card-section>
                </q-card>
              </div>
            </div>

            <section v-if="selectedGroup" class="participants-view-dialog__detail entity-page__panel">
              <div class="participants-view-dialog__detail-header">
                <div>
                  <h3 class="participants-view-dialog__detail-title">{{ selectedGroup.title }}</h3>
                  <p class="participants-view-dialog__detail-meta">
                    {{ selectedGroup.participants.length }} participant(s)
                    <span v-if="selectedGroup.attendedCount"> · {{ selectedGroup.attendedCount }} attended</span>
                  </p>
                </div>
                <div class="participants-view-dialog__detail-actions">
                  <q-btn
                    dense
                    outline
                    no-caps
                    color="primary"
                    icon="print"
                    label="Print sheet"
                    :disable="!selectedGroup.participants.length"
                    @click="printGroup(selectedGroup)"
                  />
                  <q-btn
                    dense
                    unelevated
                    no-caps
                    color="primary"
                    icon="download"
                    label="Export Excel"
                    :disable="!selectedGroup.participants.length"
                    @click="exportGroup(selectedGroup)"
                  />
                </div>
              </div>

              <q-table
                :rows="selectedGroup.participants"
                :columns="tagColumns"
                row-key="id"
                flat
                dense
                :pagination="{ rowsPerPage: 25, sortBy: 'displayLastName', descending: false }"
                class="participants-view-dialog__table entity-table"
              >
                <template #body-cell-displayChurch="props">
                  <q-td :props="props">
                    <span class="entity-table__muted">{{ props.row.displayChurch || "—" }}</span>
                  </q-td>
                </template>

                <template #body-cell-lifegroupName="props">
                  <q-td :props="props">
                    <span class="entity-table__muted">{{ props.row.lifegroupName || "—" }}</span>
                  </q-td>
                </template>

                <template #body-cell-attendedAt="props">
                  <q-td :props="props">
                    <q-badge
                      :color="props.row.attendedAt ? 'positive' : 'grey'"
                      :label="props.row.attendedAt ? 'Present' : 'Absent'"
                    />
                  </q-td>
                </template>

                <template #body-cell-qrCode="props">
                  <q-td :props="props">
                    <div class="participants-view-dialog__qr">
                      <img
                        v-if="qrByParticipant[props.row.id]"
                        :src="qrByParticipant[props.row.id]"
                        :alt="`QR for ${props.row.fullName}`"
                      />
                      <q-spinner v-else size="20px" color="primary" />
                    </div>
                  </q-td>
                </template>

                <template #no-data>
                  <div class="full-width row flex-center q-pa-md text-grey-6">
                    No participants with this tag yet.
                  </div>
                </template>
              </q-table>
            </section>
          </div>
        </template>

        <template v-else>
          <div v-if="!churchGroups.length && !guestReservations.length" class="participants-view-dialog__empty">
            <q-icon name="church" size="32px" color="grey-5" />
            <p>
              {{
                tagFilter.length
                  ? tagExclude
                    ? "No churches left after excluding the selected tags."
                    : "No churches match the selected tags."
                  : "No churches to show yet."
              }}
            </p>
          </div>

          <div v-else>
            <div class="participants-view-dialog__table-toolbar participants-view-dialog__table-toolbar--standalone">
              <q-btn-toggle
                v-model="tagMode"
                no-caps
                unelevated
                dense
                toggle-color="primary"
                color="white"
                text-color="grey-8"
                :options="tagModeOptions"
                :disable="!tagFilter.length"
                class="participants-view-dialog__tag-mode"
              />
              <AppSelect
                v-model="tagFilter"
                :options="tagOptions"
                dense
                borderless
                clearable
                multiple
                use-chips
                emit-value
                map-options
                placeholder="Filter by tags"
                class="participants-view-dialog__tag-select"
              >
                <template #prepend>
                  <q-icon name="sell" size="18px" color="grey-6" />
                </template>
              </AppSelect>
            </div>

            <section
              v-if="guestReservations.length"
              class="participants-view-dialog__reservation-section"
            >
              <div class="participants-view-dialog__reservation-section-header">
                <div>
                  <h3 class="participants-view-dialog__reservation-section-title">
                    Guest reservations
                  </h3>
                  <p class="participants-view-dialog__reservation-section-meta">
                    Expected guests who are not members of any registered church ·
                    {{ guestReservationTotal }} reserved ·
                    {{ guestReservationRegisteredTotal }} registered
                  </p>
                </div>
              </div>

              <div class="row q-col-gutter-md participants-view-dialog__cards">
                <div
                  v-for="(reservation, index) in guestReservations"
                  :key="reservation.key"
                  class="col-12 col-sm-6 col-md-4 col-lg-3"
                >
                  <q-card
                    flat
                    bordered
                    class="participants-view-dialog__stat-card"
                    :class="{ 'participants-view-dialog__stat-card--active': selectedKey === reservation.key }"
                    @click="selectGroup(reservation)"
                  >
                    <q-card-section class="row items-center no-wrap">
                      <q-avatar
                        :color="cardColor(index + 2)"
                        text-color="white"
                        icon="groups"
                      />
                      <div class="q-ml-md participants-view-dialog__stat-text">
                        <div class="participants-view-dialog__stat-label">
                          {{ reservation.label }}
                        </div>
                        <div class="participants-view-dialog__stat-value">
                          {{ reservation.participants.length }}
                          <span class="participants-view-dialog__stat-reserved">
                            / {{ reservation.reservedCount }} reserved
                          </span>
                        </div>
                      </div>
                    </q-card-section>
                  </q-card>
                </div>
              </div>
            </section>

            <div class="row q-col-gutter-md participants-view-dialog__cards">
              <div
                v-for="(group, index) in churchGroups"
                :key="group.key"
                class="col-12 col-sm-6 col-md-4 col-lg-3"
              >
                <q-card
                  flat
                  bordered
                  class="participants-view-dialog__stat-card"
                  :class="{ 'participants-view-dialog__stat-card--active': selectedKey === group.key }"
                  @click="selectGroup(group)"
                >
                  <q-card-section class="row items-center no-wrap">
                    <q-avatar :color="cardColor(index)" text-color="white" icon="church" />
                    <div class="q-ml-md participants-view-dialog__stat-text">
                      <div class="participants-view-dialog__stat-label">{{ group.churchName }}</div>
                      <div class="participants-view-dialog__stat-value">{{ group.participants.length }}</div>
                      <div v-if="group.kidsCount" class="participants-view-dialog__stat-breakdown">
                        <span>{{ group.adultCount }} adults</span>
                        <span>{{ group.kidsCount }} kids</span>
                      </div>
                    </div>
                  </q-card-section>
                </q-card>
              </div>
            </div>

            <section v-if="selectedGroup" class="participants-view-dialog__detail entity-page__panel">
              <div class="participants-view-dialog__detail-header">
                <div>
                  <h3 class="participants-view-dialog__detail-title">{{ selectedGroup.title }}</h3>
                  <p class="participants-view-dialog__detail-meta">
                    {{ selectedGroup.participants.length }} participant(s)
                    <span v-if="selectedGroup.isReservation">
                      · {{ selectedGroup.reservedCount }} reserved
                    </span>
                    <span v-if="selectedGroup.kidsCount">
                      · {{ selectedGroup.adultCount }} adults · {{ selectedGroup.kidsCount }} kids
                    </span>
                    <span v-if="selectedGroup.attendedCount"> · {{ selectedGroup.attendedCount }} attended</span>
                  </p>
                </div>
                <div class="participants-view-dialog__detail-actions">
                  <q-btn
                    v-if="canLinkSelectedGroup"
                    dense
                    outline
                    no-caps
                    color="secondary"
                    icon="link"
                    label="Link to members"
                    :loading="linkingMembers"
                    :disable="linkingMembers"
                    @click="linkToMembers"
                  />
                  <q-btn
                    dense
                    outline
                    no-caps
                    color="primary"
                    icon="print"
                    label="Print sheet"
                    :disable="!selectedGroup.participants.length"
                    @click="printGroup(selectedGroup)"
                  />
                  <q-btn
                    dense
                    unelevated
                    no-caps
                    color="primary"
                    icon="download"
                    label="Export Excel"
                    :disable="!selectedGroup.participants.length"
                    @click="exportGroup(selectedGroup)"
                  />
                </div>
              </div>

              <q-table
                :rows="selectedGroup.participants"
                :columns="churchColumns"
                row-key="id"
                flat
                dense
                :pagination="{ rowsPerPage: 25, sortBy: 'displayLastName', descending: false }"
                class="participants-view-dialog__table entity-table"
              >
                <template #body-cell-lifegroupName="props">
                  <q-td :props="props">
                    <span class="entity-table__muted">{{ props.row.lifegroupName || "—" }}</span>
                  </q-td>
                </template>

                <template #body-cell-attendedAt="props">
                  <q-td :props="props">
                    <q-badge
                      :color="props.row.attendedAt ? 'positive' : 'grey'"
                      :label="props.row.attendedAt ? 'Present' : 'Absent'"
                    />
                  </q-td>
                </template>

                <template #body-cell-qrCode="props">
                  <q-td :props="props">
                    <div class="participants-view-dialog__qr">
                      <img
                        v-if="qrByParticipant[props.row.id]"
                        :src="qrByParticipant[props.row.id]"
                        :alt="`QR for ${props.row.fullName}`"
                      />
                      <q-spinner v-else size="20px" color="primary" />
                    </div>
                  </q-td>
                </template>

                <template #body-cell-actions="props">
                  <q-td :props="props">
                    <div class="participants-view-dialog__row-actions">
                      <q-btn
                        v-if="canLinkParticipant(props.row)"
                        flat
                        dense
                        round
                        color="secondary"
                        icon="link"
                        :disable="linkingMembers || manualLinking || deletingParticipantId === props.row.id"
                        @click="openManualLink(props.row)"
                      >
                        <q-tooltip>Link to member</q-tooltip>
                      </q-btn>
                      <q-btn
                        flat
                        dense
                        round
                        color="negative"
                        icon="delete_outline"
                        :loading="deletingParticipantId === props.row.id"
                        :disable="linkingMembers || manualLinking || !!deletingParticipantId"
                        @click="confirmDeleteParticipant(props.row)"
                      >
                        <q-tooltip>Delete participant</q-tooltip>
                      </q-btn>
                    </div>
                  </q-td>
                </template>

                <template #no-data>
                  <div class="full-width row flex-center q-pa-md text-grey-6">
                    {{
                      selectedGroup.isReservation
                        ? "No registered participants for this reservation list yet."
                        : "No registered participants for this church yet."
                    }}
                  </div>
                </template>
              </q-table>
            </section>
          </div>
        </template>
      </q-card-section>
    </q-card>
  </q-dialog>

  <q-dialog v-model="linkResolveOpen" persistent>
    <q-card class="participants-view-dialog__link-resolve entity-dialog" style="min-width: min(480px, 92vw)">
      <header class="entity-dialog__header">
        <div>
          <h2 class="entity-dialog__title">Link to member</h2>
          <p class="entity-dialog__subtitle">
            {{ linkResolveProgressLabel }}
          </p>
        </div>
        <q-btn flat round dense icon="close" color="grey-7" :disable="linkingMembers" @click="cancelLinkResolve" />
      </header>

      <q-separator />

      <q-card-section v-if="currentLinkResolve" class="entity-dialog__body">
        <p class="participants-view-dialog__link-resolve-prompt">
          No exact match for
          <strong>{{ currentLinkResolve.fullName }}</strong>.
          Select a member with the family name
          <strong>{{ currentLinkResolve.lastName }}</strong>:
        </p>

        <q-list bordered separator class="participants-view-dialog__link-resolve-list rounded-borders">
          <q-item
            v-for="candidate in currentLinkResolve.candidates"
            :key="candidate.id"
            tag="label"
            clickable
            v-ripple
          >
            <q-item-section side top>
              <q-radio v-model="selectedLinkMemberId" :val="candidate.id" color="secondary" />
            </q-item-section>
            <q-item-section>
              <q-item-label>
                {{ candidate.lastName }}, {{ candidate.firstName }}
              </q-item-label>
              <q-item-label caption>
                {{ candidate.churchName || "No church" }}
                <template v-if="candidate.lifegroupName"> · {{ candidate.lifegroupName }}</template>
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right" class="q-pa-md">
        <q-btn flat no-caps color="grey-7" label="Skip" :disable="linkingMembers" @click="skipLinkResolve" />
        <q-btn
          unelevated
          no-caps
          color="secondary"
          icon="link"
          label="Link selected"
          :loading="linkingMembers"
          :disable="!selectedLinkMemberId || linkingMembers"
          @click="confirmLinkResolve"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <q-dialog v-model="manualLinkOpen" persistent @show="onManualLinkShow" @hide="resetManualLink">
    <q-card class="participants-view-dialog__manual-link entity-dialog" style="min-width: min(480px, 92vw)">
      <header class="entity-dialog__header">
        <div>
          <h2 class="entity-dialog__title">
            {{ manualAddAsMember ? "Add as member" : "Link to member" }}
          </h2>
          <p class="entity-dialog__subtitle">
            <template v-if="manualAddAsMember">
              Create a member record for
              <strong>{{ manualLinkParticipant?.fullName || "this participant" }}</strong>
              and link them to this event.
            </template>
            <template v-else>
              Search and link
              <strong>{{ manualLinkParticipant?.fullName || "this participant" }}</strong>
              to an existing member.
            </template>
          </p>
        </div>
        <q-btn flat round dense icon="close" color="grey-7" :disable="manualLinking" @click="manualLinkOpen = false" />
      </header>

      <q-separator />

      <q-card-section class="entity-dialog__body participants-view-dialog__manual-link-body">
        <q-toggle
          v-model="manualAddAsMember"
          label="Add as new member"
          dense
          color="secondary"
          class="participants-view-dialog__manual-link-toggle"
          :disable="manualLinking"
          @update:model-value="onManualAddAsMemberChanged"
        />

        <template v-if="manualAddAsMember">
          <q-form
            ref="manualAddFormRef"
            class="entity-dialog__form participants-view-dialog__manual-add-form"
            @submit.prevent="confirmManualAddAsMember"
          >
            <div class="participants-view-dialog__manual-church-field q-mb-sm">
              <AppSelect
                v-model="manualAddChurchId"
                :options="manualChurchSelectOptions"
                emit-value
                map-options
                clearable
                always-searchable
                input-debounce="0"
                label="Church *"
                dense
                outlined
                hide-bottom-space
                :loading="manualChurchesLoading"
                :disable="manualLinking || manualChurchesLoading"
                :rules="[(val) => !!val || 'Church is required']"
                popup-content-class="participants-view-dialog__church-menu"
                :popup-content-style="{ zIndex: 10000 }"
                @filter="onManualChurchFilter"
              >
                <template #no-option>
                  <q-item>
                    <q-item-section class="text-grey">
                      {{
                        manualChurchesLoading
                          ? "Loading churches…"
                          : "No churches found."
                      }}
                    </q-item-section>
                  </q-item>
                </template>
              </AppSelect>
              <div v-if="manualAddChurchError" class="text-negative text-caption q-mt-xs">
                {{ manualAddChurchError }}
              </div>
            </div>
            <div class="row q-col-gutter-sm">
              <div class="col-12 col-sm-6">
                <q-input
                  v-model="manualAddFirstName"
                  label="First name *"
                  dense
                  outlined
                  hide-bottom-space
                  :disable="manualLinking"
                  :rules="[(val) => !!String(val || '').trim() || 'Required']"
                />
              </div>
              <div class="col-12 col-sm-6">
                <q-input
                  v-model="manualAddLastName"
                  label="Last name *"
                  dense
                  outlined
                  hide-bottom-space
                  :disable="manualLinking"
                  :rules="[(val) => !!String(val || '').trim() || 'Required']"
                />
              </div>
            </div>
            <p class="participants-view-dialog__manual-add-hint">
              The participant will be saved to the member directory under the selected church and linked to this event.
            </p>
            <div class="row justify-end q-mt-md">
              <q-btn
                type="submit"
                unelevated
                no-caps
                color="secondary"
                icon="person_add"
                label="Add & link"
                :loading="manualLinking"
                :disable="manualLinking || manualChurchesLoading"
              />
            </div>
          </q-form>
        </template>

        <template v-else>
          <q-input
            v-model="manualLinkSearch"
            dense
            outlined
            clearable
            placeholder="Search by name…"
            class="participants-view-dialog__manual-link-search"
            @update:model-value="onManualLinkSearch"
          >
            <template #prepend>
              <q-icon name="search" size="18px" color="grey-6" />
            </template>
          </q-input>

          <q-inner-loading :showing="manualLinkLoading">
            <q-spinner size="24px" color="secondary" />
          </q-inner-loading>

          <div v-if="!manualLinkLoading && !manualLinkResults.length" class="participants-view-dialog__manual-link-empty">
            {{ manualLinkSearch ? "No members found." : "Type a name to search members." }}
          </div>

          <ul v-else class="participants-view-dialog__manual-link-list">
            <li
              v-for="member in manualLinkResults"
              :key="member.id"
              class="participants-view-dialog__manual-link-item"
            >
              <div class="participants-view-dialog__manual-link-info">
                <div class="participants-view-dialog__manual-link-name">
                  {{ member.lastName }}, {{ member.firstName }}
                </div>
                <div class="participants-view-dialog__manual-link-meta">
                  {{ member.church || "No church" }}
                  <template v-if="member.lifeGroup"> · {{ member.lifeGroup }}</template>
                  <template v-else-if="member.email || member.phone">
                    · {{ member.email || member.phone }}
                  </template>
                </div>
              </div>
              <q-btn
                dense
                unelevated
                no-caps
                color="secondary"
                icon="link"
                label="Link"
                :loading="manualLinking && manualLinkingId === member.id"
                :disable="manualLinking && manualLinkingId !== member.id"
                @click="confirmManualLink(member)"
              />
            </li>
          </ul>
        </template>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useQuasar } from "quasar";
import { api } from "src/boot/axios";
import AppSelect from "src/components/AppSelect.vue";
import { buildCheckInPayload, generateQrDataUrl } from "src/utils/eventQr";
import { exportParticipantsToExcel } from "src/utils/eventParticipantExcel";
import { getAttendancePrintUrl } from "src/utils/eventAttendancePrint";
import { compareChurchNamesMainFirst, getChurchDisplayName } from "src/utils/churchDisplay";
import {
  filterParticipantsBySearch,
  filterParticipantsByTags,
  participantTagNames,
  uniqueParticipantTags
} from "src/utils/participantTags";

const CARD_COLORS = ["primary", "secondary", "accent", "positive", "orange", "purple"];

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  eventId: { type: [String, Number], default: null },
  event: { type: Object, default: null },
  participants: { type: Array, default: () => [] },
  reservations: { type: Array, default: () => [] },
  churchOptions: { type: Array, default: () => [] },
  hasRegistrationFee: { type: Boolean, default: false },
  initialView: { type: String, default: "all" }
});

const emit = defineEmits(["update:modelValue", "linked", "deleted"]);

const $q = useQuasar();
const router = useRouter();
const viewMode = ref("all");
const qrByParticipant = ref({});
const selectedKey = ref(null);
const participantFilter = ref("");
const tagFilter = ref([]);
const tagMode = ref("include");
const linkingMembers = ref(false);
const linkResolveOpen = ref(false);
const linkResolveQueue = ref([]);
const linkResolveIndex = ref(0);
const selectedLinkMemberId = ref(null);
const pendingLinkIds = ref([]);
const confirmedLinks = ref([]);
const linkBatchStats = ref({ linked: 0, unmatched: 0, skipped: 0 });
const manualLinkOpen = ref(false);
const manualLinkParticipant = ref(null);
const manualLinkSearch = ref("");
const manualLinkResults = ref([]);
const manualLinkLoading = ref(false);
const manualLinking = ref(false);
const manualLinkingId = ref(null);
const deletingParticipantId = ref(null);
const manualAddAsMember = ref(false);
const manualAddChurchId = ref(null);
const manualAddFirstName = ref("");
const manualAddLastName = ref("");
const manualAddChurchError = ref("");
const manualChurchOptions = ref([]);
const manualChurchSelectOptions = ref([]);
const manualChurchesLoading = ref(false);
const manualAddFormRef = ref(null);
let manualLinkSearchTimer = null;
let manualChurchesPromise = null;

const resolvedManualChurchOptions = computed(() => {
  if (manualChurchOptions.value.length) return manualChurchOptions.value;
  return (props.churchOptions || [])
    .map((church) => ({
      label: church.label || getChurchDisplayName(church) || church.name || `Church #${church.value ?? church.id}`,
      value: Number(church.value ?? church.id)
    }))
    .filter((church) => Number.isFinite(church.value) && church.value > 0);
});

watch(
  resolvedManualChurchOptions,
  (options) => {
    manualChurchSelectOptions.value = [...options];
  },
  { immediate: true }
);

const viewModeOptions = [
  { label: "All participants", value: "all" },
  { label: "By church", value: "church" },
  { label: "By tag", value: "tag" }
];

const tagModeOptions = [
  { label: "Include", value: "include" },
  { label: "Exclude", value: "exclude" }
];

const tagExclude = computed(() => tagMode.value === "exclude");

const tagOptions = computed(() =>
  uniqueParticipantTags(props.participants).map((tag) => ({
    label: tag,
    value: tag
  }))
);

const tagFilteredParticipants = computed(() =>
  filterParticipantsByTags(props.participants, tagFilter.value, { exclude: tagExclude.value })
);

const sortedParticipants = computed(() =>
  [...tagFilteredParticipants.value]
    .map((participant) => ({
      ...participant,
      displayLastName: participant.lastName || participant.fullName || "—",
      displayFirstName:
        participant.firstName ||
        (participant.lastName || !participant.fullName ? "—" : ""),
      displayChurch: participant.churchName || participant.reservationLabel || "—"
    }))
    .sort((a, b) => {
      const last = (a.displayLastName || "").localeCompare(b.displayLastName || "");
      if (last !== 0) return last;
      return (a.displayFirstName || "").localeCompare(b.displayFirstName || "");
    })
);

function filterParticipants(rows, terms) {
  return filterParticipantsBySearch(rows, terms);
}

const allColumns = computed(() => {
  const columns = [
    { name: "displayLastName", label: "Last name", field: "displayLastName", align: "left", sortable: true },
    { name: "displayFirstName", label: "First name", field: "displayFirstName", align: "left", sortable: true },
    { name: "churchName", label: "Church / List", field: "displayChurch", align: "left", sortable: true },
    { name: "lifegroupName", label: "LifeGroup", field: "lifegroupName", align: "left", sortable: true },
    { name: "tags", label: "Tags", field: "tags", align: "left" }
  ];

  if (props.hasRegistrationFee) {
    columns.push({
      name: "registrationPaid",
      label: "Paid",
      field: "registrationPaid",
      align: "left"
    });
  }

  columns.push({
    name: "attendedAt",
    label: "Status",
    field: "attendedAt",
    align: "left"
  });

  return columns;
});

const churchColumns = [
  { name: "displayLastName", label: "Last name", field: "displayLastName", align: "left", sortable: true },
  { name: "displayFirstName", label: "First name", field: "displayFirstName", align: "left", sortable: true },
  { name: "lifegroupName", label: "LifeGroup", field: "lifegroupName", align: "left" },
  { name: "attendedAt", label: "Status", field: "attendedAt", align: "left" },
  { name: "qrCode", label: "QR code", field: "qrCode", align: "center" },
  { name: "actions", label: "Actions", field: "actions", align: "center", sortable: false }
];

const tagColumns = [
  { name: "displayLastName", label: "Last name", field: "displayLastName", align: "left", sortable: true },
  { name: "displayFirstName", label: "First name", field: "displayFirstName", align: "left", sortable: true },
  { name: "displayChurch", label: "Church / List", field: "displayChurch", align: "left", sortable: true },
  { name: "lifegroupName", label: "LifeGroup", field: "lifegroupName", align: "left" },
  { name: "attendedAt", label: "Status", field: "attendedAt", align: "left" },
  { name: "qrCode", label: "QR code", field: "qrCode", align: "center" }
];

function mapParticipantRow(participant) {
  return {
    ...participant,
    displayLastName: participant.lastName || participant.fullName || "—",
    displayFirstName:
      participant.firstName ||
      (participant.lastName || !participant.fullName ? "—" : ""),
    displayChurch: participant.churchName || participant.reservationLabel || "—"
  };
}

function sortParticipantRows(participants) {
  return [...participants].sort((a, b) => {
    const last = (a.displayLastName || "").localeCompare(b.displayLastName || "");
    if (last !== 0) return last;
    return (a.displayFirstName || "").localeCompare(b.displayFirstName || "");
  });
}

const churchGroups = computed(() => {
  const map = new Map();

  tagFilteredParticipants.value.forEach((participant) => {
    if (participant.reservationId && !participant.churchId) return;

    const key = participant.churchId ?? "unassigned";
    const churchName = participant.churchName || "Unassigned";

    if (!map.has(key)) {
      map.set(key, {
        key,
        churchId: participant.churchId ?? null,
        churchName,
        title: churchName,
        isReservation: false,
        isTag: false,
        participants: [],
        attendedCount: 0,
        kidsCount: 0
      });
    }

    const group = map.get(key);
    group.participants.push(mapParticipantRow(participant));
    if (participant.attendedAt) {
      group.attendedCount += 1;
    }
    if (participant.isKid) {
      group.kidsCount += 1;
    }
  });

  return Array.from(map.values())
    .map((group) => ({
      ...group,
      adultCount: group.participants.length - group.kidsCount,
      participants: sortParticipantRows(group.participants)
    }))
    .sort((a, b) => compareChurchNamesMainFirst(a.churchName, b.churchName));
});

const guestReservations = computed(() => {
  const participantsByReservation = new Map();

  tagFilteredParticipants.value.forEach((participant) => {
    if (!participant.reservationId || participant.churchId) return;
    const key = Number(participant.reservationId);
    const list = participantsByReservation.get(key) || [];
    list.push(mapParticipantRow(participant));
    participantsByReservation.set(key, list);
  });

  return [...(props.reservations || [])]
    .filter((row) => !row.churchId)
    .map((reservation) => {
      const participants = sortParticipantRows(
        participantsByReservation.get(Number(reservation.id)) || []
      );
      const attendedCount = participants.filter((row) => row.attendedAt).length;
      const kidsCount = participants.filter((row) => row.isKid).length;

      return {
        key: `reservation-${reservation.id}`,
        id: reservation.id,
        reservationId: reservation.id,
        label: reservation.label,
        title: reservation.label,
        isReservation: true,
        isTag: false,
        reservedCount: Number(reservation.reservedCount || 0),
        participants,
        attendedCount,
        kidsCount,
        adultCount: participants.length - kidsCount
      };
    })
    .filter((reservation) => reservation.participants.length > 0 || !tagFilter.value.length)
    .sort((a, b) =>
      String(a.label || "").localeCompare(String(b.label || ""), undefined, { sensitivity: "base" })
    );
});

const tagGroups = computed(() => {
  const map = new Map();
  const selectedTags = new Set(tagFilter.value.map((tag) => String(tag).toLowerCase()));
  const narrowingByInclude = selectedTags.size > 0 && !tagExclude.value;

  tagFilteredParticipants.value.forEach((participant) => {
    const tags = participantTagNames(participant);
    if (!tags.length) return;

    tags.forEach((tag) => {
      const key = tag.toLowerCase();
      if (narrowingByInclude && !selectedTags.has(key)) return;

      if (!map.has(key)) {
        map.set(key, {
          key: `tag-${key}`,
          tag,
          title: tag,
          isReservation: false,
          isTag: true,
          participants: [],
          attendedCount: 0
        });
      }

      const group = map.get(key);
      group.participants.push(mapParticipantRow(participant));
      if (participant.attendedAt) {
        group.attendedCount += 1;
      }
    });
  });

  return Array.from(map.values())
    .map((group) => ({
      ...group,
      participants: sortParticipantRows(group.participants)
    }))
    .sort((a, b) =>
      String(a.title || "").localeCompare(String(b.title || ""), undefined, { sensitivity: "base" })
    );
});

const guestReservationTotal = computed(() =>
  guestReservations.value.reduce((sum, row) => sum + Number(row.reservedCount || 0), 0)
);

const guestReservationRegisteredTotal = computed(() =>
  guestReservations.value.reduce((sum, row) => sum + row.participants.length, 0)
);

const selectedGroup = computed(() => findSelectedGroup(viewMode.value));

const unlinkedInSelectedGroup = computed(() => {
  if (!selectedGroup.value || selectedGroup.value.isTag) return [];
  return selectedGroup.value.participants.filter((participant) => !participant.memberLinked && !participant.memberId);
});

const canLinkSelectedGroup = computed(
  () =>
    selectedGroup.value?.key === "unassigned" &&
    unlinkedInSelectedGroup.value.length > 0
);

const currentLinkResolve = computed(() => linkResolveQueue.value[linkResolveIndex.value] || null);

const linkResolveProgressLabel = computed(() => {
  if (!linkResolveQueue.value.length) return "";
  return `Match ${linkResolveIndex.value + 1} of ${linkResolveQueue.value.length}`;
});

function cardColor(index) {
  return CARD_COLORS[index % CARD_COLORS.length];
}

function canLinkParticipant(participant) {
  return (
    selectedGroup.value?.key === "unassigned" &&
    !participant?.memberLinked &&
    !participant?.memberId
  );
}

function confirmDeleteParticipant(participant) {
  if (!props.eventId || !participant?.id || deletingParticipantId.value) return;

  $q.dialog({
    title: "Remove participant",
    message: `Remove ${participant.fullName || "this participant"}?`,
    cancel: true,
    persistent: true
  }).onOk(() => {
    deleteParticipant(participant);
  });
}

async function deleteParticipant(participant) {
  if (!props.eventId || !participant?.id || deletingParticipantId.value) return;

  deletingParticipantId.value = participant.id;
  try {
    await api.delete(`/events/${props.eventId}/participants/${participant.id}`);
    $q.notify({ type: "positive", message: "Participant removed." });
    emit("deleted", { id: participant.id });
  } catch (err) {
    $q.notify({
      type: "negative",
      message: err?.response?.data?.message || err?.message || "Failed to remove participant."
    });
  } finally {
    deletingParticipantId.value = null;
  }
}

function registeredMemberIdSet() {
  return new Set(
    (props.participants || [])
      .map((row) => Number(row.memberId))
      .filter((id) => Number.isFinite(id) && id > 0)
  );
}

function parseParticipantNameParts(participant) {
  const first = String(participant?.firstName || participant?.displayFirstName || "").trim();
  const last = String(participant?.lastName || participant?.displayLastName || "").trim();
  if (first && first !== "—" && last && last !== "—") {
    return { firstName: first, lastName: last };
  }

  const fullName = String(participant?.fullName || "").trim();
  if (!fullName) return { firstName: "", lastName: "" };
  const parts = fullName.split(/\s+/).filter(Boolean);
  if (parts.length < 2) return { firstName: parts[0] || "", lastName: "" };
  return {
    firstName: parts.slice(0, -1).join(" "),
    lastName: parts[parts.length - 1]
  };
}

function defaultManualLinkSearch(participant) {
  const { lastName } = parseParticipantNameParts(participant);
  if (lastName) return lastName;
  return String(participant?.fullName || "").trim();
}

function resetManualLink() {
  clearTimeout(manualLinkSearchTimer);
  manualLinkParticipant.value = null;
  manualLinkSearch.value = "";
  manualLinkResults.value = [];
  manualLinkLoading.value = false;
  manualLinking.value = false;
  manualLinkingId.value = null;
  manualAddAsMember.value = false;
  manualAddChurchId.value = null;
  manualAddFirstName.value = "";
  manualAddLastName.value = "";
  manualAddChurchError.value = "";
  manualAddFormRef.value?.resetValidation?.();
}

function openManualLink(participant) {
  if (!canLinkParticipant(participant) || manualLinking.value || linkingMembers.value) return;
  const name = parseParticipantNameParts(participant);
  manualLinkParticipant.value = participant;
  manualLinkSearch.value = defaultManualLinkSearch(participant);
  manualLinkResults.value = [];
  manualAddAsMember.value = false;
  manualAddChurchId.value = null;
  manualAddFirstName.value = name.firstName;
  manualAddLastName.value = name.lastName;
  manualLinkOpen.value = true;
  loadManualChurches();
}

async function loadManualChurches(force = false) {
  if (!force && resolvedManualChurchOptions.value.length) {
    if (!manualChurchOptions.value.length) {
      manualChurchOptions.value = [...resolvedManualChurchOptions.value];
    }
    return manualChurchOptions.value;
  }

  if (!force && manualChurchesPromise) {
    return manualChurchesPromise;
  }

  manualChurchesLoading.value = true;
  manualChurchesPromise = (async () => {
    try {
      const { data } = await api.get("/churches");
      const rows = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.items)
            ? data.items
            : [];

      manualChurchOptions.value = sortChurchesMainFirst(
        rows.map((church) => ({
          label:
            getChurchDisplayName(church) ||
            church.name ||
            church.shortName ||
            `Church #${church.id}`,
          value: Number(church.id)
        })),
        (church) => church.label
      );

      if (!manualChurchOptions.value.length) {
        $q.notify({ type: "warning", message: "No churches are available to assign." });
      }

      return manualChurchOptions.value;
    } catch (err) {
      manualChurchesPromise = null;
      if (!resolvedManualChurchOptions.value.length) {
        manualChurchOptions.value = [];
        $q.notify({
          type: "negative",
          message: err?.response?.data?.message || err?.message || "Failed to load churches."
        });
      }
      return manualChurchOptions.value;
    } finally {
      manualChurchesLoading.value = false;
    }
  })();

  return manualChurchesPromise;
}

async function onManualAddAsMemberChanged(enabled) {
  if (!enabled) {
    manualAddChurchError.value = "";
    return;
  }
  const name = parseParticipantNameParts(manualLinkParticipant.value);
  if (!manualAddFirstName.value) manualAddFirstName.value = name.firstName;
  if (!manualAddLastName.value) manualAddLastName.value = name.lastName;
  await loadManualChurches(true);
}

watch(manualAddChurchId, (value) => {
  if (value) manualAddChurchError.value = "";
});

function onManualChurchFilter(val, update) {
  update(() => {
    const all = resolvedManualChurchOptions.value;
    const needle = String(val || "")
      .trim()
      .toLowerCase();
    manualChurchSelectOptions.value = !needle
      ? [...all]
      : all.filter((opt) => String(opt.label || "").toLowerCase().includes(needle));
  });
}

async function fetchManualLinkMembers(term = "") {
  manualLinkLoading.value = true;
  try {
    const { data } = await api.get("/members", {
      params: term ? { search: term } : {}
    });
    const excluded = registeredMemberIdSet();
    manualLinkResults.value = (Array.isArray(data) ? data : []).filter(
      (member) => !excluded.has(Number(member.id))
    );
  } catch {
    manualLinkResults.value = [];
  } finally {
    manualLinkLoading.value = false;
  }
}

function onManualLinkSearch() {
  clearTimeout(manualLinkSearchTimer);
  manualLinkSearchTimer = setTimeout(() => {
    fetchManualLinkMembers(String(manualLinkSearch.value || "").trim());
  }, 300);
}

async function onManualLinkShow() {
  if (manualAddAsMember.value) {
    await loadManualChurches();
    return;
  }
  await fetchManualLinkMembers(String(manualLinkSearch.value || "").trim());
}

async function confirmManualAddAsMember() {
  if (!props.eventId || !manualLinkParticipant.value || manualLinking.value) return;

  manualAddChurchError.value = manualAddChurchId.value ? "" : "Church is required";

  const valid = await manualAddFormRef.value?.validate();
  if (!valid || !manualAddChurchId.value) return;

  const firstName = String(manualAddFirstName.value || "").trim();
  const lastName = String(manualAddLastName.value || "").trim();
  if (!firstName || !lastName) return;

  manualLinking.value = true;
  try {
    const { data } = await api.put(
      `/events/${props.eventId}/participants/${manualLinkParticipant.value.id}`,
      {
        addAsMember: true,
        churchId: manualAddChurchId.value,
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`,
        email: manualLinkParticipant.value.email || null,
        phone: manualLinkParticipant.value.phone || null
      }
    );

    $q.notify({
      type: "positive",
      message: `Added ${lastName}, ${firstName} as a member and linked to this event.`
    });
    emit("linked", { linked: 1, participants: [data] });
    manualLinkOpen.value = false;
    resetManualLink();
  } catch (err) {
    $q.notify({
      type: "negative",
      message:
        err?.response?.data?.message || err?.message || "Failed to add participant as a member."
    });
  } finally {
    manualLinking.value = false;
  }
}

async function confirmManualLink(member) {
  if (!props.eventId || !manualLinkParticipant.value || !member?.id || manualLinking.value) return;

  manualLinking.value = true;
  manualLinkingId.value = member.id;
  try {
    const { data } = await api.post(`/events/${props.eventId}/participants/link-members`, {
      links: [
        {
          participantId: manualLinkParticipant.value.id,
          memberId: member.id
        }
      ]
    });

    if ((Number(data?.linked) || 0) > 0) {
      $q.notify({
        type: "positive",
        message: `Linked ${manualLinkParticipant.value.fullName} to ${member.lastName}, ${member.firstName}.`
      });
      emit("linked", data);
      manualLinkOpen.value = false;
      resetManualLink();
    } else if ((Number(data?.skipped) || 0) > 0) {
      $q.notify({
        type: "warning",
        message: "That member is already registered for this event."
      });
    } else {
      $q.notify({
        type: "warning",
        message: "Could not link this participant to the selected member."
      });
    }
  } catch (err) {
    $q.notify({
      type: "negative",
      message: err?.response?.data?.message || err?.message || "Failed to link participant to member."
    });
  } finally {
    manualLinking.value = false;
    manualLinkingId.value = null;
  }
}

function close() {
  emit("update:modelValue", false);
}

function selectGroup(group) {
  selectedKey.value = group.key;
  loadQrCodes(group.participants);
}

function exportGroup(group) {
  exportParticipantsToExcel(group.participants, {
    churchName: group.title,
    eventName: props.event?.name
  });
  $q.notify({ type: "positive", message: `Exported ${group.title} participants.` });
}

function printGroup(group) {
  if (group.isTag) {
    router.push(
      getAttendancePrintUrl(props.eventId, {
        tags: [group.tag],
        excludeTags: false
      })
    );
    return;
  }

  router.push(
    getAttendancePrintUrl(props.eventId, {
      churchKey: group.key,
      tags: tagFilter.value,
      excludeTags: tagExclude.value
    })
  );
}

function printFiltered() {
  router.push(
    getAttendancePrintUrl(props.eventId, {
      tags: tagFilter.value,
      search: participantFilter.value,
      excludeTags: tagExclude.value
    })
  );
}

function resetLinkResolveState() {
  linkResolveOpen.value = false;
  linkResolveQueue.value = [];
  linkResolveIndex.value = 0;
  selectedLinkMemberId.value = null;
  pendingLinkIds.value = [];
  confirmedLinks.value = [];
  linkBatchStats.value = { linked: 0, unmatched: 0, skipped: 0 };
}

function summarizeLinkResult(data, attemptedCount) {
  const linked = Number(data?.linked) || 0;
  const unmatched = Number(data?.unmatched) || 0;
  const skipped = Number(data?.skipped) || 0;
  const resolved = Number(data?.needsResolution?.length) || 0;

  if (linked > 0) {
    $q.notify({
      type: "positive",
      message: `Linked ${linked} of ${attemptedCount} participant(s) to existing members.`
    });
  } else if (!resolved) {
    $q.notify({
      type: "warning",
      message: "No matching members were found for the selected participants."
    });
  }

  if (unmatched > 0 || skipped > 0) {
    const parts = [];
    if (unmatched > 0) parts.push(`${unmatched} unmatched`);
    if (skipped > 0) parts.push(`${skipped} already registered as members`);
    $q.notify({ type: "info", message: parts.join(" · ") });
  }
}

function openLinkResolve(needsResolution) {
  linkResolveQueue.value = Array.isArray(needsResolution) ? needsResolution : [];
  linkResolveIndex.value = 0;
  selectedLinkMemberId.value = null;
  linkResolveOpen.value = linkResolveQueue.value.length > 0;
}

function advanceLinkResolve() {
  selectedLinkMemberId.value = null;
  if (linkResolveIndex.value + 1 < linkResolveQueue.value.length) {
    linkResolveIndex.value += 1;
    return;
  }
  finishLinkResolve();
}

async function finishLinkResolve() {
  const links = [...confirmedLinks.value];
  const attemptedCount = pendingLinkIds.value.length;
  const autoLinked = linkBatchStats.value.linked;
  const skippedInDialog = Math.max(0, linkResolveQueue.value.length - links.length);

  linkResolveOpen.value = false;

  if (!links.length) {
    summarizeLinkResult(
      {
        linked: autoLinked,
        unmatched: linkBatchStats.value.unmatched + skippedInDialog,
        skipped: linkBatchStats.value.skipped,
        needsResolution: []
      },
      attemptedCount
    );
    if (autoLinked > 0) {
      emit("linked", { linked: autoLinked });
    }
    resetLinkResolveState();
    return;
  }

  linkingMembers.value = true;
  try {
    const { data } = await api.post(`/events/${props.eventId}/participants/link-members`, {
      links
    });

    const totalLinked = autoLinked + (Number(data?.linked) || 0);
    summarizeLinkResult(
      {
        ...data,
        linked: totalLinked,
        unmatched:
          linkBatchStats.value.unmatched + skippedInDialog + (Number(data?.unmatched) || 0),
        skipped: linkBatchStats.value.skipped + (Number(data?.skipped) || 0)
      },
      attemptedCount
    );
    emit("linked", { ...data, linked: totalLinked });
  } catch (err) {
    $q.notify({
      type: "negative",
      message: err?.response?.data?.message || err?.message || "Failed to link selected members."
    });
  } finally {
    linkingMembers.value = false;
    resetLinkResolveState();
  }
}

function skipLinkResolve() {
  advanceLinkResolve();
}

function confirmLinkResolve() {
  if (!currentLinkResolve.value || !selectedLinkMemberId.value) return;
  confirmedLinks.value.push({
    participantId: currentLinkResolve.value.participantId,
    memberId: selectedLinkMemberId.value
  });
  advanceLinkResolve();
}

function cancelLinkResolve() {
  if (confirmedLinks.value.length) {
    finishLinkResolve();
    return;
  }
  if (linkBatchStats.value.linked > 0) {
    summarizeLinkResult(
      {
        linked: linkBatchStats.value.linked,
        unmatched: linkBatchStats.value.unmatched,
        skipped: linkBatchStats.value.skipped,
        needsResolution: []
      },
      pendingLinkIds.value.length
    );
    emit("linked", { linked: linkBatchStats.value.linked });
  }
  resetLinkResolveState();
}

async function linkToMembers() {
  if (!props.eventId || !canLinkSelectedGroup.value || linkingMembers.value) return;

  const participantIds = unlinkedInSelectedGroup.value.map((participant) => participant.id);
  const count = participantIds.length;

  linkingMembers.value = true;
  try {
    const { data } = await api.post(`/events/${props.eventId}/participants/link-members`, {
      participantIds
    });

    const needsResolution = Array.isArray(data?.needsResolution) ? data.needsResolution : [];
    linkBatchStats.value = {
      linked: Number(data?.linked) || 0,
      unmatched: Number(data?.unmatched) || 0,
      skipped: Number(data?.skipped) || 0
    };
    pendingLinkIds.value = participantIds;
    confirmedLinks.value = [];

    if (needsResolution.length) {
      if (linkBatchStats.value.linked > 0) {
        emit("linked", data);
      }
      openLinkResolve(needsResolution);
      return;
    }

    summarizeLinkResult(data, count);
    emit("linked", data);
    resetLinkResolveState();
  } catch (err) {
    $q.notify({
      type: "negative",
      message: err?.response?.data?.message || err?.message || "Failed to link participants to members."
    });
  } finally {
    linkingMembers.value = false;
  }
}

async function loadQrCodes(participants) {
  if (!props.eventId || !participants.length) {
    qrByParticipant.value = {};
    return;
  }

  const entries = await Promise.all(
    participants.map(async (participant) => {
      const payload = buildCheckInPayload(props.eventId, participant);
      const dataUrl = await generateQrDataUrl(payload);
      return [participant.id, dataUrl];
    })
  );

  qrByParticipant.value = Object.fromEntries(entries);
}

function groupsForMode(mode) {
  if (mode === "tag") return tagGroups.value;
  if (mode === "church") return [...guestReservations.value, ...churchGroups.value];
  return [];
}

function firstGroupForMode(mode) {
  return groupsForMode(mode)[0] || null;
}

function findSelectedGroup(mode = viewMode.value) {
  if (!selectedKey.value) return null;
  return groupsForMode(mode).find((group) => group.key === selectedKey.value) || null;
}

function onShow() {
  viewMode.value =
    props.initialView === "church" || props.initialView === "tag" ? props.initialView : "all";
  tagFilter.value = [];
  tagMode.value = "include";
  participantFilter.value = "";
  if (viewMode.value === "church" || viewMode.value === "tag") {
    const firstGroup = firstGroupForMode(viewMode.value);
    if (firstGroup) selectGroup(firstGroup);
  }
}

function onHide() {
  selectedKey.value = null;
  qrByParticipant.value = {};
  tagFilter.value = [];
  tagMode.value = "include";
  participantFilter.value = "";
  resetLinkResolveState();
  manualLinkOpen.value = false;
  resetManualLink();
}

watch(viewMode, (mode) => {
  if (mode === "church" || mode === "tag") {
    const current = findSelectedGroup(mode);
    if (current) {
      loadQrCodes(current.participants);
      return;
    }
    const firstGroup = firstGroupForMode(mode);
    if (firstGroup) selectGroup(firstGroup);
    else {
      selectedKey.value = null;
      qrByParticipant.value = {};
    }
  }
  if (mode === "all") {
    selectedKey.value = null;
    qrByParticipant.value = {};
  }
});

watch(
  () => [props.participants, tagFilter.value, tagMode.value],
  () => {
    if (!tagFilter.value.length && tagMode.value === "exclude") {
      tagMode.value = "include";
    }
    if (viewMode.value !== "church" && viewMode.value !== "tag") return;
    const group = findSelectedGroup(viewMode.value);
    if (group) {
      loadQrCodes(group.participants);
      return;
    }
    const firstGroup = firstGroupForMode(viewMode.value);
    if (firstGroup) {
      selectGroup(firstGroup);
    } else {
      selectedKey.value = null;
      qrByParticipant.value = {};
    }
  },
  { deep: true }
);
</script>

<style scoped lang="scss">
.participants-view-dialog {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f5f7fa;
}

.participants-view-dialog__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 18px;
  background: #fff;
}

.participants-view-dialog__heading {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  min-width: 0;
}

.participants-view-dialog__title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1a1a2e;
}

.participants-view-dialog__subtitle {
  margin: 2px 0 0;
  font-size: 0.8rem;
  color: #6b7280;
}

.participants-view-dialog__toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.participants-view-dialog__toggle {
  border: 1px solid #e4e8ef;
  border-radius: 8px;
}

.participants-view-dialog__table-toolbar {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.participants-view-dialog__table-toolbar--standalone {
  margin-bottom: 16px;
  padding: 10px 12px;
  background: #fff;
  border: 1px solid #e4e8ef;
  border-radius: 8px;
}

.participants-view-dialog__tag-mode {
  flex-shrink: 0;
  border: 1px solid #e4e8ef;
  border-radius: 6px;

  :deep(.q-btn) {
    min-height: 30px;
    padding: 0 10px;
    font-size: 0.75rem;
  }
}

.participants-view-dialog__tag-select {
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

.participants-view-dialog__print-btn {
  margin-left: auto;
}

.participants-view-dialog__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.participants-view-dialog__body {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  min-height: 0;
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
}

.participants-view-dialog__cards {
  margin-bottom: 16px;
}

.participants-view-dialog__stat-card {
  cursor: pointer;
  border-radius: 8px;
  background: #fff;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;

  &:hover {
    box-shadow: 0 2px 8px rgba(26, 26, 46, 0.08);
  }
}

.participants-view-dialog__stat-card--active {
  border-color: #1976d2;
  box-shadow: 0 0 0 1px #1976d2;
}

.participants-view-dialog__stat-card--static {
  cursor: default;
}

.participants-view-dialog__stat-text {
  min-width: 0;
}

.participants-view-dialog__stat-label {
  font-size: 0.82rem;
  font-weight: 500;
  color: #2d3340;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.participants-view-dialog__stat-value {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1a1a2e;
  line-height: 1.2;
}

.participants-view-dialog__stat-reserved {
  font-size: 0.75rem;
  font-weight: 500;
  color: #8b93a1;
}

.participants-view-dialog__stat-breakdown {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 10px;
  margin-top: 2px;
  font-size: 0.68rem;
  font-weight: 500;
  color: #5f6b7a;
  line-height: 1.25;
}

.participants-view-dialog__reservation-section {
  margin: 0 0 16px;
  padding: 14px;
  background: #fff;
  border: 1px solid #e4e8ef;
  border-radius: 8px;
}

.participants-view-dialog__reservation-section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.participants-view-dialog__reservation-section-title {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: #1a1a2e;
}

.participants-view-dialog__reservation-section-meta {
  margin: 2px 0 0;
  font-size: 0.75rem;
  color: #6b7280;
}

.participants-view-dialog__detail {
  overflow: hidden;
}

.participants-view-dialog__detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-bottom: 1px solid #eef1f6;
  background: #fafbfc;
}

.participants-view-dialog__detail-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.participants-view-dialog__detail-title {
  margin: 0;
  font-size: 0.88rem;
  font-weight: 600;
  color: #1a1a2e;
}

.participants-view-dialog__detail-meta {
  margin: 2px 0 0;
  font-size: 0.75rem;
  color: #6b7280;
}

.participants-view-dialog__qr img {
  width: 64px;
  height: 64px;
  display: block;
}

.participants-view-dialog__empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 240px;
  color: #8b93a1;
  font-size: 0.9rem;

  p {
    margin: 0;
  }
}

.participants-view-dialog__link-resolve-prompt {
  margin: 0 0 14px;
  font-size: 0.9rem;
  line-height: 1.45;
  color: #374151;
}

.participants-view-dialog__link-resolve-list {
  max-height: min(360px, 50vh);
  overflow: auto;
}

.participants-view-dialog__manual-link {
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.participants-view-dialog__manual-link-body {
  position: relative;
  max-height: min(420px, 55vh);
  overflow-y: auto;
  overflow-x: hidden;
}

.participants-view-dialog__manual-add-form {
  position: relative;
  z-index: 1;
}

.participants-view-dialog__manual-link-search {
  margin-bottom: 12px;
}

.participants-view-dialog__manual-link-toggle {
  margin-bottom: 14px;
}

.participants-view-dialog__manual-add-hint {
  margin: 10px 0 0;
  font-size: 0.75rem;
  line-height: 1.45;
  color: #8b93a1;
}

.participants-view-dialog__manual-church-field {
  position: relative;
  z-index: 2;
}

.participants-view-dialog__row-actions {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
}

.participants-view-dialog__manual-link-empty {
  padding: 24px 8px;
  text-align: center;
  color: #8b93a1;
  font-size: 0.84rem;
}

.participants-view-dialog__manual-link-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.participants-view-dialog__manual-link-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #f0f2f5;

  &:last-child {
    border-bottom: none;
  }
}

.participants-view-dialog__manual-link-name {
  font-size: 0.88rem;
  font-weight: 500;
  color: #1a1a2e;
}

.participants-view-dialog__manual-link-meta {
  font-size: 0.76rem;
  color: #6b7280;
  margin-top: 2px;
}

@media (max-width: 599px) {
  .participants-view-dialog__header {
    flex-wrap: wrap;
  }

  .participants-view-dialog__toolbar {
    width: 100%;
    justify-content: space-between;
  }

  .participants-view-dialog__detail-header {
    flex-wrap: wrap;
  }
}
</style>
