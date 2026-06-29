<template>

  <section

    class="client-overview-header client-overview-header-skeleton"

    aria-hidden="true">

    <div class="client-overview-header__layout">

      <div class="client-overview-header__main">

        <div class="client-overview-header__profile-head">

          <div class="client-overview-header__avatar-wrap">

            <div class="client-overview-header-skeleton__avatar" />

          </div>



          <div class="client-overview-header__profile-body">

            <div class="client-overview-header-skeleton__line

              client-overview-header-skeleton__line--name" />

            <div class="client-overview-header-skeleton__meta-row">

              <div

                v-for="index in 4"

                :key="`meta-${index}`"

                class="client-overview-header-skeleton__meta-cell">

                <div class="client-overview-header-skeleton__line

                  client-overview-header-skeleton__line--label" />

                <div class="client-overview-header-skeleton__line

                  client-overview-header-skeleton__line--value" />

              </div>

            </div>

            <div class="client-overview-header-skeleton__line

              client-overview-header-skeleton__line--contact" />

            <div class="client-overview-header-skeleton__line

              client-overview-header-skeleton__line--demographics" />

          </div>

        </div>

      </div>



      <div class="client-overview-header__aside-grid">

        <div

          v-for="index in 3"

          :key="`aside-${index}`"

          class="client-overview-header-skeleton__aside-block">

          <div class="client-overview-header-skeleton__line

            client-overview-header-skeleton__line--label" />

          <div class="client-overview-header-skeleton__line

            client-overview-header-skeleton__line--value" />

        </div>

      </div>

    </div>

  </section>

</template>

