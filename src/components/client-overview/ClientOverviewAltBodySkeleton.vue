<template>
  <div
    class="client-overview-alt-body-skeleton"
    aria-hidden="true">
    <div class="client-overview-alt-body-skeleton__tabs">
      <div
        v-for="index in 8"
        :key="`tab-${index}`"
        class="client-overview-alt-body-skeleton__tab"
        :class="{
          'client-overview-alt-body-skeleton__tab--active': index === 1,
        }"
      />
    </div>

    <div class="client-overview-alt-body-skeleton__panel">
      <div class="client-overview-alt-body-skeleton__panel-header">
        <div
          class="client-overview-alt-body-skeleton__line
            client-overview-alt-body-skeleton__line--title"
        />
        <div class="client-overview-alt-body-skeleton__panel-actions">
          <div
            class="client-overview-alt-body-skeleton__line
              client-overview-alt-body-skeleton__line--search"
          />
          <div
            class="client-overview-alt-body-skeleton__btn"
          />
        </div>
      </div>

      <div class="client-overview-alt-body-skeleton__table">
        <div class="client-overview-alt-body-skeleton__table-head">
          <div
            v-for="index in 7"
            :key="`head-${index}`"
            class="client-overview-alt-body-skeleton__line
              client-overview-alt-body-skeleton__line--col"
          />
        </div>
        <div
          v-for="row in 4"
          :key="`row-${row}`"
          class="client-overview-alt-body-skeleton__table-row">
          <div
            v-for="index in 7"
            :key="`cell-${row}-${index}`"
            class="client-overview-alt-body-skeleton__line
              client-overview-alt-body-skeleton__line--cell"
          />
        </div>
      </div>
    </div>
  </div>
</template>
