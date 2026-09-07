import { VueQueryPlugin } from '@repo/api-client';
import { createPinia } from 'pinia';
import { createApp } from 'vue';
import App from './App.vue';
import i18n from './i18n';
import router from './router';
import 'virtual:uno.css';
import './style.css';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(i18n);
app.use(router);
app.use(VueQueryPlugin);
app.mount('#app');
