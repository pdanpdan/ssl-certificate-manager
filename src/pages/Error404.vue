<template>
  <div class="fixed-center text-center">
    <p>
      <img
        src="~assets/sad.svg"
        style="width: 30vw; max-width: 150px;"
      >
    </p>

    <p class="text-faded">{{ $t('error_404.message') }}<strong>(404)</strong></p>

    <q-btn
      color="secondary"
      style="width: 200px;"
      to="/"
      :label="$t('error_404.btn_back')"
    />
  </div>
</template>
