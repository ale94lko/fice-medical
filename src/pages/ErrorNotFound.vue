<template>
  <div
    class="fullscreen error-page text-center q-pa-md flex flex-center"
    :data-testid="errorNotFoundTestIds.page"
  >
    <div>
      <div style="font-size: 30vh">
        404
      </div>

      <div class="text-h2" style="opacity:.4">
        Oops. Nothing here...
      </div>

      <q-btn
        class="q-mt-xl"
        color="white"
        text-color="blue"
        unelevated
        to="/"
        label="Go Home"
        :data-testid="errorNotFoundTestIds.goHome"
        no-caps />
    </div>
  </div>
</template>

<script setup>
import { errorNotFoundTestIds } from 'src/test-ids/index.js'
</script>
